// Package staff owns a lecturer's course-facing class space: the roster and
// score entry that feeds the results pipeline in internal/courses, plus
// assignments/submissions/grading, materials, announcements ("posts"), and
// department+level+session class reps. Follows backend/CONVENTIONS.md (see
// internal/library for the reference shape).
package staff

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/db"
	"formbuilder/backend/internal/portal"
)

type Repo struct {
	pool *pgxpool.Pool
}

func NewRepo(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

// gradeOf mirrors the frontend's gradeOf() (staff.jsx): CA/30 + exam/70 = /100.
func gradeOf(total int) string {
	switch {
	case total >= 70:
		return "A"
	case total >= 60:
		return "B"
	case total >= 50:
		return "C"
	case total >= 45:
		return "D"
	case total >= 40:
		return "E"
	default:
		return "F"
	}
}

// checkLecturer verifies courseID belongs to staffID. A blank staffID (the
// ict override) skips the check, matching internal/courses.SubmitResults.
func checkLecturer(ctx context.Context, q db.Conn, courseID, staffID string) error {
	if staffID == "" {
		return nil
	}
	var lecturerID string
	err := q.QueryRow(ctx, `SELECT COALESCE(lecturer_id::text, '') FROM courses WHERE id=$1::uuid`, courseID).Scan(&lecturerID)
	if db.IsNotFound(err) {
		return apperr.NotFound("course not found")
	}
	if err != nil {
		return db.Translate(err)
	}
	if lecturerID != staffID {
		return apperr.Forbidden("not the course lecturer")
	}
	return nil
}

// checkDocumentOwner validates that documentID (if non-empty) belongs to
// ownerUserID. A light cross-table check rather than importing
// internal/storage, matching how other domains reference tables they don't
// own outright (e.g. courses joining departments).
func checkDocumentOwner(ctx context.Context, q db.Conn, documentID, ownerUserID string) error {
	if documentID == "" {
		return nil
	}
	var actualOwner string
	err := q.QueryRow(ctx, `SELECT owner_user_id::text FROM documents WHERE id=$1::uuid`, documentID).Scan(&actualOwner)
	if db.IsNotFound(err) {
		return apperr.NotFound("document not found")
	}
	if err != nil {
		return db.Translate(err)
	}
	if actualOwner != ownerUserID {
		return apperr.Forbidden("document does not belong to you")
	}
	return nil
}

// --- roster + score entry ---

// Roster lists every student with an approved registration for courseID in
// sessionID, alongside their current (possibly still being entered) score.
func (r *Repo) Roster(ctx context.Context, courseID, sessionID string) ([]portal.RosterEntry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT s.id::text, s.matric_no, s.first_name, s.last_name, res.ca, res.exam, res.total, COALESCE(res.grade, ''), COALESCE(res.status, '')
		FROM course_registration_lines crl
		JOIN course_registrations cr ON cr.id = crl.registration_id
		JOIN students s ON s.id = cr.student_id
		LEFT JOIN results res ON res.student_id = s.id AND res.course_id = crl.course_id AND res.session_id = cr.session_id
		WHERE crl.course_id = $1::uuid AND cr.session_id = $2::uuid AND cr.status = 'approved'
		ORDER BY s.matric_no`, courseID, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []portal.RosterEntry{}
	for rows.Next() {
		var e portal.RosterEntry
		if err := rows.Scan(&e.StudentID, &e.MatricNo, &e.FirstName, &e.LastName, &e.CA, &e.Exam, &e.Total, &e.Grade, &e.Status); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

// UpsertScore sets one student's CA or exam score for a course+session,
// creating the underlying draft result row on first entry, and recomputes
// total/grade. Locked once the sheet has been submitted (status != draft).
func (r *Repo) UpsertScore(ctx context.Context, courseID, studentID, sessionID, field string, value int, staffID, actorUserID string) (portal.RosterEntry, error) {
	if field != "ca" && field != "exam" {
		return portal.RosterEntry{}, apperr.Invalid(`field must be "ca" or "exam"`)
	}
	if value < 0 || (field == "ca" && value > 30) || (field == "exam" && value > 70) {
		return portal.RosterEntry{}, apperr.Invalid("score out of range")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.RosterEntry, error) {
		if err := checkLecturer(ctx, tx, courseID, staffID); err != nil {
			return portal.RosterEntry{}, err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO results (student_id, course_id, session_id, ca, exam, total, grade, status)
			VALUES ($1::uuid, $2::uuid, $3::uuid, 0, 0, 0, 'F', 'draft')
			ON CONFLICT (student_id, course_id, session_id) DO NOTHING`,
			studentID, courseID, sessionID); err != nil {
			return portal.RosterEntry{}, db.Translate(err)
		}

		var ca, exam, currentTotal int
		var status string
		err := tx.QueryRow(ctx, `
			SELECT ca, exam, total, status FROM results
			WHERE student_id=$1::uuid AND course_id=$2::uuid AND session_id=$3::uuid FOR UPDATE`,
			studentID, courseID, sessionID).Scan(&ca, &exam, &currentTotal, &status)
		if err != nil {
			return portal.RosterEntry{}, db.Translate(err)
		}
		if status != "draft" {
			return portal.RosterEntry{}, apperr.Conflict("scores are locked once submitted")
		}
		if field == "ca" {
			ca = value
		} else {
			exam = value
		}
		total := ca + exam
		grade := gradeOf(total)

		if _, err := tx.Exec(ctx, `UPDATE results SET ca=$4, exam=$5, total=$6, grade=$7 WHERE student_id=$1::uuid AND course_id=$2::uuid AND session_id=$3::uuid`,
			studentID, courseID, sessionID, ca, exam, total, grade); err != nil {
			return portal.RosterEntry{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "score-entry", "result", studentID+":"+courseID, map[string]any{"field": field, "value": value})

		caPtr, examPtr, totalPtr := ca, exam, total
		return portal.RosterEntry{StudentID: studentID, CA: &caPtr, Exam: &examPtr, Total: &totalPtr, Grade: grade, Status: status}, nil
	})
}

