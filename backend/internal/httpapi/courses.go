package httpapi

import (
	"net/http"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/courses"
	"formbuilder/backend/internal/httpapi/respond"
)

// --- results submit / decide / condone ---

type resultSheetRequest struct {
	CourseID  string `json:"courseId"`
	SessionID string `json:"sessionId"`
}

func (r resultSheetRequest) Validate() error {
	if r.CourseID == "" || r.SessionID == "" {
		return apperr.Invalid("courseId and sessionId are required")
	}
	return nil
}

// submitResults serves POST /api/v1/results/submit: a lecturer (or ict)
// marks their course's draft results for a session as ready for review.
func (a *API) submitResults(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "lecturer", "ict")
	if !ok {
		return
	}
	var req resultSheetRequest
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
	n, err := a.crs.SubmitResults(r.Context(), req.CourseID, req.SessionID, staffID, user.ID)
	writeMutation(w, err, map[string]any{"updated": n})
}

type resultSheetDecisionRequest struct {
	CourseID  string `json:"courseId"`
	SessionID string `json:"sessionId"`
	Status    string `json:"status"`
	Note      string `json:"note"`
}

func (r resultSheetDecisionRequest) Validate() error {
	if r.CourseID == "" || r.SessionID == "" {
		return apperr.Invalid("courseId and sessionId are required")
	}
	return nil
}

// decideResults serves PATCH /api/v1/results/decision: approve a submitted
// result sheet, or query it back to the lecturer.
func (a *API) decideResults(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "adviser", "hod", "dean", "exams", "ict")
	if !ok {
		return
	}
	var req resultSheetDecisionRequest
	if !bind(w, r, &req) {
		return
	}
	if req.Status != "approved" && req.Status != "query" {
		writeMutation(w, apperr.Invalid(`status must be "approved" or "query"`), nil)
		return
	}
	n, err := a.crs.DecideResults(r.Context(), req.CourseID, req.SessionID, req.Status, req.Note, user.ID)
	writeMutation(w, err, map[string]any{"updated": n})
}

type condoneRequest struct {
	ResultID string `json:"resultId"`
}

func (r condoneRequest) Validate() error {
	if r.ResultID == "" {
		return apperr.Invalid("resultId is required")
	}
	return nil
}

// condoneResult serves POST /api/v1/results/condone: the 38-39 borderline-F
// override.
func (a *API) condoneResult(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "hod", "dean", "exams", "ict")
	if !ok {
		return
	}
	var req condoneRequest
	if !bind(w, r, &req) {
		return
	}
	c, err := a.crs.CondoneResult(r.Context(), req.ResultID, user.ID)
	writeMutation(w, err, map[string]any{"condonement": c})
}

// --- workflow stages ---

// workflowStages serves GET /api/v1/workflow-stages: the configurable review
// chain (default HOD -> Dean). Any signed-in user may read it.
func (a *API) workflowStages(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	stages, err := a.crs.WorkflowStages(r.Context())
	if err != nil {
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"data": stages})
}

type workflowStageInputRequest struct {
	Position int      `json:"position"`
	Roles    []string `json:"roles"`
	Label    string   `json:"label"`
}

type setWorkflowStagesRequest struct {
	Stages []workflowStageInputRequest `json:"stages"`
}

func (r setWorkflowStagesRequest) Validate() error {
	if len(r.Stages) == 0 {
		return apperr.Invalid("at least one stage is required")
	}
	seen := map[int]bool{}
	for _, s := range r.Stages {
		if s.Position <= 0 || len(s.Roles) == 0 || s.Label == "" {
			return apperr.Invalid("each stage needs a position, at least one role, and a label")
		}
		if seen[s.Position] {
			return apperr.Invalid("stage positions must be unique")
		}
		seen[s.Position] = true
	}
	return nil
}

// setWorkflowStages serves PUT /api/v1/workflow-stages: a full replace of the
// review chain (ICT only).
func (a *API) setWorkflowStages(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "ict")
	if !ok {
		return
	}
	var req setWorkflowStagesRequest
	if !bind(w, r, &req) {
		return
	}
	inputs := make([]courses.WorkflowStageInput, len(req.Stages))
	for i, s := range req.Stages {
		inputs[i] = courses.WorkflowStageInput{Position: s.Position, Roles: s.Roles, Label: s.Label}
	}
	stages, err := a.crs.SetWorkflowStages(r.Context(), inputs, user.ID)
	writeMutation(w, err, map[string]any{"data": stages})
}

// --- level review progress ---

