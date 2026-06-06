package portal

import (
	"errors"
	"fmt"
	"time"
)

var (
	ErrNotFound      = errors.New("resource not found")
	ErrInvalidAction = errors.New("invalid action")
	ErrUnavailable   = errors.New("resource unavailable")
)

func (s *Store) PayInvoice(invoiceID, channel, actorID string) (Payment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.invoices {
		if s.invoices[i].ID == invoiceID {
			if s.invoices[i].Status == "paid" {
				return Payment{}, ErrInvalidAction
			}
			s.invoices[i].Status = "paid"
			payment := Payment{
				ID:        "pay-" + newID(),
				InvoiceID: invoiceID,
				Reference: "TRX-" + newID(),
				Channel:   channel,
				Amount:    s.invoices[i].Total,
				Status:    "confirmed",
				PaidAt:    time.Now().UTC(),
			}
			s.payments = append([]Payment{payment}, s.payments...)
			s.auditLogs = append(s.auditLogs, audit(actorID, "paid", "invoice", invoiceID, map[string]any{"channel": channel}))
			return payment, nil
		}
	}
	return Payment{}, ErrNotFound
}

func (s *Store) SubmitCourseRegistration(studentID, sessionID string, courseIDs []string, actorID string) (CourseRegistration, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(courseIDs) == 0 {
		return CourseRegistration{}, ErrInvalidAction
	}
	var lines []RegistrationLine
	var units int
	for _, id := range courseIDs {
		course, ok := findCourse(s.courses, id)
		if !ok {
			return CourseRegistration{}, ErrNotFound
		}
		lines = append(lines, RegistrationLine{CourseID: course.ID, Code: course.Code, Title: course.Title, Units: course.Units})
		units += course.Units
	}
	reg := CourseRegistration{ID: "reg-" + newID(), StudentID: studentID, SessionID: sessionID, Status: "pending", Units: units, Lines: lines, Submitted: time.Now().UTC()}
	s.registrations = append([]CourseRegistration{reg}, s.registrations...)
	s.approvals = append([]Approval{{ID: "appr-" + newID(), Domain: "course-registration", EntityID: reg.ID, RequestedBy: studentID, AssignedTo: "hod", Status: "pending", CreatedAt: time.Now().UTC()}}, s.approvals...)
	s.auditLogs = append(s.auditLogs, audit(actorID, "submitted", "course-registration", reg.ID, map[string]any{"units": units}))
	return reg, nil
}