// --- assignments ---

func (r *Repo) Assignments(ctx context.Context, limit, offset int, courseID string) ([]portal.Assignment, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM assignments WHERE course_id=$1::uuid`, courseID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, course_id::text, title, due_at, points, instructions, created_by::text, created_at
		FROM assignments WHERE course_id=$3::uuid ORDER BY due_at LIMIT $1 OFFSET $2`, limit, offset, courseID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.Assignment{}
	for rows.Next() {
		var a portal.Assignment
		if err := rows.Scan(&a.ID, &a.CourseID, &a.Title, &a.DueAt, &a.Points, &a.Instructions, &a.CreatedBy, &a.CreatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, a)
	}
	return out, total, rows.Err()
}

func (r *Repo) CreateAssignment(ctx context.Context, courseID, title string, dueAt time.Time, points int, instructions, staffID, actorUserID string) (portal.Assignment, error) {
	if title == "" || points <= 0 {
		return portal.Assignment{}, apperr.Invalid("title and a positive points value are required")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.Assignment, error) {
		if err := checkLecturer(ctx, tx, courseID, staffID); err != nil {
			return portal.Assignment{}, err
		}
		var a portal.Assignment
		err := tx.QueryRow(ctx, `
			INSERT INTO assignments (course_id, title, due_at, points, instructions, created_by)
			VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid)
			RETURNING id::text, course_id::text, title, due_at, points, instructions, created_by::text, created_at`,
			courseID, title, dueAt, points, instructions, actorUserID).
			Scan(&a.ID, &a.CourseID, &a.Title, &a.DueAt, &a.Points, &a.Instructions, &a.CreatedBy, &a.CreatedAt)
		if err != nil {
			return portal.Assignment{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "created", "assignment", a.ID, map[string]any{"course": courseID})
		return a, nil
	})
}

// Submissions lists every submission for an assignment, enriched with the
// student's name/matric for the lecturer grading view.
func (r *Repo) Submissions(ctx context.Context, limit, offset int, assignmentID string) ([]portal.AssignmentSubmission, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM assignment_submissions WHERE assignment_id=$1::uuid`, assignmentID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT sub.id::text, sub.assignment_id::text, sub.student_id::text, s.matric_no, s.first_name || ' ' || s.last_name,
		       sub.status, sub.file_name, sub.note, COALESCE(sub.document_id::text, ''), sub.submitted_at, sub.grade, sub.feedback, COALESCE(sub.graded_by::text, ''), sub.graded_at
		FROM assignment_submissions sub
		JOIN students s ON s.id = sub.student_id
		WHERE sub.assignment_id=$3::uuid ORDER BY sub.submitted_at DESC LIMIT $1 OFFSET $2`, limit, offset, assignmentID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.AssignmentSubmission{}
	for rows.Next() {
		var sub portal.AssignmentSubmission
		if err := rows.Scan(&sub.ID, &sub.AssignmentID, &sub.StudentID, &sub.MatricNo, &sub.StudentName,
			&sub.Status, &sub.FileName, &sub.Note, &sub.DocumentID, &sub.SubmittedAt, &sub.Grade, &sub.Feedback, &sub.GradedBy, &sub.GradedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, sub)
	}
	return out, total, rows.Err()
}

