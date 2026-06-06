package portal

import "time"

type Money struct {
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
}

type AcademicSession struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Semester  string `json:"semester"`
	IsCurrent bool   `json:"isCurrent"`
}

type Faculty struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Department struct {
	ID        string `json:"id"`
	FacultyID string `json:"facultyId"`
	Name      string `json:"name"`
	Code      string `json:"code"`
}

type Program struct {
	ID           string `json:"id"`
	DepartmentID string `json:"departmentId"`
	Name         string `json:"name"`
	Award        string `json:"award"`
	Duration     int    `json:"duration"`
}

type StudentProfile struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	MatricNo     string `json:"matricNo"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Level        string `json:"level"`
	ProgramID    string `json:"programId"`
	DepartmentID string `json:"departmentId"`
	Status       string `json:"status"`
}

type StaffProfile struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	StaffNo      string `json:"staffNo"`
	DisplayName  string `json:"displayName"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	DepartmentID string `json:"departmentId,omitempty"`
	Office       string `json:"office,omitempty"`
	Status       string `json:"status"`
}

type FeeItem struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Amount   Money  `json:"amount"`
	Required bool   `json:"required"`
}

type Invoice struct {
	ID        string    `json:"id"`
	StudentID string    `json:"studentId"`
	SessionID string    `json:"sessionId"`
	Items     []FeeItem `json:"items"`
	Total     Money     `json:"total"`
	Status    string    `json:"status"`
	IssuedAt  time.Time `json:"issuedAt"`
}

type Payment struct {
	ID        string    `json:"id"`
	InvoiceID string    `json:"invoiceId"`
	Reference string    `json:"reference"`
	Channel   string    `json:"channel"`
	Amount    Money     `json:"amount"`
	Status    string    `json:"status"`
	PaidAt    time.Time `json:"paidAt"`
}

type Course struct {
	ID           string `json:"id"`
	Code         string `json:"code"`
	Title        string `json:"title"`
	Units        int    `json:"units"`
	Level        string `json:"level"`
	Semester     string `json:"semester"`
	DepartmentID string `json:"departmentId"`
	LecturerID   string `json:"lecturerId,omitempty"`
}

type CourseRegistration struct {
	ID        string             `json:"id"`
	StudentID string             `json:"studentId"`
	SessionID string             `json:"sessionId"`
	Status    string             `json:"status"`
	Units     int                `json:"units"`
	Lines     []RegistrationLine `json:"lines"`
	Submitted time.Time          `json:"submittedAt"`
}

type RegistrationLine struct {
	CourseID string `json:"courseId"`
	Code     string `json:"code"`
	Title    string `json:"title"`
	Units    int    `json:"units"`
}

type Result struct {
	ID        string `json:"id"`
	StudentID string `json:"studentId"`
	CourseID  string `json:"courseId"`
	SessionID string `json:"sessionId"`
	CA        int    `json:"ca"`
	Exam      int    `json:"exam"`
	Total     int    `json:"total"`
	Grade     string `json:"grade"`
	Status    string `json:"status"`
}

type HostelHall struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Gender string `json:"gender"`
}

type HostelRoom struct {
	ID       string `json:"id"`
	HallID   string `json:"hallId"`
	RoomNo   string `json:"roomNo"`
	Capacity int    `json:"capacity"`
	Occupied int    `json:"occupied"`
}

type HostelBed struct {
	ID     string `json:"id"`
	RoomID string `json:"roomId"`
	Label  string `json:"label"`
	Status string `json:"status"`
}

type HostelApplication struct {
	ID        string    `json:"id"`
	StudentID string    `json:"studentId"`
	HallID    string    `json:"hallId"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type LibraryBook struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Author    string `json:"author"`
	Category  string `json:"category"`
	Year      int    `json:"year"`
	CallNo    string `json:"callNo"`
	Copies    int    `json:"copies"`
	Available int    `json:"available"`
}

type LibraryLoan struct {
	ID        string    `json:"id"`
	BookID    string    `json:"bookId"`
	StudentID string    `json:"studentId"`
	DueAt     time.Time `json:"dueAt"`
	Status    string    `json:"status"`
	Fine      Money     `json:"fine"`
}

type LibraryReservation struct {
	ID        string    `json:"id"`
	BookID    string    `json:"bookId"`
	StudentID string    `json:"studentId"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type PatientRecord struct {
	ID          string `json:"id"`
	StudentID   string `json:"studentId"`
	BloodGroup  string `json:"bloodGroup"`
	Genotype    string `json:"genotype"`
	Allergies   string `json:"allergies"`
	EmergencyNo string `json:"emergencyNo"`
}

type ClinicAppointment struct {
	ID        string    `json:"id"`
	StudentID string    `json:"studentId"`
	Service   string    `json:"service"`
	Date      string    `json:"date"`
	Time      string    `json:"time"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type Prescription struct {
	ID        string    `json:"id"`
	PatientID string    `json:"patientId"`
	Drug      string    `json:"drug"`
	Dosage    string    `json:"dosage"`
	DoctorID  string    `json:"doctorId"`
	IssuedAt  time.Time `json:"issuedAt"`
}

type PharmacyItem struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Stock  int    `json:"stock"`
	Unit   string `json:"unit"`
	Status string `json:"status"`
}

type Approval struct {
	ID          string    `json:"id"`
	Domain      string    `json:"domain"`
	EntityID    string    `json:"entityId"`
	RequestedBy string    `json:"requestedBy"`
	AssignedTo  string    `json:"assignedTo"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Tone      string    `json:"tone"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"createdAt"`
}

type AuditLog struct {
	ID         string         `json:"id"`
	ActorID    string         `json:"actorId"`
	Action     string         `json:"action"`
	EntityType string         `json:"entityType"`
	EntityID   string         `json:"entityId"`
	Metadata   map[string]any `json:"metadata"`
	CreatedAt  time.Time      `json:"createdAt"`
}

type SupportTicket struct {
	ID        string    `json:"id"`
	StudentID string    `json:"studentId"`
	Subject   string    `json:"subject"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type DashboardSnapshot struct {
	Students         int `json:"students"`
	Staff            int `json:"staff"`
	PendingFees      int `json:"pendingFees"`
	PendingApprovals int `json:"pendingApprovals"`
	LibraryLoans     int `json:"libraryLoans"`
	ClinicQueue      int `json:"clinicQueue"`
	HostelRequests   int `json:"hostelRequests"`
}
