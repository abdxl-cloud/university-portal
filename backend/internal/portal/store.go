package portal

import (
	"sync"
	"time"
)

type Store struct {
	mu            sync.Mutex
	sessions      []AcademicSession
	faculties     []Faculty
	departments   []Department
	programs      []Program
	students      []StudentProfile
	staff         []StaffProfile
	invoices      []Invoice
	payments      []Payment
	courses       []Course
	registrations []CourseRegistration
	results       []Result
	halls         []HostelHall
	rooms         []HostelRoom
	beds          []HostelBed
	hostelApps    []HostelApplication
	books         []LibraryBook
	loans         []LibraryLoan
	reservations  []LibraryReservation
	patients      []PatientRecord
	appointments  []ClinicAppointment
	prescriptions []Prescription
	pharmacy      []PharmacyItem
	approvals     []Approval
	notifications []Notification
	auditLogs     []AuditLog
	tickets       []SupportTicket
}

func NewDemoStore() *Store {
	now := time.Now().UTC()
	session := AcademicSession{ID: "ses-2025-1", Name: "2025/2026", Semester: "First Semester", IsCurrent: true}
	faculty := Faculty{ID: "fac-computing", Name: "Faculty of Computing"}
	dept := Department{ID: "dept-csc", FacultyID: faculty.ID, Name: "Computer Science", Code: "CSC"}
	program := Program{ID: "prog-csc-bsc", DepartmentID: dept.ID, Name: "Computer Science", Award: "B.Sc.", Duration: 4}
	student := StudentProfile{ID: "stu-adaeze", UserID: "usr-student", MatricNo: "FUT/2022/CSC/10428", FirstName: "Adaeze", LastName: "Okeke", Email: "student@futech.edu.ng", Phone: "+234 803 555 0188", Level: "300L", ProgramID: program.ID, DepartmentID: dept.ID, Status: "active"}
	staff := []StaffProfile{
		{ID: "stf-lecturer", UserID: "usr-lecturer", StaffNo: "FUT/STF/CSC/0391", DisplayName: "Dr. F. Okonkwo", Email: "lecturer@futech.edu.ng", Role: "lecturer", DepartmentID: dept.ID, Office: "CS Block, Rm 19", Status: "active"},
		{ID: "stf-hod", UserID: "usr-hod", StaffNo: "FUT/STF/CSC/0102", DisplayName: "Prof. Kunle Adewale", Email: "hod@futech.edu.ng", Role: "hod", DepartmentID: dept.ID, Office: "CS Block, Rm 02", Status: "active"},
		{ID: "stf-bursary", UserID: "usr-bursary", StaffNo: "FUT/STF/BUR/0319", DisplayName: "Mrs. Halima Bello", Email: "bursary@futech.edu.ng", Role: "bursary", Office: "Bursary Block, Rm 4", Status: "active"},
		{ID: "stf-library", UserID: "usr-librarian", StaffNo: "FUT/STF/LIB/0044", DisplayName: "Mrs. Grace Eze", Email: "library@futech.edu.ng", Role: "librarian", Office: "Main Library, Desk 1", Status: "active"},
		{ID: "stf-clinic", UserID: "usr-clinic", StaffNo: "FUT/STF/MED/0009", DisplayName: "Dr. Ahmed Bello", Email: "clinic@futech.edu.ng", Role: "clinic", Office: "Medical Centre, Rm 1", Status: "active"},
	}
	feeItems := []FeeItem{
		{ID: "fee-tuition", Label: "Tuition", Amount: naira(85000), Required: true},
		{ID: "fee-medical", Label: "Medical / Health Services", Amount: naira(4000), Required: true},
		{ID: "fee-library", Label: "Library & E-Resources", Amount: naira(3500), Required: true},
		{ID: "fee-ict", Label: "ICT Levy", Amount: naira(6000), Required: true},
	}
	courses := []Course{
		{ID: "crs-csc301", Code: "CSC 301", Title: "Data Structures & Algorithms", Units: 3, Level: "300L", Semester: "First Semester", DepartmentID: dept.ID, LecturerID: "stf-lecturer"},
		{ID: "crs-csc303", Code: "CSC 303", Title: "Operating Systems", Units: 3, Level: "300L", Semester: "First Semester", DepartmentID: dept.ID, LecturerID: "stf-lecturer"},
		{ID: "crs-csc305", Code: "CSC 305", Title: "Database Management Systems", Units: 3, Level: "300L", Semester: "First Semester", DepartmentID: dept.ID, LecturerID: "stf-lecturer"},
	}
	books := []LibraryBook{
		{ID: "book-algo", Title: "Introduction to Algorithms", Author: "Cormen, Leiserson, Rivest & Stein", Category: "Computer Science", Year: 2009, CallNo: "QA76.6 .C66", Copies: 6, Available: 2},
		{ID: "book-db", Title: "Database System Concepts", Author: "Silberschatz, Korth & Sudarshan", Category: "Computer Science", Year: 2019, CallNo: "QA76.9 .S55", Copies: 5, Available: 0},
	}
	return &Store{
		sessions:    []AcademicSession{session},
		faculties:   []Faculty{faculty},
		departments: []Department{dept},
		programs:    []Program{program},
		students:    []StudentProfile{student},
		staff:       staff,
		invoices: []Invoice{{
			ID: "inv-2025-001", StudentID: student.ID, SessionID: session.ID, Items: feeItems,
			Total: naira(98500), Status: "pending", IssuedAt: now.AddDate(0, 0, -10),
		}},
		payments: []Payment{},
		courses:  courses,
		registrations: []CourseRegistration{{
			ID: "reg-001", StudentID: student.ID, SessionID: session.ID, Status: "pending", Units: 9,
			Lines: []RegistrationLine{
				{CourseID: courses[0].ID, Code: courses[0].Code, Title: courses[0].Title, Units: courses[0].Units},
				{CourseID: courses[1].ID, Code: courses[1].Code, Title: courses[1].Title, Units: courses[1].Units},
				{CourseID: courses[2].ID, Code: courses[2].Code, Title: courses[2].Title, Units: courses[2].Units},
			},
			Submitted: now.AddDate(0, 0, -2),
		}},
		results:       []Result{{ID: "res-001", StudentID: student.ID, CourseID: courses[2].ID, SessionID: session.ID, CA: 27, Exam: 58, Total: 85, Grade: "A", Status: "published"}},
		halls:         []HostelHall{{ID: "hall-amina", Name: "Queen Amina Hall", Gender: "Female"}, {ID: "hall-saints", Name: "Saint's Hall", Gender: "Male"}},
		rooms:         []HostelRoom{{ID: "room-a204", HallID: "hall-amina", RoomNo: "A204", Capacity: 4, Occupied: 3}},
		beds:          []HostelBed{{ID: "bed-a204-a", RoomID: "room-a204", Label: "A", Status: "available"}, {ID: "bed-a204-b", RoomID: "room-a204", Label: "B", Status: "occupied"}},
		hostelApps:    []HostelApplication{{ID: "happ-001", StudentID: student.ID, HallID: "hall-amina", Status: "pending", CreatedAt: now.AddDate(0, 0, -1)}},
		books:         books,
		loans:         []LibraryLoan{{ID: "loan-001", BookID: books[0].ID, StudentID: student.ID, DueAt: now.AddDate(0, 0, 9), Status: "on-loan", Fine: naira(0)}},
		reservations:  []LibraryReservation{{ID: "lres-001", BookID: books[1].ID, StudentID: student.ID, Status: "waiting", CreatedAt: now.AddDate(0, 0, -1)}},
		patients:      []PatientRecord{{ID: "pat-001", StudentID: student.ID, BloodGroup: "O+", Genotype: "AA", Allergies: "Penicillin", EmergencyNo: "+234 803 555 0188"}},
		appointments:  []ClinicAppointment{{ID: "appt-001", StudentID: student.ID, Service: "General Consultation", Date: "Dec 9, 2025", Time: "09:30", Status: "confirmed", CreatedAt: now.AddDate(0, 0, -1)}},
		prescriptions: []Prescription{{ID: "rx-001", PatientID: "pat-001", Drug: "Artemether/Lumefantrine", Dosage: "80/480mg twice daily for 3 days", DoctorID: "stf-clinic", IssuedAt: now.AddDate(0, -1, 0)}},
		pharmacy:      []PharmacyItem{{ID: "drug-act", Name: "Artemether/Lumefantrine", Stock: 18, Unit: "packs", Status: "low"}, {ID: "drug-paracetamol", Name: "Paracetamol 500mg", Stock: 240, Unit: "tablets", Status: "ok"}},
		approvals:     []Approval{{ID: "appr-reg-001", Domain: "course-registration", EntityID: "reg-001", RequestedBy: student.ID, AssignedTo: "stf-hod", Status: "pending", CreatedAt: now.AddDate(0, 0, -2)}},
		notifications: []Notification{{ID: "not-001", UserID: "usr-student", Title: "Registration submitted", Body: "Your course form is awaiting approval.", Tone: "warning", Read: false, CreatedAt: now.AddDate(0, 0, -2)}},
		auditLogs:     []AuditLog{{ID: "aud-001", ActorID: "usr-student", Action: "submitted", EntityType: "course-registration", EntityID: "reg-001", Metadata: map[string]any{"units": 9}, CreatedAt: now.AddDate(0, 0, -2)}},
		tickets:       []SupportTicket{{ID: "tic-001", StudentID: student.ID, Subject: "Unable to download receipt", Status: "open", CreatedAt: now.AddDate(0, 0, -3)}},
	}
}

