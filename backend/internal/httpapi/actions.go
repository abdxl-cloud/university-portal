package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"

	"formbuilder/backend/internal/auth"
	"formbuilder/backend/internal/httpapi/respond"
	"formbuilder/backend/internal/portal"
)

type payInvoiceRequest struct {
	InvoiceID string `json:"invoiceId"`
	Channel   string `json:"channel"`
}

type submitRegistrationRequest struct {
	StudentID string   `json:"studentId"`
	SessionID string   `json:"sessionId"`
	CourseIDs []string `json:"courseIds"`
}

type hostelApplyRequest struct {
	StudentID string `json:"studentId"`
	HallID    string `json:"hallId"`
}

type decisionRequest struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type libraryBookRequest struct {
	StudentID string `json:"studentId"`
	BookID    string `json:"bookId"`
}

type idRequest struct {
	ID string `json:"id"`
}

type appointmentRequest struct {
	StudentID string `json:"studentId"`
	Service   string `json:"service"`
	Date      string `json:"date"`
	Time      string `json:"time"`
}

func (a *API) payInvoice(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "bursary", "ict")
	if !ok {
		return
	}
	var req payInvoiceRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	payment, err := a.portal.PayInvoice(req.InvoiceID, req.Channel, user.ID)
	writeMutation(w, err, map[string]any{"payment": payment})
}

func (a *API) submitCourseRegistration(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "adviser", "hod", "ict")
	if !ok {
		return
	}
	var req submitRegistrationRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	reg, err := a.portal.SubmitCourseRegistration(req.StudentID, req.SessionID, req.CourseIDs, user.ID)
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
	if !decodeJSON(w, r, &req) {
		return
	}
	app, err := a.portal.ApplyHostel(req.StudentID, req.HallID, user.ID)
	writeMutation(w, err, map[string]any{"application": app})
}

func (a *API) decideHostelApplication(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "hostel", "ict")
	if !ok {
		return
	}
	var req decisionRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	app, err := a.portal.DecideHostelApplication(req.ID, req.Status, user.ID)
	writeMutation(w, err, map[string]any{"application": app})
}

func (a *API) borrowBook(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "librarian", "ict")
	if !ok {
		return
	}
	var req libraryBookRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	loan, err := a.portal.BorrowBook(req.StudentID, req.BookID, user.ID)
	writeMutation(w, err, map[string]any{"loan": loan})
}

func (a *API) reserveBook(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "librarian", "ict")
	if !ok {
		return
	}
	var req libraryBookRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	reservation, err := a.portal.ReserveBook(req.StudentID, req.BookID, user.ID)
	writeMutation(w, err, map[string]any{"reservation": reservation})
}

func (a *API) returnLoan(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "librarian", "ict")
	if !ok {
		return
	}
	var req idRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	loan, err := a.portal.ReturnLoan(req.ID, user.ID)
	writeMutation(w, err, map[string]any{"loan": loan})
}

func (a *API) bookAppointment(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "clinic", "ict")
	if !ok {
		return
	}
	var req appointmentRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	appt, err := a.portal.BookAppointment(req.StudentID, req.Service, req.Date, req.Time, user.ID)
	writeMutation(w, err, map[string]any{"appointment": appt})
}

func (a *API) updateAppointmentStatus(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "clinic", "ict")
	if !ok {
		return
	}
	var req decisionRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	appt, err := a.portal.UpdateAppointmentStatus(req.ID, req.Status, user.ID)
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

func writeMutation(w http.ResponseWriter, err error, body any) {
	if err == nil {
		respond.JSON(w, http.StatusOK, body)
		return
	}
	switch {
	case errors.Is(err, portal.ErrNotFound):
		respond.Error(w, http.StatusNotFound, "resource not found")
	case errors.Is(err, portal.ErrInvalidAction):
		respond.Error(w, http.StatusBadRequest, "invalid action")
	case errors.Is(err, portal.ErrUnavailable):
		respond.Error(w, http.StatusConflict, "resource unavailable")
	default:
		respond.Error(w, http.StatusInternalServerError, "operation failed")
	}
}
