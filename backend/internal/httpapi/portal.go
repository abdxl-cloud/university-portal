package httpapi

import (
	"context"
	"net/http"

	"formbuilder/backend/internal/auth"
	"formbuilder/backend/internal/httpapi/respond"
)

func hasRole(user auth.User, roles ...string) bool {
	for _, role := range roles {
		if user.Role == role {
			return true
		}
	}
	return false
}

func (a *API) studentScope(w http.ResponseWriter, r *http.Request, user auth.User) (string, bool) {
	if user.Role != "student" {
		return "", true
	}
	id, err := a.academic.StudentIDByUserID(r.Context(), user.ID)
	if err != nil {
		a.logger.Error("resolve student identity", "error", err)
		respond.Error(w, http.StatusForbidden, "student profile unavailable")
		return "", false
	}
	return id, true
}

func scopedList[T any](a *API, w http.ResponseWriter, r *http.Request, name string, scope string, fetch func(context.Context, int, int, string) ([]T, int, error)) {
	page := parsePage(r)
	items, total, err := fetch(r.Context(), page.Limit, page.Offset, scope)
	if err != nil {
		a.logger.Error("list "+name, "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

func (a *API) portalDashboard(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "adviser", "hod", "dean", "exams", "bursary", "librarian", "clinic", "hostel", "registry", "ict"); !ok {
		return
	}
	snapshot, err := a.ops.Dashboard(r.Context())
	if err != nil {
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, snapshot)
}

func (a *API) academicSessions(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	serveList(a, w, r, "sessions", a.academic.Sessions)
}
func (a *API) faculties(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	serveList(a, w, r, "faculties", a.academic.Faculties)
}
func (a *API) departments(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	serveList(a, w, r, "departments", a.academic.Departments)
}
func (a *API) programs(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	serveList(a, w, r, "programs", a.academic.Programs)
}
func (a *API) courses(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	page := parsePage(r)
	q := r.URL.Query()
	items, total, err := a.academic.Courses(r.Context(), page.Limit, page.Offset, q.Get("departmentId"), q.Get("level"), q.Get("semester"))
	if err != nil {
		a.logger.Error("list courses", "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}
func (a *API) hostelHalls(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	serveList(a, w, r, "halls", a.hostels.Halls)
}
func (a *API) hostelRooms(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	serveList(a, w, r, "rooms", a.hostels.Rooms)
}
func (a *API) hostelBeds(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "hostel", "ict"); !ok {
		return
	}
	serveList(a, w, r, "beds", a.hostels.Beds)
}
func (a *API) pharmacy(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "clinic", "ict"); !ok {
		return
	}
	serveList(a, w, r, "items", a.clinic.Pharmacy)
}

func (a *API) students(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "adviser", "hod", "dean", "exams", "registry", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	page := parsePage(r)
	q := r.URL.Query()
	items, total, err := a.academic.Students(r.Context(), page.Limit, page.Offset, scope, q.Get("departmentId"), q.Get("level"))
	if err != nil {
		a.logger.Error("list students", "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

// studentAcademicRecord serves GET /api/v1/students/{id}/academic-record.
// {id} may be "me" (resolved via studentScope for the calling student) or a
// real student id (staff roles only).
func (a *API) studentAcademicRecord(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	id := r.PathValue("id")
	if id == "me" {
		if user.Role != "student" {
			respond.Error(w, http.StatusForbidden, "forbidden for role")
			return
		}
		scope, ok := a.studentScope(w, r, user)
		if !ok {
			return
		}
		id = scope
	} else if user.Role != "student" && !hasRole(user, "adviser", "hod", "dean", "exams", "registry", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	} else if user.Role == "student" {
		scope, ok := a.studentScope(w, r, user)
		if !ok {
			return
		}
		if scope != id {
			respond.Error(w, http.StatusForbidden, "forbidden for role")
			return
		}
	}
	rec, err := a.academic.AcademicRecord(r.Context(), id)
	if err != nil {
		a.logger.Error("academic record", "error", err)
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, rec)
}

func (a *API) staff(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role == "student" {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	page := parsePage(r)
	items, total, err := a.academic.Staff(r.Context(), page.Limit, page.Offset, r.URL.Query().Get("departmentId"))
	if err != nil {
		a.logger.Error("list staff", "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}
func (a *API) invoices(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "bursary", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	scopedList(a, w, r, "invoices", scope, a.fees.ListInvoices)
}
func (a *API) payments(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "bursary", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	scopedList(a, w, r, "payments", scope, a.fees.ListPayments)
}
func (a *API) courseRegistrations(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "adviser", "hod", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	scopedList(a, w, r, "registrations", scope, a.regs.List)
}
func (a *API) results(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "lecturer", "adviser", "hod", "dean", "exams", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	scopedList(a, w, r, "results", scope, a.academic.Results)
}
func (a *API) hostelApplications(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "hostel", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	scopedList(a, w, r, "applications", scope, a.hostels.Applications)
}
func (a *API) clinicAppointments(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "clinic", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	scopedList(a, w, r, "appointments", scope, a.clinic.Appointments)
}
func (a *API) patientRecords(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "clinic", "ict"); !ok {
		return
	}
	serveList(a, w, r, "patients", a.clinic.Patients)
}
func (a *API) prescriptions(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "clinic", "ict"); !ok {
		return
	}
	serveList(a, w, r, "prescriptions", a.clinic.Prescriptions)
}
func (a *API) approvals(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "adviser", "hod", "dean", "exams", "bursary", "hostel", "registry", "ict")
	if !ok {
		return
	}
	page := parsePage(r)
	items, total, err := a.ops.Approvals(r.Context(), page.Limit, page.Offset, user.Role)
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}
func (a *API) notifications(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	page := parsePage(r)
	items, total, err := a.ops.Notifications(r.Context(), page.Limit, page.Offset, user.ID, user.Role == "ict")
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}
func (a *API) auditLogs(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "ict"); !ok {
		return
	}
	serveList(a, w, r, "auditLogs", a.ops.AuditLogs)
}
func (a *API) supportTickets(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "registry", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	scopedList(a, w, r, "tickets", scope, a.ops.SupportTickets)
}
