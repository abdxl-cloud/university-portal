package httpapi

import (
	"encoding/json"
	"net/http"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/auth"
	"formbuilder/backend/internal/httpapi/respond"
)

type payInvoiceRequest struct {
	InvoiceID string `json:"invoiceId"`
	Channel   string `json:"channel"`
}

func (r payInvoiceRequest) Validate() error {
	if r.InvoiceID == "" {
		return apperr.Invalid("invoiceId is required")
	}
	return nil
}

type submitRegistrationRequest struct {
	StudentID string   `json:"studentId"`
	SessionID string   `json:"sessionId"`
	CourseIDs []string `json:"courseIds"`
}

func (r submitRegistrationRequest) Validate() error {
	if r.StudentID == "" || r.SessionID == "" {
		return apperr.Invalid("studentId and sessionId are required")
	}
	if len(r.CourseIDs) == 0 {
		return apperr.Invalid("at least one course is required")
	}
	return nil
}

type hostelApplyRequest struct {
	StudentID string `json:"studentId"`
	HallID    string `json:"hallId"`
}

func (r hostelApplyRequest) Validate() error {
	if r.StudentID == "" || r.HallID == "" {
		return apperr.Invalid("studentId and hallId are required")
	}
	return nil
}

type decisionRequest struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

func (r decisionRequest) Validate() error {
	if r.ID == "" {
		return apperr.Invalid("id is required")
	}
	return nil
}

type libraryBookRequest struct {
	StudentID string `json:"studentId"`
	BookID    string `json:"bookId"`
}

func (r libraryBookRequest) Validate() error {
	if r.StudentID == "" || r.BookID == "" {
		return apperr.Invalid("studentId and bookId are required")
	}
	return nil
}

type idRequest struct {
	ID string `json:"id"`
}

func (r idRequest) Validate() error {
	if r.ID == "" {
		return apperr.Invalid("id is required")
	}
	return nil
}

type appointmentRequest struct {
	StudentID string `json:"studentId"`
	Service   string `json:"service"`
	Date      string `json:"date"`
	Time      string `json:"time"`
}

func (r appointmentRequest) Validate() error {
	if r.StudentID == "" || r.Service == "" || r.Date == "" || r.Time == "" {
		return apperr.Invalid("studentId, service, date and time are required")
	}
	return nil
}

func (a *API) payInvoice(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "bursary", "ict")
	if !ok {
		return
	}
	var req payInvoiceRequest
	if !bind(w, r, &req) {
		return
	}
	payment, err := a.fees.PayInvoice(r.Context(), req.InvoiceID, req.Channel, user.ID)
	writeMutation(w, err, map[string]any{"payment": payment})
}

func (a *API) submitCourseRegistration(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "adviser", "hod", "ict")
	if !ok {
		return
	}
	var req submitRegistrationRequest
	if !bind(w, r, &req) {
		return
	}
	reg, err := a.regs.Submit(r.Context(), req.StudentID, req.SessionID, req.CourseIDs, user.ID)
	writeMutation(w, err, map[string]any{"registration": reg})
}

func (a *API) decideApproval(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "adviser", "hod", "dean", "exams", "bursary", "hostel", "registry", "ict")
	if !ok {
		return
	}
	var req decisionRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	approval, err := a.portal.DecideApproval(req.ID, req.Status, user.ID)
	writeMutation(w, err, map[string]any{"approval": approval})
}

func (a *API) applyHostel(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "hostel", "ict")
	if !ok {
		return
	}
	var req hostelApplyRequest
	if !bind(w, r, &req) {
		return
	}
	app, err := a.hostels.Apply(r.Context(), req.StudentID, req.HallID, user.ID)
	writeMutation(w, err, map[string]any{"application": app})
}

func (a *API) decideHostelApplication(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "hostel", "ict")
	if !ok {
		return
	}
	var req decisionRequest
	if !bind(w, r, &req) {
		return
	}
	if req.Status != "allocated" && req.Status != "rejected" {
		writeMutation(w, apperr.Invalid("status must be allocated or rejected"), nil)
		return
	}
	app, err := a.hostels.Decide(r.Context(), req.ID, req.Status, user.ID)
	writeMutation(w, err, map[string]any{"application": app})
}

func (a *API) bookAppointment(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "clinic", "ict")
	if !ok {
		return
	}
	var req appointmentRequest
	if !bind(w, r, &req) {
		return
	}
	appt, err := a.clinic.BookAppointment(r.Context(), req.StudentID, req.Service, req.Date, req.Time, user.ID)
	writeMutation(w, err, map[string]any{"appointment": appt})
}

func (a *API) updateAppointmentStatus(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "clinic", "ict")
	if !ok {
		return
	}
	var req decisionRequest
	if !bind(w, r, &req) {
		return
	}
	switch req.Status {
	case "confirmed", "declined", "completed", "cancelled":
	default:
		writeMutation(w, apperr.Invalid("status must be confirmed, declined, completed or cancelled"), nil)
		return
	}
	appt, err := a.clinic.UpdateAppointmentStatus(r.Context(), req.ID, req.Status, user.ID)
	writeMutation(w, err, map[string]any{"appointment": appt})
}

func (a *API) markNotificationRead(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	var req idRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	notif, err := a.portal.MarkNotificationRead(req.ID, user.ID)
	writeMutation(w, err, map[string]any{"notification": notif})
}

func (a *API) requireUser(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	return a.userFromRequest(w, r)
}

func (a *API) requireRole(w http.ResponseWriter, r *http.Request, roles ...string) (auth.User, bool) {
	user, ok := a.userFromRequest(w, r)
	if !ok {
		return auth.User{}, false
	}
	for _, role := range roles {
		if user.Role == role {
			return user, true
		}
	}
	respond.Error(w, http.StatusForbidden, "forbidden for role")
	return auth.User{}, false
}

func decodeJSON(w http.ResponseWriter, r *http.Request, out any) bool {
	if err := json.NewDecoder(r.Body).Decode(out); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid JSON body")
		return false
	}
	return true
}
