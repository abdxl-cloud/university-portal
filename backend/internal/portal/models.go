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
	Description  string `json:"description,omitempty"`
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
	Note      string             `json:"note,omitempty"`
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
	ISBN      string `json:"isbn,omitempty"`
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

// AcademicRecord is the computed transcript view: per-semester TNU/TCP/GPA
// with a running CGPA, plus any outstanding carryovers. Mirrors what the
// frontend prototype used to hash-generate client-side (detail.jsx's
// StudentRecord/generatedRecord) — now a real query over results/courses.
type AcademicRecordSemester struct {
	SessionID string  `json:"sessionId"`
	Session   string  `json:"session"`
	Semester  string  `json:"semester"`
	TNU       int     `json:"tnu"`
	TCP       int     `json:"tcp"`
	GPA       float64 `json:"gpa"`
	CGPA      float64 `json:"cgpa"`
}

type Carryover struct {
	CourseID  string `json:"courseId"`
	Code      string `json:"code"`
	Title     string `json:"title"`
	FailedIn  string `json:"failedIn"`
	FailScore int    `json:"failScore"`
	Cleared   bool   `json:"cleared"`
}

type AcademicRecord struct {
	StudentID  string                   `json:"studentId"`
	Semesters  []AcademicRecordSemester `json:"semesters"`
	CGPA       float64                  `json:"cgpa"`
	Standing   string                   `json:"standing"`
	Carryovers []Carryover              `json:"carryovers"`
}

// WorkflowStage is one step in the configurable review chain a compiled
// level's results walk through before publication (default: HOD -> Dean).
// Roles lists every role that must sign off before the stage clears — a
// single-role stage (like HOD) needs one approval, a board stage (like a
// scrutiny board or senate) needs one from each listed role.
type WorkflowStage struct {
	ID       string   `json:"id"`
	Position int      `json:"position"`
	Roles    []string `json:"roles"`
	Label    string   `json:"label"`
}

// LevelReviewProgress tracks where one department+level+session cohort's
// compiled results sit in the WorkflowStage chain.
type LevelReviewProgress struct {
	ID           string    `json:"id"`
	DepartmentID string    `json:"departmentId"`
	Level        string    `json:"level"`
	SessionID    string    `json:"sessionId"`
	Stage        string    `json:"stage"`
	ReviewIndex  int       `json:"reviewIndex"`
	Archived     bool      `json:"archived"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// StudentCase is one of the five flagged-record types (deferment, absconded,
// suspended, dex, teaching_practice) that needs a decision before a
// student's record is treated as normal for that session/level.
type StudentCase struct {
	ID           string     `json:"id"`
	StudentID    string     `json:"studentId"`
	SessionID    string     `json:"sessionId"`
	Level        string     `json:"level"`
	Type         string     `json:"type"`
	Status       string     `json:"status"`
	Reason       string     `json:"reason"`
	Details      string     `json:"details,omitempty"`
	AttachmentID string     `json:"attachmentId,omitempty"`
	RaisedBy     string     `json:"raisedBy"`
	DecidedBy    string     `json:"decidedBy,omitempty"`
	DecidedAt    *time.Time `json:"decidedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// Condonement records the 38-39 borderline-F override: the result stays
// graded F but is excluded from the carryover list once condoned.
type Condonement struct {
	ResultID   string    `json:"resultId"`
	CondonedBy string    `json:"condonedBy"`
	CondonedAt time.Time `json:"condonedAt"`
}

// RosterEntry is one row of a lecturer's class list: a registered student
// plus their current (possibly still-being-entered) score for the session.
type RosterEntry struct {
	StudentID string `json:"studentId"`
	MatricNo  string `json:"matricNo"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	CA        *int   `json:"ca,omitempty"`
	Exam      *int   `json:"exam,omitempty"`
	Total     *int   `json:"total,omitempty"`
	Grade     string `json:"grade,omitempty"`
	Status    string `json:"status,omitempty"`
}

type CourseMaterial struct {
	ID         string    `json:"id"`
	CourseID   string    `json:"courseId"`
	UploadedBy string    `json:"uploadedBy"`
	Name       string    `json:"name"`
	FileType   string    `json:"fileType"`
	SizeLabel  string    `json:"sizeLabel"`
	DocumentID string    `json:"documentId,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

type CoursePost struct {
	ID           string    `json:"id"`
	CourseID     string    `json:"courseId"`
	AuthorUserID string    `json:"authorUserId"`
	Body         string    `json:"body"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Assignment struct {
	ID           string    `json:"id"`
	CourseID     string    `json:"courseId"`
	Title        string    `json:"title"`
	DueAt        time.Time `json:"dueAt"`
	Points       int       `json:"points"`
	Instructions string    `json:"instructions,omitempty"`
	CreatedBy    string    `json:"createdBy"`
	CreatedAt    time.Time `json:"createdAt"`
}

type AssignmentSubmission struct {
	ID           string     `json:"id"`
	AssignmentID string     `json:"assignmentId"`
	StudentID    string     `json:"studentId"`
	MatricNo     string     `json:"matricNo,omitempty"`
	StudentName  string     `json:"studentName,omitempty"`
	Status       string     `json:"status"`
	FileName     string     `json:"fileName"`
	Note         string     `json:"note,omitempty"`
	DocumentID   string     `json:"documentId,omitempty"`
	SubmittedAt  time.Time  `json:"submittedAt"`
	Grade        *int       `json:"grade,omitempty"`
	Feedback     string     `json:"feedback,omitempty"`
	GradedBy     string     `json:"gradedBy,omitempty"`
	GradedAt     *time.Time `json:"gradedAt,omitempty"`
}

// Document is an uploaded file's metadata. storage_key (where the bytes
// actually live) is intentionally not exposed over JSON.
type Document struct {
	ID          string    `json:"id"`
	OwnerUserID string    `json:"ownerUserId"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"contentType"`
	SizeBytes   int64     `json:"sizeBytes"`
	CreatedAt   time.Time `json:"createdAt"`
}

// ClassRep is a student recognized as the representative for a
// department+level+session cohort: they can post to that cohort's course
// streams and raise student_cases on a classmate's behalf.
type ClassRep struct {
	DepartmentID string    `json:"departmentId"`
	Level        string    `json:"level"`
	SessionID    string    `json:"sessionId"`
	StudentID    string    `json:"studentId"`
	AssignedBy   string    `json:"assignedBy"`
	AssignedAt   time.Time `json:"assignedAt"`
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
