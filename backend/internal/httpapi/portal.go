package httpapi

import (
	"net/http"

	"formbuilder/backend/internal/httpapi/respond"
)

func (a *API) portalDashboard(w http.ResponseWriter, r *http.Request) {
	snapshot, err := a.ops.Dashboard(r.Context())
	if err != nil {
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, snapshot)
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
	serveList(a, w, r, "invoices", a.fees.ListInvoices)
}

func (a *API) payments(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "payments", a.fees.ListPayments)
}

func (a *API) courses(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "courses", a.academic.Courses)
}

func (a *API) courseRegistrations(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "registrations", a.regs.List)
}

func (a *API) results(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "results", a.academic.Results)
}

func (a *API) hostelHalls(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "halls", a.hostels.Halls)
}

func (a *API) hostelRooms(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "rooms", a.hostels.Rooms)
}

func (a *API) hostelBeds(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "beds", a.hostels.Beds)
}

func (a *API) hostelApplications(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "applications", a.hostels.Applications)
}

func (a *API) patientRecords(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "patients", a.clinic.Patients)
}

func (a *API) clinicAppointments(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "appointments", a.clinic.Appointments)
}

func (a *API) prescriptions(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "prescriptions", a.clinic.Prescriptions)
}

func (a *API) pharmacy(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "items", a.clinic.Pharmacy)
}

func (a *API) approvals(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "approvals", a.ops.Approvals)
}

func (a *API) notifications(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "notifications", a.ops.Notifications)
}

func (a *API) auditLogs(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "auditLogs", a.ops.AuditLogs)
}

func (a *API) supportTickets(w http.ResponseWriter, r *http.Request) {
	serveList(a, w, r, "tickets", a.ops.SupportTickets)
}
