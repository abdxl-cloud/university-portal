package httpapi

import (
	"net/http"

	"formbuilder/backend/internal/httpapi/respond"
)

func (a *API) portalDashboard(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, a.portal.Dashboard())
}

func (a *API) academicSessions(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "sessions", a.academic.Sessions)
}

func (a *API) faculties(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "faculties", a.academic.Faculties)
}

func (a *API) departments(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "departments", a.academic.Departments)
}

func (a *API) programs(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "programs", a.academic.Programs)
}

func (a *API) students(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "students", a.academic.Students)
}

func (a *API) staff(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "staff", a.academic.Staff)
}

func (a *API) invoices(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"invoices": a.portal.Invoices()})
}

func (a *API) payments(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"payments": a.portal.Payments()})
}

func (a *API) courses(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "courses", a.academic.Courses)
}

func (a *API) courseRegistrations(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"registrations": a.portal.Registrations()})
}

func (a *API) results(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "results", a.academic.Results)
}

func (a *API) hostelHalls(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"halls": a.portal.HostelHalls()})
}

func (a *API) hostelRooms(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"rooms": a.portal.HostelRooms()})
}

func (a *API) hostelBeds(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"beds": a.portal.HostelBeds()})
}

func (a *API) hostelApplications(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"applications": a.portal.HostelApplications()})
}

func (a *API) patientRecords(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"patients": a.portal.PatientRecords()})
}

func (a *API) clinicAppointments(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"appointments": a.portal.ClinicAppointments()})
}

func (a *API) prescriptions(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"prescriptions": a.portal.Prescriptions()})
}

func (a *API) pharmacy(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"items": a.portal.Pharmacy()})
}

func (a *API) approvals(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"approvals": a.portal.Approvals()})
}

func (a *API) notifications(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"notifications": a.portal.Notifications()})
}

func (a *API) auditLogs(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"auditLogs": a.portal.AuditLogs()})
}

func (a *API) supportTickets(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"tickets": a.portal.SupportTickets()})
}