func (s *Store) DecideApproval(id, status, actorID string) (Approval, error) {
	if status != "approved" && status != "rejected" && status != "queried" {
		return Approval{}, ErrInvalidAction
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.approvals {
		if s.approvals[i].ID == id {
			s.approvals[i].Status = status
			if s.approvals[i].Domain == "course-registration" {
				for j := range s.registrations {
					if s.registrations[j].ID == s.approvals[i].EntityID {
						s.registrations[j].Status = status
					}
				}
			}
			s.auditLogs = append(s.auditLogs, audit(actorID, status, "approval", id, map[string]any{"domain": s.approvals[i].Domain}))
			return s.approvals[i], nil
		}
	}
	return Approval{}, ErrNotFound
}

func (s *Store) ApplyHostel(studentID, hallID, actorID string) (HostelApplication, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !existsHall(s.halls, hallID) {
		return HostelApplication{}, ErrNotFound
	}
	app := HostelApplication{ID: "happ-" + newID(), StudentID: studentID, HallID: hallID, Status: "pending", CreatedAt: time.Now().UTC()}
	s.hostelApps = append([]HostelApplication{app}, s.hostelApps...)
	s.auditLogs = append(s.auditLogs, audit(actorID, "submitted", "hostel-application", app.ID, nil))
	return app, nil
}

func (s *Store) DecideHostelApplication(id, status, actorID string) (HostelApplication, error) {
	if status != "allocated" && status != "rejected" {
		return HostelApplication{}, ErrInvalidAction
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.hostelApps {
		if s.hostelApps[i].ID == id {
			s.hostelApps[i].Status = status
			s.auditLogs = append(s.auditLogs, audit(actorID, status, "hostel-application", id, nil))
			return s.hostelApps[i], nil
		}
	}
	return HostelApplication{}, ErrNotFound
}

func (s *Store) BorrowBook(studentID, bookID, actorID string) (LibraryLoan, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.books {
		if s.books[i].ID == bookID {
			if s.books[i].Available < 1 {
				return LibraryLoan{}, ErrUnavailable
			}
			s.books[i].Available--
			loan := LibraryLoan{ID: "loan-" + newID(), BookID: bookID, StudentID: studentID, DueAt: time.Now().UTC().AddDate(0, 0, 14), Status: "on-loan", Fine: naira(0)}
			s.loans = append([]LibraryLoan{loan}, s.loans...)
			s.auditLogs = append(s.auditLogs, audit(actorID, "borrowed", "library-book", bookID, nil))
			return loan, nil
		}
	}
	return LibraryLoan{}, ErrNotFound
}

func (s *Store) ReserveBook(studentID, bookID, actorID string) (LibraryReservation, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !existsBook(s.books, bookID) {
		return LibraryReservation{}, ErrNotFound
	}
	res := LibraryReservation{ID: "lres-" + newID(), BookID: bookID, StudentID: studentID, Status: "waiting", CreatedAt: time.Now().UTC()}
	s.reservations = append([]LibraryReservation{res}, s.reservations...)
	s.auditLogs = append(s.auditLogs, audit(actorID, "reserved", "library-book", bookID, nil))
	return res, nil
}

func (s *Store) ReturnLoan(id, actorID string) (LibraryLoan, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.loans {
		if s.loans[i].ID == id {
			s.loans[i].Status = "returned"
			for j := range s.books {
				if s.books[j].ID == s.loans[i].BookID {
					s.books[j].Available++
				}
			}
			s.auditLogs = append(s.auditLogs, audit(actorID, "returned", "library-loan", id, nil))
			return s.loans[i], nil
		}
	}
	return LibraryLoan{}, ErrNotFound
}

func (s *Store) BookAppointment(studentID, service, date, slot, actorID string) (ClinicAppointment, error) {
	if service == "" || date == "" || slot == "" {
		return ClinicAppointment{}, ErrInvalidAction
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	appt := ClinicAppointment{ID: "appt-" + newID(), StudentID: studentID, Service: service, Date: date, Time: slot, Status: "pending", CreatedAt: time.Now().UTC()}
	s.appointments = append([]ClinicAppointment{appt}, s.appointments...)
	s.auditLogs = append(s.auditLogs, audit(actorID, "booked", "clinic-appointment", appt.ID, nil))
	return appt, nil
}

func (s *Store) UpdateAppointmentStatus(id, status, actorID string) (ClinicAppointment, error) {
	if status != "confirmed" && status != "declined" && status != "completed" && status != "cancelled" {
		return ClinicAppointment{}, ErrInvalidAction
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.appointments {
		if s.appointments[i].ID == id {
			s.appointments[i].Status = status
			s.auditLogs = append(s.auditLogs, audit(actorID, status, "clinic-appointment", id, nil))
			return s.appointments[i], nil
		}
	}
	return ClinicAppointment{}, ErrNotFound
}

func (s *Store) MarkNotificationRead(id, actorID string) (Notification, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.notifications {
		if s.notifications[i].ID == id {
			s.notifications[i].Read = true
			s.auditLogs = append(s.auditLogs, audit(actorID, "read", "notification", id, nil))
			return s.notifications[i], nil
		}
	}
	return Notification{}, ErrNotFound
}

func findCourse(courses []Course, id string) (Course, bool) {
	for _, course := range courses {
		if course.ID == id {
			return course, true
		}
	}
	return Course{}, false
}

func existsHall(halls []HostelHall, id string) bool {
	for _, hall := range halls {
		if hall.ID == id {
			return true
		}
	}
	return false
}

func existsBook(books []LibraryBook, id string) bool {
	for _, book := range books {
		if book.ID == id {
			return true
		}
	}
	return false
}

func audit(actorID, action, entityType, entityID string, metadata map[string]any) AuditLog {
	if metadata == nil {
		metadata = map[string]any{}
	}
	return AuditLog{ID: "aud-" + newID(), ActorID: actorID, Action: action, EntityType: entityType, EntityID: entityID, Metadata: metadata, CreatedAt: time.Now().UTC()}
}

func newID() string {
	return fmt.Sprintf("%d", time.Now().UTC().UnixNano())
}
