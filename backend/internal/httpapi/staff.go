package httpapi

import (
	"net/http"
	"time"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/httpapi/respond"
)

// --- roster + score entry ---

// roster serves GET /api/v1/courses/{id}/roster?sessionId=. Lecturer (owner)
// or ict only -- it's a class list of scores, not public course info.
func (a *API) roster(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "lecturer", "ict")
	if !ok {
		return
	}
	sessionID := r.URL.Query().Get("sessionId")
	if sessionID == "" {
		respond.Err(w, apperr.Invalid("sessionId is required"))
		return
	}
	courseID := r.PathValue("id")
	if user.Role != "ict" {
		scope, ok := a.staffScope(w, r, user)
		if !ok {
			return
		}
		isLecturer, err := a.stf.IsLecturerOf(r.Context(), courseID, scope)
		if err != nil {
			respond.Err(w, err)
			return
		}
		if !isLecturer {
			respond.Error(w, http.StatusForbidden, "not the course lecturer")
			return
		}
	}
	entries, err := a.stf.Roster(r.Context(), courseID, sessionID)
	if err != nil {
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"data": entries})
}

type upsertScoreRequest struct {
	StudentID string `json:"studentId"`
	SessionID string `json:"sessionId"`
	Field     string `json:"field"`
	Value     int    `json:"value"`
}

func (r upsertScoreRequest) Validate() error {
	if r.StudentID == "" || r.SessionID == "" || (r.Field != "ca" && r.Field != "exam") {
		return apperr.Invalid(`studentId, sessionId and field ("ca" or "exam") are required`)
	}
	return nil
}

// upsertScore serves PATCH /api/v1/courses/{id}/roster/score.
func (a *API) upsertScore(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "lecturer", "ict")
	if !ok {
		return
	}
	var req upsertScoreRequest
	if !bind(w, r, &req) {
		return
	}
	staffID := ""
	if user.Role != "ict" {
		scope, ok := a.staffScope(w, r, user)
		if !ok {
			return
		}
		staffID = scope
	}
	entry, err := a.stf.UpsertScore(r.Context(), r.PathValue("id"), req.StudentID, req.SessionID, req.Field, req.Value, staffID, user.ID)
	writeMutation(w, err, map[string]any{"entry": entry})
}

// --- assignments ---