func naira(amount int64) Money {
	return Money{Amount: amount, Currency: "NGN"}
}

func (s *Store) Dashboard() DashboardSnapshot {
	return DashboardSnapshot{
		Students: len(s.students), Staff: len(s.staff),
		PendingFees: countStatusInvoices(s.invoices, "pending"), PendingApprovals: countStatusApprovals(s.approvals, "pending"),
		LibraryLoans: len(s.loans), ClinicQueue: len(s.appointments), HostelRequests: countStatusHostel(s.hostelApps, "pending"),
	}
}

func (s *Store) Sessions() []AcademicSession               { return clone(s.sessions) }
func (s *Store) Faculties() []Faculty                      { return clone(s.faculties) }
func (s *Store) Departments() []Department                 { return clone(s.departments) }
func (s *Store) Programs() []Program                       { return clone(s.programs) }
func (s *Store) Students() []StudentProfile                { return clone(s.students) }
func (s *Store) Staff() []StaffProfile                     { return clone(s.staff) }
func (s *Store) Invoices() []Invoice                       { return clone(s.invoices) }
func (s *Store) Payments() []Payment                       { return clone(s.payments) }
func (s *Store) Courses() []Course                         { return clone(s.courses) }
func (s *Store) Registrations() []CourseRegistration       { return clone(s.registrations) }
func (s *Store) Results() []Result                         { return clone(s.results) }
func (s *Store) HostelHalls() []HostelHall                 { return clone(s.halls) }
func (s *Store) HostelRooms() []HostelRoom                 { return clone(s.rooms) }
func (s *Store) HostelBeds() []HostelBed                   { return clone(s.beds) }
func (s *Store) HostelApplications() []HostelApplication   { return clone(s.hostelApps) }
func (s *Store) LibraryBooks() []LibraryBook               { return clone(s.books) }
func (s *Store) LibraryLoans() []LibraryLoan               { return clone(s.loans) }
func (s *Store) LibraryReservations() []LibraryReservation { return clone(s.reservations) }
func (s *Store) PatientRecords() []PatientRecord           { return clone(s.patients) }
func (s *Store) ClinicAppointments() []ClinicAppointment   { return clone(s.appointments) }
func (s *Store) Prescriptions() []Prescription             { return clone(s.prescriptions) }
func (s *Store) Pharmacy() []PharmacyItem                  { return clone(s.pharmacy) }
func (s *Store) Approvals() []Approval                     { return clone(s.approvals) }
func (s *Store) Notifications() []Notification             { return clone(s.notifications) }
func (s *Store) AuditLogs() []AuditLog                     { return clone(s.auditLogs) }
func (s *Store) SupportTickets() []SupportTicket           { return clone(s.tickets) }

func clone[T any](in []T) []T {
	out := make([]T, len(in))
	copy(out, in)
	return out
}

func countStatusInvoices(in []Invoice, status string) int {
	var n int
	for _, item := range in {
		if item.Status == status {
			n++
		}
	}
	return n
}

func countStatusApprovals(in []Approval, status string) int {
	var n int
	for _, item := range in {
		if item.Status == status {
			n++
		}
	}
	return n
}

func countStatusHostel(in []HostelApplication, status string) int {
	var n int
	for _, item := range in {
		if item.Status == status {
			n++
		}
	}
	return n
}