// Submit records (or resubmits) a student's work for an assignment. Once
// graded, resubmission is no longer allowed (matches the frontend, which
// only offers "Resubmit" while status is "submitted"). documentID is
// optional -- a real uploaded file (see internal/storage), which must
// belong to the submitting student if given.
func (r *Repo) Submit(ctx context.Context, assignmentID, studentID, fileName, note, documentID, actorUserID string) (portal.AssignmentSubmission, error) {
	if fileName == "" {
		return portal.AssignmentSubmission{}, apperr.Invalid("fileName is required")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.AssignmentSubmission, error) {
		var existingStatus string
		err := tx.QueryRow(ctx, `SELECT status FROM assignment_submissions WHERE assignment_id=$1::uuid AND student_id=$2::uuid`, assignmentID, studentID).Scan(&existingStatus)
		if err != nil && !db.IsNotFound(err) {
			return portal.AssignmentSubmission{}, db.Translate(err)
		}
		if existingStatus == "graded" {
			return portal.AssignmentSubmission{}, apperr.Conflict("this assignment has already been graded")
		}
		if err := checkDocumentOwner(ctx, tx, documentID, actorUserID); err != nil {
			return portal.AssignmentSubmission{}, err
		}
		var sub portal.AssignmentSubmission
		err = tx.QueryRow(ctx, `
			INSERT INTO assignment_submissions (assignment_id, student_id, status, file_name, note, document_id, submitted_at)
			VALUES ($1::uuid, $2::uuid, 'submitted', $3, $4, $5::uuid, now())
			ON CONFLICT (assignment_id, student_id) DO UPDATE SET file_name=excluded.file_name, note=excluded.note, document_id=excluded.document_id, status='submitted', submitted_at=now()
			RETURNING id::text, assignment_id::text, student_id::text, status, file_name, note, COALESCE(document_id::text, ''), submitted_at, grade, feedback, COALESCE(graded_by::text, ''), graded_at`,
			assignmentID, studentID, fileName, note, db.UUIDOrNil(documentID)).
			Scan(&sub.ID, &sub.AssignmentID, &sub.StudentID, &sub.Status, &sub.FileName, &sub.Note, &sub.DocumentID, &sub.SubmittedAt, &sub.Grade, &sub.Feedback, &sub.GradedBy, &sub.GradedAt)
		if err != nil {
			return portal.AssignmentSubmission{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "submitted", "assignment-submission", sub.ID, nil)
		return sub, nil
	})
}

// GradeSubmission is a lecturer (or ict) grading one submission.
func (r *Repo) GradeSubmission(ctx context.Context, submissionID string, grade int, feedback, staffID, actorUserID string) (portal.AssignmentSubmission, error) {
	if grade < 0 {
		return portal.AssignmentSubmission{}, apperr.Invalid("grade cannot be negative")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.AssignmentSubmission, error) {
		var courseID string
		err := tx.QueryRow(ctx, `
			SELECT c.id::text FROM assignment_submissions sub
			JOIN assignments a ON a.id = sub.assignment_id
			JOIN courses c ON c.id = a.course_id
			WHERE sub.id=$1::uuid`, submissionID).Scan(&courseID)
		if db.IsNotFound(err) {
			return portal.AssignmentSubmission{}, apperr.NotFound("submission not found")
		}
		if err != nil {
			return portal.AssignmentSubmission{}, db.Translate(err)
		}
		if err := checkLecturer(ctx, tx, courseID, staffID); err != nil {
			return portal.AssignmentSubmission{}, err
		}
		var sub portal.AssignmentSubmission
		err = tx.QueryRow(ctx, `
			UPDATE assignment_submissions SET status='graded', grade=$2, feedback=$3, graded_by=$4::uuid, graded_at=now()
			WHERE id=$1::uuid
			RETURNING id::text, assignment_id::text, student_id::text, status, file_name, note, COALESCE(document_id::text, ''), submitted_at, grade, feedback, COALESCE(graded_by::text, ''), graded_at`,
			submissionID, grade, feedback, actorUserID).
			Scan(&sub.ID, &sub.AssignmentID, &sub.StudentID, &sub.Status, &sub.FileName, &sub.Note, &sub.DocumentID, &sub.SubmittedAt, &sub.Grade, &sub.Feedback, &sub.GradedBy, &sub.GradedAt)
		if err != nil {
			return portal.AssignmentSubmission{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "graded", "assignment-submission", sub.ID, map[string]any{"grade": grade})
		return sub, nil
	})
}

// --- materials ---