// assignments serves GET /api/v1/courses/{id}/assignments. Any signed-in
// user may read it, same as the course catalogue itself.
func (a *API) assignments(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	page := parsePage(r)
	items, total, err := a.stf.Assignments(r.Context(), page.Limit, page.Offset, r.PathValue("id"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

type createAssignmentRequest struct {
	Title        string `json:"title"`
	DueAt        string `json:"dueAt"`
	Points       int    `json:"points"`
	Instructions string `json:"instructions"`
}

func (r createAssignmentRequest) Validate() error {
	if r.Title == "" || r.DueAt == "" || r.Points <= 0 {
		return apperr.Invalid("title, dueAt and a positive points value are required")
	}
	if _, err := time.Parse(time.RFC3339, r.DueAt); err != nil {
		return apperr.Invalid("dueAt must be an RFC3339 timestamp")
	}
	return nil
}

// createAssignment serves POST /api/v1/courses/{id}/assignments.
func (a *API) createAssignment(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "lecturer", "ict")
	if !ok {
		return
	}
	var req createAssignmentRequest
	if !bind(w, r, &req) {
		return
	}
	staffID := ""
	if user.Role != "ict" {
		scope, ok := a.staffScope(w, r, user)
		if !ok {
			return
		}
		staffID = scope
	}
	dueAt, _ := time.Parse(time.RFC3339, req.DueAt)
	asg, err := a.stf.CreateAssignment(r.Context(), r.PathValue("id"), req.Title, dueAt, req.Points, req.Instructions, staffID, user.ID)
	writeMutation(w, err, map[string]any{"assignment": asg})
}

// assignmentSubmissions serves GET /api/v1/assignments/{id}/submissions.
// Lecturer/ict only -- this is every student's grade on the assignment.
func (a *API) assignmentSubmissions(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "lecturer", "ict"); !ok {
		return
	}
	page := parsePage(r)
	items, total, err := a.stf.Submissions(r.Context(), page.Limit, page.Offset, r.PathValue("id"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

type submitAssignmentRequest struct {
	FileName   string `json:"fileName"`
	Note       string `json:"note"`
	DocumentID string `json:"documentId"`
}

func (r submitAssignmentRequest) Validate() error {
	if r.FileName == "" {
		return apperr.Invalid("fileName is required")
	}
	return nil
}

// submitAssignment serves POST /api/v1/assignments/{id}/submissions: a
// student submits (or resubmits) their own work. documentId is optional --
// the id returned by POST /api/v1/documents after a real upload.
func (a *API) submitAssignment(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student")
	if !ok {
		return
	}
	var req submitAssignmentRequest
	if !bind(w, r, &req) {
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	sub, err := a.stf.Submit(r.Context(), r.PathValue("id"), scope, req.FileName, req.Note, req.DocumentID, user.ID)
	writeMutation(w, err, map[string]any{"submission": sub})
}

type gradeSubmissionRequest struct {
	Grade    int    `json:"grade"`
	Feedback string `json:"feedback"`
}

func (r gradeSubmissionRequest) Validate() error {
	if r.Grade < 0 {
		return apperr.Invalid("grade cannot be negative")
	}
	return nil
}

// gradeSubmission serves PATCH /api/v1/assignment-submissions/{id}/grade.
func (a *API) gradeSubmission(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "lecturer", "ict")
	if !ok {
		return
	}
	var req gradeSubmissionRequest
	if !bind(w, r, &req) {
		return
	}
	staffID := ""
	if user.Role != "ict" {
		scope, ok := a.staffScope(w, r, user)
		if !ok {
			return
		}
		staffID = scope
	}
	sub, err := a.stf.GradeSubmission(r.Context(), r.PathValue("id"), req.Grade, req.Feedback, staffID, user.ID)
	writeMutation(w, err, map[string]any{"submission": sub})
}

// --- materials ---

// materials serves GET /api/v1/courses/{id}/materials. Any signed-in user
// may read it.
func (a *API) materials(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	page := parsePage(r)
	items, total, err := a.stf.Materials(r.Context(), page.Limit, page.Offset, r.PathValue("id"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

type addMaterialRequest struct {
	Name       string `json:"name"`
	FileType   string `json:"fileType"`
	SizeLabel  string `json:"sizeLabel"`
	DocumentID string `json:"documentId"`
}

func (r addMaterialRequest) Validate() error {
	if r.Name == "" {
		return apperr.Invalid("name is required")
	}
	return nil
}

// addMaterial serves POST /api/v1/courses/{id}/materials. documentId is
// optional -- the id returned by POST /api/v1/documents after a real
// upload; without one this is just client-supplied display metadata.
func (a *API) addMaterial(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "lecturer", "ict")
	if !ok {
		return
	}
	var req addMaterialRequest
	if !bind(w, r, &req) {
		return
	}
	staffID := ""
	if user.Role != "ict" {
		scope, ok := a.staffScope(w, r, user)
		if !ok {
			return
		}
		staffID = scope
	}
	m, err := a.stf.AddMaterial(r.Context(), r.PathValue("id"), req.Name, req.FileType, req.SizeLabel, req.DocumentID, staffID, user.ID)
	writeMutation(w, err, map[string]any{"material": m})
}

// --- announcements / stream ---

// coursePosts serves GET /api/v1/courses/{id}/posts. Any signed-in user may
// read it.
func (a *API) coursePosts(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	page := parsePage(r)
	items, total, err := a.stf.Posts(r.Context(), page.Limit, page.Offset, r.PathValue("id"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

type addCoursePostRequest struct {
	Body string `json:"body"`
}

func (r addCoursePostRequest) Validate() error {
	if r.Body == "" {
		return apperr.Invalid("body is required")
	}
	return nil
}

// addCoursePost serves POST /api/v1/courses/{id}/posts: the lecturer (or
// ict) posts, or the class rep for that course's cohort posts on the
// lecturer's behalf.
func (a *API) addCoursePost(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "lecturer", "student", "ict")
	if !ok {
		return
	}
	var req addCoursePostRequest
	if !bind(w, r, &req) {
		return
	}
	courseID := r.PathValue("id")
	switch user.Role {
	case "lecturer":
		scope, ok := a.staffScope(w, r, user)
		if !ok {
			return
		}
		isLecturer, err := a.stf.IsLecturerOf(r.Context(), courseID, scope)
		if err != nil {
			respond.Err(w, err)
			return
		}
		if !isLecturer {
			respond.Error(w, http.StatusForbidden, "not the course lecturer")
			return
		}
	case "student":
		scope, ok := a.studentScope(w, r, user)
		if !ok {
			return
		}
		isRep, err := a.stf.IsClassRepForCourse(r.Context(), courseID, scope)
		if err != nil {
			respond.Err(w, err)
			return
		}
		if !isRep {
			respond.Error(w, http.StatusForbidden, "not the class rep for this course")
			return
		}
	}
	p, err := a.stf.AddPost(r.Context(), courseID, req.Body, user.ID)
	writeMutation(w, err, map[string]any{"post": p})
}

// --- class reps ---

// classReps serves GET /api/v1/class-reps.
func (a *API) classReps(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "adviser", "hod", "ict"); !ok {
		return
	}
	page := parsePage(r)
	q := r.URL.Query()
	items, total, err := a.stf.ClassReps(r.Context(), page.Limit, page.Offset, q.Get("departmentId"), q.Get("sessionId"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

type classRepRequest struct {
	DepartmentID string `json:"departmentId"`
	Level        string `json:"level"`
	SessionID    string `json:"sessionId"`
	StudentID    string `json:"studentId"`
}

func (r classRepRequest) Validate() error {
	if r.DepartmentID == "" || r.Level == "" || r.SessionID == "" || r.StudentID == "" {
		return apperr.Invalid("departmentId, level, sessionId and studentId are required")
	}
	return nil
}

// assignClassRep serves POST /api/v1/class-reps.
func (a *API) assignClassRep(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "adviser", "hod", "ict")
	if !ok {
		return
	}
	var req classRepRequest
	if !bind(w, r, &req) {
		return
	}
	c, err := a.stf.AssignClassRep(r.Context(), req.DepartmentID, req.Level, req.SessionID, req.StudentID, user.ID)
	writeMutation(w, err, map[string]any{"classRep": c})
}

// revokeClassRep serves POST /api/v1/class-reps/revoke.
func (a *API) revokeClassRep(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "adviser", "hod", "ict")
	if !ok {
		return
	}
	var req classRepRequest
	if !bind(w, r, &req) {
		return
	}
	err := a.stf.RevokeClassRep(r.Context(), req.DepartmentID, req.Level, req.SessionID, req.StudentID, user.ID)
	writeMutation(w, err, map[string]any{"revoked": true})
}
