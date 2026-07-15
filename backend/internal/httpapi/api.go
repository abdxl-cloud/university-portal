package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"formbuilder/backend/internal/academic"
	"formbuilder/backend/internal/auth"
	"formbuilder/backend/internal/clinic"
	"formbuilder/backend/internal/config"
	"formbuilder/backend/internal/courses"
	"formbuilder/backend/internal/fees"
	"formbuilder/backend/internal/hostels"
	"formbuilder/backend/internal/httpapi/middleware"
	"formbuilder/backend/internal/httpapi/respond"
	"formbuilder/backend/internal/identity"
	"formbuilder/backend/internal/library"
	"formbuilder/backend/internal/modules"
	"formbuilder/backend/internal/ops"
	"formbuilder/backend/internal/registrations"
)

type API struct {
	cfg      config.Config
	logger   *slog.Logger
	auth     *auth.Service
	library  *library.Repo
	academic *academic.Repo
	crs      *courses.Repo
	fees     *fees.Repo
	regs     *registrations.Repo
	hostels  *hostels.Repo
	clinic   *clinic.Repo
	ops      *ops.Repo
	modules  *modules.Repo
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
		cfg:      opts.Config,
		logger:   logger,
		auth:     auth.NewService(opts.Pool, sessionTTL),
		library:  library.NewRepo(opts.Pool),
		academic: academic.NewRepo(opts.Pool),
		crs:      courses.NewRepo(opts.Pool),
		fees:     fees.NewRepo(opts.Pool),
		regs:     registrations.NewRepo(opts.Pool),
		hostels:  hostels.NewRepo(opts.Pool),
		clinic:   clinic.NewRepo(opts.Pool),
		ops:      ops.NewRepo(opts.Pool),
		modules:  modules.NewRepo(opts.Pool),
		ident:    identity.New(opts.Config.IdentitySecret, opts.Config.IdentityTokenTTL),
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
	mux.HandleFunc("GET /api/v1/modules", a.listModules)
	mux.HandleFunc("PATCH /api/v1/modules", a.setModuleEnabled)
	mux.HandleFunc("POST /api/v1/auth/login", a.login)
	mux.HandleFunc("GET /api/v1/me", a.me)
	mux.HandleFunc("POST /api/v1/auth/logout", a.logout)
	mux.HandleFunc("GET /api/v1/dashboard", a.portalDashboard)
	mux.HandleFunc("GET /api/v1/academic/sessions", a.academicSessions)
	mux.HandleFunc("GET /api/v1/academic/faculties", a.faculties)
	mux.HandleFunc("GET /api/v1/academic/departments", a.departments)
	mux.HandleFunc("GET /api/v1/academic/programs", a.programs)
	mux.HandleFunc("GET /api/v1/students", a.students)
	mux.HandleFunc("GET /api/v1/students/{id}", a.studentDetail)
	mux.HandleFunc("GET /api/v1/students/{id}/academic-record", a.studentAcademicRecord)
	mux.HandleFunc("GET /api/v1/staff", a.staff)
	mux.HandleFunc("GET /api/v1/staff/{id}", a.staffDetail)
	mux.HandleFunc("GET /api/v1/fees/invoices", a.moduleHandler("finance", a.invoices))
	mux.HandleFunc("POST /api/v1/fees/invoices/pay", a.moduleHandler("finance", a.payInvoice))
	mux.HandleFunc("GET /api/v1/fees/payments", a.moduleHandler("finance", a.payments))
	mux.HandleFunc("GET /api/v1/courses", a.courses)
	mux.HandleFunc("GET /api/v1/courses/{id}", a.courseDetail)
	mux.HandleFunc("GET /api/v1/course-registrations", a.courseRegistrations)
	mux.HandleFunc("POST /api/v1/course-registrations", a.submitCourseRegistration)
	mux.HandleFunc("PATCH /api/v1/course-registrations/decision", a.decideCourseRegistration)
	mux.HandleFunc("GET /api/v1/results", a.results)
	mux.HandleFunc("POST /api/v1/results/submit", a.submitResults)
	mux.HandleFunc("PATCH /api/v1/results/decision", a.decideResults)
	mux.HandleFunc("POST /api/v1/results/condone", a.condoneResult)
	mux.HandleFunc("GET /api/v1/workflow-stages", a.workflowStages)
	mux.HandleFunc("PUT /api/v1/workflow-stages", a.setWorkflowStages)
	mux.HandleFunc("GET /api/v1/level-review-progress", a.levelReviewProgress)
	mux.HandleFunc("POST /api/v1/level-review-progress/compile", a.compileLevel)
	mux.HandleFunc("PATCH /api/v1/level-review-progress/decision", a.decideLevelStage)
	mux.HandleFunc("POST /api/v1/level-review-progress/publish", a.publishLevel)
	mux.HandleFunc("GET /api/v1/student-cases", a.studentCases)
	mux.HandleFunc("POST /api/v1/student-cases", a.raiseStudentCase)
	mux.HandleFunc("PATCH /api/v1/student-cases/decision", a.decideStudentCase)
	mux.HandleFunc("GET /api/v1/hostels/halls", a.moduleHandler("hostels", a.hostelHalls))
	mux.HandleFunc("GET /api/v1/hostels/rooms", a.moduleHandler("hostels", a.hostelRooms))
	mux.HandleFunc("GET /api/v1/hostels/beds", a.moduleHandler("hostels", a.hostelBeds))
	mux.HandleFunc("GET /api/v1/hostels/applications", a.moduleHandler("hostels", a.hostelApplications))
	mux.HandleFunc("POST /api/v1/hostels/applications", a.moduleHandler("hostels", a.applyHostel))
	mux.HandleFunc("PATCH /api/v1/hostels/applications/decision", a.moduleHandler("hostels", a.decideHostelApplication))
	mux.HandleFunc("GET /api/v1/library/books", a.moduleHandler("library", a.libraryBooks))
	mux.HandleFunc("POST /api/v1/library/books", a.moduleHandler("library", a.createBook))
	mux.HandleFunc("GET /api/v1/library/books/lookup", a.moduleHandler("library", a.lookupBook))
	mux.HandleFunc("POST /api/v1/library/loans", a.moduleHandler("library", a.borrowBook))
	mux.HandleFunc("GET /api/v1/library/loans", a.moduleHandler("library", a.libraryLoans))
	mux.HandleFunc("POST /api/v1/library/loans/scan", a.moduleHandler("library", a.scanCheckout))
	mux.HandleFunc("POST /api/v1/library/loans/return-scan", a.moduleHandler("library", a.scanReturn))
	mux.HandleFunc("PATCH /api/v1/library/loans/return", a.moduleHandler("library", a.returnLoan))
	mux.HandleFunc("GET /api/v1/library/reservations", a.moduleHandler("library", a.libraryReservations))
	mux.HandleFunc("POST /api/v1/library/reservations", a.moduleHandler("library", a.reserveBook))
	mux.HandleFunc("GET /api/v1/identity/qr", a.moduleHandler("identity", a.identityQR))
	mux.HandleFunc("GET /api/v1/verify/{token}", a.moduleHandler("identity", a.verifyToken))
	mux.HandleFunc("GET /api/v1/clinic/patients", a.moduleHandler("clinic", a.patientRecords))
	mux.HandleFunc("POST /api/v1/clinic/appointments", a.moduleHandler("clinic", a.bookAppointment))
	mux.HandleFunc("GET /api/v1/clinic/appointments", a.moduleHandler("clinic", a.clinicAppointments))
	mux.HandleFunc("PATCH /api/v1/clinic/appointments/status", a.moduleHandler("clinic", a.updateAppointmentStatus))
	mux.HandleFunc("GET /api/v1/clinic/prescriptions", a.moduleHandler("clinic", a.prescriptions))
	mux.HandleFunc("GET /api/v1/clinic/pharmacy", a.moduleHandler("clinic", a.pharmacy))
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