func (r *Repo) Materials(ctx context.Context, limit, offset int, courseID string) ([]portal.CourseMaterial, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM course_materials WHERE course_id=$1::uuid`, courseID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, course_id::text, uploaded_by::text, name, file_type, size_label, COALESCE(document_id::text, ''), created_at
		FROM course_materials WHERE course_id=$3::uuid ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset, courseID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.CourseMaterial{}
	for rows.Next() {
		var m portal.CourseMaterial
		if err := rows.Scan(&m.ID, &m.CourseID, &m.UploadedBy, &m.Name, &m.FileType, &m.SizeLabel, &m.DocumentID, &m.CreatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, m)
	}
	return out, total, rows.Err()
}

// AddMaterial records a material's metadata, optionally pointing at a real
// uploaded document (see internal/storage), which must belong to the
// uploading staff member if given. Without one, this stays exactly the
// client-supplied-metadata flow the frontend already used (it treats
// uploads as demo-only).
func (r *Repo) AddMaterial(ctx context.Context, courseID, name, fileType, sizeLabel, documentID, staffID, actorUserID string) (portal.CourseMaterial, error) {
	if name == "" {
		return portal.CourseMaterial{}, apperr.Invalid("name is required")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.CourseMaterial, error) {
		if err := checkLecturer(ctx, tx, courseID, staffID); err != nil {
			return portal.CourseMaterial{}, err
		}
		if err := checkDocumentOwner(ctx, tx, documentID, actorUserID); err != nil {
			return portal.CourseMaterial{}, err
		}
		var m portal.CourseMaterial
		err := tx.QueryRow(ctx, `
			INSERT INTO course_materials (course_id, uploaded_by, name, file_type, size_label, document_id)
			VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::uuid)
			RETURNING id::text, course_id::text, uploaded_by::text, name, file_type, size_label, COALESCE(document_id::text, ''), created_at`,
			courseID, actorUserID, name, fileType, sizeLabel, db.UUIDOrNil(documentID)).
			Scan(&m.ID, &m.CourseID, &m.UploadedBy, &m.Name, &m.FileType, &m.SizeLabel, &m.DocumentID, &m.CreatedAt)
		if err != nil {
			return portal.CourseMaterial{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "uploaded", "course-material", m.ID, nil)
		return m, nil
	})
}

// --- announcements / stream ---

func (r *Repo) Posts(ctx context.Context, limit, offset int, courseID string) ([]portal.CoursePost, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM course_posts WHERE course_id=$1::uuid`, courseID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, course_id::text, author_user_id::text, body, created_at
		FROM course_posts WHERE course_id=$3::uuid ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset, courseID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.CoursePost{}
	for rows.Next() {
		var p portal.CoursePost
		if err := rows.Scan(&p.ID, &p.CourseID, &p.AuthorUserID, &p.Body, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, rows.Err()
}

// AddPost records an announcement. Authorization (lecturer of the course, or
// the class rep for the course's cohort) is the handler's job, via
// checkLecturer/IsClassRepForCourse -- this just writes the row.
func (r *Repo) AddPost(ctx context.Context, courseID, body, actorUserID string) (portal.CoursePost, error) {
	if body == "" {
		return portal.CoursePost{}, apperr.Invalid("body is required")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.CoursePost, error) {
		var p portal.CoursePost
		err := tx.QueryRow(ctx, `
			INSERT INTO course_posts (course_id, author_user_id, body) VALUES ($1::uuid, $2::uuid, $3)
			RETURNING id::text, course_id::text, author_user_id::text, body, created_at`,
			courseID, actorUserID, body).
			Scan(&p.ID, &p.CourseID, &p.AuthorUserID, &p.Body, &p.CreatedAt)
		if err != nil {
			return portal.CoursePost{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "posted", "course-post", p.ID, map[string]any{"course": courseID})
		return p, nil
	})
}

// --- class reps ---

func (r *Repo) ClassReps(ctx context.Context, limit, offset int, departmentID, sessionID string) ([]portal.ClassRep, int, error) {
	deptScope := db.UUIDOrNil(departmentID)
	sessScope := db.UUIDOrNil(sessionID)
	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT count(*) FROM class_reps
		WHERE ($1::uuid IS NULL OR department_id=$1::uuid) AND ($2::uuid IS NULL OR session_id=$2::uuid)`,
		deptScope, sessScope).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT department_id::text, level, session_id::text, student_id::text, assigned_by::text, assigned_at
		FROM class_reps
		WHERE ($3::uuid IS NULL OR department_id=$3::uuid) AND ($4::uuid IS NULL OR session_id=$4::uuid)
		ORDER BY assigned_at DESC LIMIT $1 OFFSET $2`, limit, offset, deptScope, sessScope)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.ClassRep{}
	for rows.Next() {
		var c portal.ClassRep
		if err := rows.Scan(&c.DepartmentID, &c.Level, &c.SessionID, &c.StudentID, &c.AssignedBy, &c.AssignedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, c)
	}
	return out, total, rows.Err()
}