// levelReviewProgress serves GET /api/v1/level-review-progress.
func (a *API) levelReviewProgress(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "adviser", "hod", "dean", "exams", "registry", "ict"); !ok {
		return
	}
	page := parsePage(r)
	q := r.URL.Query()
	items, total, err := a.crs.LevelReviewProgress(r.Context(), page.Limit, page.Offset, q.Get("departmentId"), q.Get("sessionId"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

type compileLevelRequest struct {
	DepartmentID string `json:"departmentId"`
	Level        string `json:"level"`
	SessionID    string `json:"sessionId"`
}

func (r compileLevelRequest) Validate() error {
	if r.DepartmentID == "" || r.Level == "" || r.SessionID == "" {
		return apperr.Invalid("departmentId, level and sessionId are required")
	}
	return nil
}

// compileLevel serves POST /api/v1/level-review-progress/compile: opens the
// review chain for a department+level+session cohort once every result is
// approved.
func (a *API) compileLevel(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "hod", "exams", "ict")
	if !ok {
		return
	}
	var req compileLevelRequest
	if !bind(w, r, &req) {
		return
	}
	lrp, err := a.crs.CompileLevel(r.Context(), req.DepartmentID, req.Level, req.SessionID, user.ID)
	writeMutation(w, err, map[string]any{"levelReview": lrp})
}

type levelStageDecisionRequest struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

func (r levelStageDecisionRequest) Validate() error {
	if r.ID == "" {
		return apperr.Invalid("id is required")
	}
	return nil
}

// decideLevelStage serves PATCH /api/v1/level-review-progress/decision: the
// actor at the current stage approves (advancing the chain) or queries
// (kicking the cohort back to compiling). The caller's role must match the
// current stage's actor_role, or be ict.
func (a *API) decideLevelStage(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "hod", "dean", "ict")
	if !ok {
		return
	}
	var req levelStageDecisionRequest
	if !bind(w, r, &req) {
		return
	}
	if req.Status != "approved" && req.Status != "queried" {
		writeMutation(w, apperr.Invalid(`status must be "approved" or "queried"`), nil)
		return
	}
	lrp, err := a.crs.DecideStage(r.Context(), req.ID, req.Status, user.Role, user.ID)
	writeMutation(w, err, map[string]any{"levelReview": lrp})
}

type publishLevelRequest struct {
	ID string `json:"id"`
}

func (r publishLevelRequest) Validate() error {
	if r.ID == "" {
		return apperr.Invalid("id is required")
	}
	return nil
}

// publishLevel serves POST /api/v1/level-review-progress/publish: releases
// every approved result for the cohort once the review chain is cleared.
func (a *API) publishLevel(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "exams", "registry", "ict")
	if !ok {
		return
	}
	var req publishLevelRequest
	if !bind(w, r, &req) {
		return
	}
	lrp, err := a.crs.PublishLevel(r.Context(), req.ID, user.ID)
	writeMutation(w, err, map[string]any{"levelReview": lrp})
}

// --- student cases ---

// studentCases serves GET /api/v1/student-cases: a student sees only their
// own cases; staff roles see any, optionally filtered by ?studentId=.
func (a *API) studentCases(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "adviser", "hod", "dean", "exams", "registry", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	page := parsePage(r)
	q := r.URL.Query()
	studentID := scope
	if studentID == "" {
		studentID = q.Get("studentId")
	}
	items, total, err := a.crs.StudentCases(r.Context(), page.Limit, page.Offset, studentID, q.Get("type"), q.Get("status"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

type raiseCaseRequest struct {
	StudentID    string `json:"studentId"`
	SessionID    string `json:"sessionId"`
	Level        string `json:"level"`
	Type         string `json:"type"`
	Reason       string `json:"reason"`
	Details      string `json:"details"`
	AttachmentID string `json:"attachmentId"`
}

func (r raiseCaseRequest) Validate() error {
	if r.SessionID == "" || r.Level == "" || r.Type == "" || r.Reason == "" {
		return apperr.Invalid("sessionId, level, type and reason are required")
	}
	return nil
}

// raiseStudentCase serves POST /api/v1/student-cases: a student raises a
// case for themselves (or, if they're the class rep for the target
// student's department+level+session, on a classmate's behalf), or
// adviser/hod/registry/ict raises one on a student's behalf.
func (a *API) raiseStudentCase(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "adviser", "hod", "registry", "ict")
	if !ok {
		return
	}
	var req raiseCaseRequest
	if !bind(w, r, &req) {
		return
	}
	var studentID string
	if user.Role == "student" {
		scope, ok := a.studentScope(w, r, user)
		if !ok {
			return
		}
		if req.StudentID == "" || req.StudentID == scope {
			studentID = scope
		} else {
			isRep, err := a.stf.IsClassRepFor(r.Context(), scope, req.StudentID, req.SessionID)
			if err != nil {
				respond.Err(w, err)
				return
			}
			if !isRep {
				respond.Error(w, http.StatusForbidden, "cannot raise a case for another student")
				return
			}
			studentID = req.StudentID
		}
	} else {
		studentID = req.StudentID
	}
	if studentID == "" {
		respond.Err(w, apperr.Invalid("studentId is required"))
		return
	}
	sc, err := a.crs.RaiseCase(r.Context(), courses.RaiseCaseInput{
		StudentID:    studentID,
		SessionID:    req.SessionID,
		Level:        req.Level,
		Type:         req.Type,
		Reason:       req.Reason,
		Details:      req.Details,
		AttachmentID: req.AttachmentID,
	}, user.ID)
	writeMutation(w, err, map[string]any{"case": sc})
}

type caseDecisionRequest struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

func (r caseDecisionRequest) Validate() error {
	if r.ID == "" {
		return apperr.Invalid("id is required")
	}
	return nil
}

// decideStudentCase serves PATCH /api/v1/student-cases/decision.
func (a *API) decideStudentCase(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "hod", "dean", "registry", "ict")
	if !ok {
		return
	}
	var req caseDecisionRequest
	if !bind(w, r, &req) {
		return
	}
	if req.Status != "approved" && req.Status != "declined" {
		writeMutation(w, apperr.Invalid(`status must be "approved" or "declined"`), nil)
		return
	}
	sc, err := a.crs.DecideCase(r.Context(), req.ID, req.Status, user.ID)
	writeMutation(w, err, map[string]any{"case": sc})
}
