package httpapi

import (
	"net/http"

	"formbuilder/backend/internal/httpapi/respond"
)

func (a *API) portalDashboard(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, a.portal.Dashboard())
}

func (a *API) academicSessions(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"sessions": a.portal.Sessions()})
}

func (a *API) faculties(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"faculties": a.portal.Faculties()})
}

func (a *API) departments(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"departments": a.portal.Departments()})
}

func (a *API) programs(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"programs": a.portal.Programs()})
}

func (a *API) students(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"students": a.portal.Students()})
}

func (a *API) staff(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"staff": a.portal.Staff()})
}

func (a *API) invoices(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"invoices": a.portal.Invoices()})
}

func (a *API) payments(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"payments": a.portal.Payments()})
}

func (a *API) courses(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"courses": a.portal.Courses()})
}

func (a *API) courseRegistrations(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"registrations": a.portal.Registrations()})
}

func (a *API) results(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"results": a.portal.Results()})
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

func (a *API) libraryBooks(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"books": a.portal.LibraryBooks()})
}

func (a *API) libraryLoans(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"loans": a.portal.LibraryLoans()})
}

func (a *API) libraryReservations(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"reservations": a.portal.LibraryReservations()})
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