// AssignClassRep recognizes studentID as the rep for a department+level+
// session cohort. studentID must actually belong to that department+level.
func (r *Repo) AssignClassRep(ctx context.Context, departmentID, level, sessionID, studentID, actorUserID string) (portal.ClassRep, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.ClassRep, error) {
		var belongs bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM students WHERE id=$1::uuid AND department_id=$2::uuid AND level=$3)`,
			studentID, departmentID, level).Scan(&belongs); err != nil {
			return portal.ClassRep{}, db.Translate(err)
		}
		if !belongs {
			return portal.ClassRep{}, apperr.Invalid("student does not belong to that department and level")
		}
		var c portal.ClassRep
		err := tx.QueryRow(ctx, `
			INSERT INTO class_reps (department_id, level, session_id, student_id, assigned_by)
			VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5::uuid)
			RETURNING department_id::text, level, session_id::text, student_id::text, assigned_by::text, assigned_at`,
			departmentID, level, sessionID, studentID, actorUserID).
			Scan(&c.DepartmentID, &c.Level, &c.SessionID, &c.StudentID, &c.AssignedBy, &c.AssignedAt)
		if err != nil {
			return portal.ClassRep{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "assigned", "class-rep", studentID, map[string]any{"department": departmentID, "level": level})
		return c, nil
	})
}

func (r *Repo) RevokeClassRep(ctx context.Context, departmentID, level, sessionID, studentID, actorUserID string) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM class_reps WHERE department_id=$1::uuid AND level=$2 AND session_id=$3::uuid AND student_id=$4::uuid`,
		departmentID, level, sessionID, studentID)
	if err != nil {
		return db.Translate(err)
	}
	if tag.RowsAffected() == 0 {
		return apperr.NotFound("class rep assignment not found")
	}
	r.audit(ctx, r.pool, actorUserID, "revoked", "class-rep", studentID, map[string]any{"department": departmentID, "level": level})
	return nil
}

// IsLecturerOf reports whether staffID is courseID's lecturer. Used by
// handlers that need to check ownership before an operation the repo itself
// doesn't gate (e.g. AddPost, shared with the class-rep posting path).
func (r *Repo) IsLecturerOf(ctx context.Context, courseID, staffID string) (bool, error) {
	var lecturerID string
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(lecturer_id::text, '') FROM courses WHERE id=$1::uuid`, courseID).Scan(&lecturerID)
	if db.IsNotFound(err) {
		return false, apperr.NotFound("course not found")
	}
	if err != nil {
		return false, err
	}
	return lecturerID == staffID, nil
}

// IsClassRepForCourse reports whether studentID is a recognized class rep
// for courseID's department+level, in any session. Used to let a rep post
// announcements alongside the lecturer.
func (r *Repo) IsClassRepForCourse(ctx context.Context, courseID, studentID string) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM class_reps cr
			JOIN courses c ON c.department_id = cr.department_id AND c.level = cr.level
			WHERE cr.student_id = $1::uuid AND c.id = $2::uuid
		)`, studentID, courseID).Scan(&ok)
	return ok, err
}

// IsClassRepFor reports whether repStudentID is the class rep, for
// sessionID, of the department+level that targetStudentID belongs to. Used
// to let a rep raise a student_case on a classmate's behalf.
func (r *Repo) IsClassRepFor(ctx context.Context, repStudentID, targetStudentID, sessionID string) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM class_reps cr
			JOIN students target ON target.id = $2::uuid
			WHERE cr.student_id = $1::uuid AND cr.session_id = $3::uuid
			  AND cr.department_id = target.department_id AND cr.level = target.level
		)`, repStudentID, targetStudentID, sessionID).Scan(&ok)
	return ok, err
}

func (r *Repo) audit(ctx context.Context, q db.Conn, actorUserID, action, entityType, entityID string, extra map[string]any) {
	if extra == nil {
		extra = map[string]any{}
	}
	payload, err := json.Marshal(extra)
	if err != nil {
		return
	}
	var actor any
	if actorUserID != "" {
		actor = actorUserID
	}
	_, _ = q.Exec(ctx, `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1::uuid, $2, $3, $4, $5::jsonb)`,
		actor, action, entityType, entityID, string(payload))
}
