package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"formbuilder/backend/internal/academic"
	"formbuilder/backend/internal/auth"
	"formbuilder/backend/internal/config"
	"formbuilder/backend/internal/fees"
	"formbuilder/backend/internal/hostels"
	"formbuilder/backend/internal/httpapi/middleware"
	"formbuilder/backend/internal/httpapi/respond"
	"formbuilder/backend/internal/identity"
	"formbuilder/backend/internal/library"
	"formbuilder/backend/internal/portal"
	"formbuilder/backend/internal/registrations"
)

type API struct {
	cfg     config.Config
	logger  *slog.Logger
	auth     *auth.Service
	portal   *portal.Store
	library  *library.Repo
	academic *academic.Repo
	fees     *fees.Repo
	regs     *registrations.Repo
	hostels  *hostels.Repo
	ident    *identity.Signer
}

type Options struct {
	Config config.Config
	Logger *slog.Logger
	Pool   *pgxpool.Pool
}

func New(opts Options) *API {
	logger := opts.Logger
	if logger == nil {
		logger = slog.Default()
	}
	sessionTTL, err := time.ParseDuration(opts.Config.RefreshTokenTTL)
	if err != nil {
		sessionTTL = 168 * time.Hour
	}
	return &API{
		cfg:     opts.Config,
		logger:  logger,
		auth:     auth.NewService(opts.Pool, sessionTTL),
		portal:   portal.NewDemoStore(),
		library:  library.NewRepo(opts.Pool),
		academic: academic.NewRepo(opts.Pool),
		fees:     fees.NewRepo(opts.Pool),
		regs:     registrations.NewRepo(opts.Pool),
		hostels:  hostels.NewRepo(opts.Pool),
		ident:    identity.New(opts.Config.IdentitySecret),
	}
}

// CleanupExpiredSessions prunes expired session rows. Intended to be called
// periodically by the process owner (see cmd/api).
func (a *API) CleanupExpiredSessions(ctx context.Context) (int64, error) {
	return a.auth.CleanupExpired(ctx)
}

func (a *API) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /", a.root)
	mux.HandleFunc("GET /docs", a.docs)
	mux.HandleFunc("GET /openapi.json", a.openapi)
	mux.HandleFunc("GET /healthz", a.health)
	mux.HandleFunc("GET /api/v1/health", a.health)
	mux.HandleFunc("GET /api/v1/version", a.version)
	mux.HandleFunc("POST /api/v1/auth/login", a.login)
	mux.HandleFunc("GET /api/v1/me", a.me)
	mux.HandleFunc("POST /api/v1/auth/logout", a.logout)
	mux.HandleFunc("GET /api/v1/dashboard", a.portalDashboard)
	mux.HandleFunc("GET /api/v1/academic/sessions", a.academicSessions)
	mux.HandleFunc("GET /api/v1/academic/faculties", a.faculties)
	mux.HandleFunc("GET /api/v1/academic/departments", a.departments)
	mux.HandleFunc("GET /api/v1/academic/programs", a.programs)
	mux.HandleFunc("GET /api/v1/students", a.students)
	mux.HandleFunc("GET /api/v1/staff", a.staff)
	mux.HandleFunc("GET /api/v1/fees/invoices", a.invoices)
	mux.HandleFunc("POST /api/v1/fees/invoices/pay", a.payInvoice)
	mux.HandleFunc("GET /api/v1/fees/payments", a.payments)
	mux.HandleFunc("GET /api/v1/courses", a.courses)
	mux.HandleFunc("GET /api/v1/course-registrations", a.courseRegistrations)
	mux.HandleFunc("POST /api/v1/course-registrations", a.submitCourseRegistration)
	mux.HandleFunc("GET /api/v1/results", a.results)
	mux.HandleFunc("GET /api/v1/hostels/halls", a.hostelHalls)
	mux.HandleFunc("GET /api/v1/hostels/rooms", a.hostelRooms)
	mux.HandleFunc("GET /api/v1/hostels/beds", a.hostelBeds)
	mux.HandleFunc("GET /api/v1/hostels/applications", a.hostelApplications)
	mux.HandleFunc("POST /api/v1/hostels/applications", a.applyHostel)
	mux.HandleFunc("PATCH /api/v1/hostels/applications/decision", a.decideHostelApplication)
	mux.HandleFunc("GET /api/v1/library/books", a.libraryBooks)
	mux.HandleFunc("POST /api/v1/library/books", a.createBook)
	mux.HandleFunc("GET /api/v1/library/books/lookup", a.lookupBook)
	mux.HandleFunc("POST /api/v1/library/loans", a.borrowBook)
	mux.HandleFunc("GET /api/v1/library/loans", a.libraryLoans)
	mux.HandleFunc("POST /api/v1/library/loans/scan", a.scanCheckout)
	mux.HandleFunc("POST /api/v1/library/loans/return-scan", a.scanReturn)
	mux.HandleFunc("PATCH /api/v1/library/loans/return", a.returnLoan)
	mux.HandleFunc("GET /api/v1/library/reservations", a.libraryReservations)
	mux.HandleFunc("POST /api/v1/library/reservations", a.reserveBook)
	mux.HandleFunc("GET /api/v1/identity/qr", a.identityQR)
	mux.HandleFunc("GET /api/v1/verify/{token}", a.verifyToken)
	mux.HandleFunc("GET /api/v1/clinic/patients", a.patientRecords)
	mux.HandleFunc("POST /api/v1/clinic/appointments", a.bookAppointment)
	mux.HandleFunc("GET /api/v1/clinic/appointments", a.clinicAppointments)
	mux.HandleFunc("PATCH /api/v1/clinic/appointments/status", a.updateAppointmentStatus)
	mux.HandleFunc("GET /api/v1/clinic/prescriptions", a.prescriptions)
	mux.HandleFunc("GET /api/v1/clinic/pharmacy", a.pharmacy)
	mux.HandleFunc("GET /api/v1/approvals", a.approvals)
	mux.HandleFunc("PATCH /api/v1/approvals/decision", a.decideApproval)
	mux.HandleFunc("GET /api/v1/notifications", a.notifications)
	mux.HandleFunc("PATCH /api/v1/notifications/read", a.markNotificationRead)
	mux.HandleFunc("GET /api/v1/audit-logs", a.auditLogs)
	mux.HandleFunc("GET /api/v1/support/tickets", a.supportTickets)

	var handler http.Handler = mux
	handler = middleware.CORS(a.cfg.AllowedOrigins)(handler)
	handler = middleware.Recover(a.logger)(handler)
	handler = middleware.RequestLog(a.logger)(handler)
	return handler
}

func (a *API) root(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/docs", http.StatusFound)
}

func (a *API) health(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (a *API) version(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{
		"name":    "formbuilder-backend",
		"version": "0.1.0",
		"env":     a.cfg.Env,
	})
}
