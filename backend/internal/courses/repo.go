// Package courses owns the course-results release pipeline: a lecturer
// submits a course's scores, staff decide the sheet, a whole
// department+level+session cohort walks the configurable workflow_stages
// review chain, and is finally published (released to transcripts). It also
// owns the student_cases mechanism (deferment/absconded/suspended/dex/
// teaching_practice) and the grade_condonements borderline-F override.
// Follows backend/CONVENTIONS.md (see internal/library for the reference
// shape: apperr + db.Translate/InTx + audit_logs on every mutation).
package courses

import (
	"context"
	"encoding/json"

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

func nullIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// --- results submit / decide ---

// SubmitResults transitions a course's draft results for a session to
// 'submitted'. When staffID is non-empty (a lecturer, not ict) the course
// must belong to that lecturer.
func (r *Repo) SubmitResults(ctx context.Context, courseID, sessionID, staffID, actorUserID string) (int64, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (int64, error) {
		if staffID != "" {
			var lecturerID string
			err := tx.QueryRow(ctx, `SELECT COALESCE(lecturer_id::text, '') FROM courses WHERE id=$1::uuid`, courseID).Scan(&lecturerID)
			if db.IsNotFound(err) {
				return 0, apperr.NotFound("course not found")
			}
			if err != nil {
				return 0, db.Translate(err)
			}
			if lecturerID != staffID {
				return 0, apperr.Forbidden("not the course lecturer")
			}
		}
		tag, err := tx.Exec(ctx, `UPDATE results SET status='submitted' WHERE course_id=$1::uuid AND session_id=$2::uuid AND status='draft'`, courseID, sessionID)
		if err != nil {
			return 0, db.Translate(err)
		}
		n := tag.RowsAffected()
		if n == 0 {
			return 0, apperr.Invalid("no draft results to submit for this course and session")
		}
		r.audit(ctx, tx, actorUserID, "submitted", "result-sheet", courseID+":"+sessionID, map[string]any{"count": n})
		return n, nil
	})
}

// DecideResults approves a submitted result sheet (-> approved) or queries it
// back to the lecturer (-> draft) for a course+session.
func (r *Repo) DecideResults(ctx context.Context, courseID, sessionID, status, note, actorUserID string) (int64, error) {
	if status != "approved" && status != "query" {
		return 0, apperr.Invalid(`status must be "approved" or "query"`)
	}
	newStatus := "approved"
	if status == "query" {
		newStatus = "draft"
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (int64, error) {
		tag, err := tx.Exec(ctx, `UPDATE results SET status=$3 WHERE course_id=$1::uuid AND session_id=$2::uuid AND status='submitted'`, courseID, sessionID, newStatus)
		if err != nil {
			return 0, db.Translate(err)
		}
		n := tag.RowsAffected()
		if n == 0 {
			return 0, apperr.NotFound("no submitted results for this course and session")
		}
		r.audit(ctx, tx, actorUserID, status, "result-sheet", courseID+":"+sessionID, map[string]any{"note": note, "count": n})
		return n, nil
	})
}

// --- workflow stages (the configurable HOD -> Dean chain) ---

func (r *Repo) WorkflowStages(ctx context.Context) ([]portal.WorkflowStage, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT ws.id::text, ws.position, ws.label, COALESCE(array_agg(wsr.actor_role ORDER BY wsr.actor_role) FILTER (WHERE wsr.actor_role IS NOT NULL), '{}')
		FROM workflow_stages ws
		LEFT JOIN workflow_stage_roles wsr ON wsr.stage_id = ws.id
		GROUP BY ws.id, ws.position, ws.label
		ORDER BY ws.position`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []portal.WorkflowStage{}
	for rows.Next() {
		var s portal.WorkflowStage
		if err := rows.Scan(&s.ID, &s.Position, &s.Label, &s.Roles); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

type WorkflowStageInput struct {
	Position int
	Roles    []string
	Label    string
}

// SetWorkflowStages fully replaces the review chain (ICT only; role checked
// by the handler). Positions must be unique and 1-indexed by the caller;
// each stage needs at least one required role.
func (r *Repo) SetWorkflowStages(ctx context.Context, stages []WorkflowStageInput, actorUserID string) ([]portal.WorkflowStage, error) {
	if len(stages) == 0 {
		return nil, apperr.Invalid("at least one stage is required")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) ([]portal.WorkflowStage, error) {
		if _, err := tx.Exec(ctx, `DELETE FROM workflow_stages`); err != nil {
			return nil, db.Translate(err)
		}
		out := make([]portal.WorkflowStage, 0, len(stages))
		for _, s := range stages {
			if len(s.Roles) == 0 {
				return nil, apperr.Invalid("each stage needs at least one required role")
			}
			var ws portal.WorkflowStage
			err := tx.QueryRow(ctx, `INSERT INTO workflow_stages (position, label) VALUES ($1,$2) RETURNING id::text, position, label`,
				s.Position, s.Label).Scan(&ws.ID, &ws.Position, &ws.Label)
			if err != nil {
				return nil, db.Translate(err)
			}
			for _, role := range s.Roles {
				if _, err := tx.Exec(ctx, `INSERT INTO workflow_stage_roles (stage_id, actor_role) VALUES ($1::uuid, $2)`, ws.ID, role); err != nil {
					return nil, db.Translate(err)
				}
			}
			ws.Roles = s.Roles
			out = append(out, ws)
		}
		r.audit(ctx, tx, actorUserID, "replaced", "workflow-stages", "", map[string]any{"count": len(out)})
		return out, nil
	})
}

// --- level review progress ---

func (r *Repo) LevelReviewProgress(ctx context.Context, limit, offset int, departmentID, sessionID string) ([]portal.LevelReviewProgress, int, error) {
	deptScope := db.UUIDOrNil(departmentID)
	sessScope := db.UUIDOrNil(sessionID)
	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT count(*) FROM level_review_progress
		WHERE ($1::uuid IS NULL OR department_id=$1::uuid) AND ($2::uuid IS NULL OR session_id=$2::uuid)`,
		deptScope, sessScope).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, department_id::text, level, session_id::text, stage, review_index, archived, updated_at
		FROM level_review_progress
		WHERE ($3::uuid IS NULL OR department_id=$3::uuid) AND ($4::uuid IS NULL OR session_id=$4::uuid)
		ORDER BY updated_at DESC LIMIT $1 OFFSET $2`, limit, offset, deptScope, sessScope)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.LevelReviewProgress{}
	for rows.Next() {
		var lrp portal.LevelReviewProgress
		if err := rows.Scan(&lrp.ID, &lrp.DepartmentID, &lrp.Level, &lrp.SessionID, &lrp.Stage, &lrp.ReviewIndex, &lrp.Archived, &lrp.UpdatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, lrp)
	}
	return out, total, rows.Err()
}

// CompileLevel opens (or restarts) a department+level+session cohort's
// review at the first configured stage. Every result for students in that
// cohort must already be 'approved'.
func (r *Repo) CompileLevel(ctx context.Context, departmentID, level, sessionID, actorUserID string) (portal.LevelReviewProgress, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.LevelReviewProgress, error) {
		var pending int
		if err := tx.QueryRow(ctx, `
			SELECT count(*) FROM results r
			JOIN students st ON st.id = r.student_id
			WHERE st.department_id=$1::uuid AND st.level=$2 AND r.session_id=$3::uuid AND r.status <> 'approved'`,
			departmentID, level, sessionID).Scan(&pending); err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		if pending > 0 {
			return portal.LevelReviewProgress{}, apperr.Conflict("not every result for this cohort is approved yet")
		}
		var firstStage int
		if err := tx.QueryRow(ctx, `SELECT COALESCE(MIN(position), 0) FROM workflow_stages`).Scan(&firstStage); err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		if firstStage == 0 {
			return portal.LevelReviewProgress{}, apperr.Invalid("no workflow stages configured")
		}
		var lrp portal.LevelReviewProgress
		err := tx.QueryRow(ctx, `
			INSERT INTO level_review_progress (department_id, level, session_id, stage, review_index)
			VALUES ($1::uuid, $2, $3::uuid, 'reviewing', $4)
			ON CONFLICT (department_id, level, session_id)
			DO UPDATE SET stage='reviewing', review_index=$4, archived=false, updated_at=now()
			RETURNING id::text, department_id::text, level, session_id::text, stage, review_index, archived, updated_at`,
			departmentID, level, sessionID, firstStage).
			Scan(&lrp.ID, &lrp.DepartmentID, &lrp.Level, &lrp.SessionID, &lrp.Stage, &lrp.ReviewIndex, &lrp.Archived, &lrp.UpdatedAt)
		if err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		// A (re)compile restarts the review from scratch: clear any partial
		// board approvals left over from a previous, since-queried pass.
		if _, err := tx.Exec(ctx, `DELETE FROM level_review_stage_approvals WHERE level_review_progress_id=$1::uuid`, lrp.ID); err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "compiled", "level-review", lrp.ID, map[string]any{"department": departmentID, "level": level})
		return lrp, nil
	})
}

// DecideStage lets an actor holding one of the current stage's required
// roles record their approval. A single-role stage clears on one approval; a
// board stage (multiple required roles, e.g. a scrutiny board or senate)
// only clears once every required role has signed off. A query from any
// required role immediately kicks the cohort back to 'compiling' and clears
// whatever partial approvals that pass had collected. ict bypasses the board
// requirement and decides the stage outright.
func (r *Repo) DecideStage(ctx context.Context, id, status, actorRole, actorUserID string) (portal.LevelReviewProgress, error) {
	if status != "approved" && status != "queried" {
		return portal.LevelReviewProgress{}, apperr.Invalid(`status must be "approved" or "queried"`)
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.LevelReviewProgress, error) {
		var lrp portal.LevelReviewProgress
		err := tx.QueryRow(ctx, `
			SELECT id::text, department_id::text, level, session_id::text, stage, review_index, archived, updated_at
			FROM level_review_progress WHERE id=$1::uuid FOR UPDATE`, id).
			Scan(&lrp.ID, &lrp.DepartmentID, &lrp.Level, &lrp.SessionID, &lrp.Stage, &lrp.ReviewIndex, &lrp.Archived, &lrp.UpdatedAt)
		if db.IsNotFound(err) {
			return portal.LevelReviewProgress{}, apperr.NotFound("level review not found")
		}
		if err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		if lrp.Stage != "reviewing" {
			return portal.LevelReviewProgress{}, apperr.Conflict("this cohort is not awaiting review")
		}
		var stageID string
		var requiredCount int
		err = tx.QueryRow(ctx, `
			SELECT id::text, (SELECT count(*) FROM workflow_stage_roles WHERE stage_id=workflow_stages.id)
			FROM workflow_stages WHERE position=$1`, lrp.ReviewIndex).
			Scan(&stageID, &requiredCount)
		if db.IsNotFound(err) {
			return portal.LevelReviewProgress{}, apperr.Invalid("current review stage no longer exists")
		}
		if err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}

		if actorRole != "ict" {
			var isRequired bool
			if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflow_stage_roles WHERE stage_id=$1::uuid AND actor_role=$2)`, stageID, actorRole).Scan(&isRequired); err != nil {
				return portal.LevelReviewProgress{}, db.Translate(err)
			}
			if !isRequired {
				return portal.LevelReviewProgress{}, apperr.Forbidden("not one of this stage's required reviewers")
			}
		}

		switch {
		case status == "queried":
			if _, err := tx.Exec(ctx, `DELETE FROM level_review_stage_approvals WHERE level_review_progress_id=$1::uuid`, lrp.ID); err != nil {
				return portal.LevelReviewProgress{}, db.Translate(err)
			}
			lrp.Stage, lrp.ReviewIndex = "compiling", 0
		case actorRole == "ict":
			lrp.Stage, lrp.ReviewIndex, err = r.advanceStage(ctx, tx, lrp.ReviewIndex)
			if err != nil {
				return portal.LevelReviewProgress{}, err
			}
		default:
			if _, err := tx.Exec(ctx, `
				INSERT INTO level_review_stage_approvals (level_review_progress_id, stage_id, actor_role, approved_by)
				VALUES ($1::uuid, $2::uuid, $3, $4::uuid)
				ON CONFLICT (level_review_progress_id, stage_id, actor_role) DO UPDATE SET approved_by=excluded.approved_by, approved_at=now()`,
				lrp.ID, stageID, actorRole, actorUserID); err != nil {
				return portal.LevelReviewProgress{}, db.Translate(err)
			}
			var approvedCount int
			if err := tx.QueryRow(ctx, `SELECT count(*) FROM level_review_stage_approvals WHERE level_review_progress_id=$1::uuid AND stage_id=$2::uuid`, lrp.ID, stageID).Scan(&approvedCount); err != nil {
				return portal.LevelReviewProgress{}, db.Translate(err)
			}
			if approvedCount >= requiredCount {
				lrp.Stage, lrp.ReviewIndex, err = r.advanceStage(ctx, tx, lrp.ReviewIndex)
				if err != nil {
					return portal.LevelReviewProgress{}, err
				}
			}
			// else: stays 'reviewing' at the same position, waiting on the rest of the board.
		}

		err = tx.QueryRow(ctx, `
			UPDATE level_review_progress SET stage=$2, review_index=$3, updated_at=now()
			WHERE id=$1::uuid
			RETURNING id::text, department_id::text, level, session_id::text, stage, review_index, archived, updated_at`,
			lrp.ID, lrp.Stage, lrp.ReviewIndex).
			Scan(&lrp.ID, &lrp.DepartmentID, &lrp.Level, &lrp.SessionID, &lrp.Stage, &lrp.ReviewIndex, &lrp.Archived, &lrp.UpdatedAt)
		if err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, status, "level-review", lrp.ID, map[string]any{"role": actorRole})
		return lrp, nil
	})
}

// advanceStage finds the next configured stage after currentPosition, or
// reports 'ready' if currentPosition was the last one.
func (r *Repo) advanceStage(ctx context.Context, tx pgx.Tx, currentPosition int) (string, int, error) {
	var next int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(MIN(position), 0) FROM workflow_stages WHERE position > $1`, currentPosition).Scan(&next); err != nil {
		return "", 0, db.Translate(err)
	}
	if next == 0 {
		return "ready", currentPosition, nil
	}
	return "reviewing", next, nil
}

// PublishLevel requires stage='ready' and releases every approved result for
// students in that cohort, so it shows up in transcripts.
func (r *Repo) PublishLevel(ctx context.Context, id, actorUserID string) (portal.LevelReviewProgress, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.LevelReviewProgress, error) {
		var lrp portal.LevelReviewProgress
		err := tx.QueryRow(ctx, `
			SELECT id::text, department_id::text, level, session_id::text, stage, review_index, archived, updated_at
			FROM level_review_progress WHERE id=$1::uuid FOR UPDATE`, id).
			Scan(&lrp.ID, &lrp.DepartmentID, &lrp.Level, &lrp.SessionID, &lrp.Stage, &lrp.ReviewIndex, &lrp.Archived, &lrp.UpdatedAt)
		if db.IsNotFound(err) {
			return portal.LevelReviewProgress{}, apperr.NotFound("level review not found")
		}
		if err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		if lrp.Stage != "ready" {
			return portal.LevelReviewProgress{}, apperr.Conflict("this cohort has not cleared the review chain yet")
		}
		if _, err := tx.Exec(ctx, `
			UPDATE results r SET status='released'
			FROM students st
			WHERE r.student_id = st.id AND st.department_id=$1::uuid AND st.level=$2 AND r.session_id=$3::uuid AND r.status='approved'`,
			lrp.DepartmentID, lrp.Level, lrp.SessionID); err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		err = tx.QueryRow(ctx, `
			UPDATE level_review_progress SET stage='published', updated_at=now()
			WHERE id=$1::uuid
			RETURNING id::text, department_id::text, level, session_id::text, stage, review_index, archived, updated_at`, lrp.ID).
			Scan(&lrp.ID, &lrp.DepartmentID, &lrp.Level, &lrp.SessionID, &lrp.Stage, &lrp.ReviewIndex, &lrp.Archived, &lrp.UpdatedAt)
		if err != nil {
			return portal.LevelReviewProgress{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "published", "level-review", lrp.ID, nil)
		return lrp, nil
	})
}

// --- student cases ---

func (r *Repo) StudentCases(ctx context.Context, limit, offset int, studentID, caseType, status string) ([]portal.StudentCase, int, error) {
	scope := db.UUIDOrNil(studentID)
	typeFilter := nullIfEmpty(caseType)
	statusFilter := nullIfEmpty(status)
	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT count(*) FROM student_cases
		WHERE ($1::uuid IS NULL OR student_id=$1::uuid) AND ($2::text IS NULL OR type=$2::text) AND ($3::text IS NULL OR status=$3::text)`,
		scope, typeFilter, statusFilter).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, student_id::text, session_id::text, level, type, status, reason, details,
		       COALESCE(attachment_id::text, ''), raised_by::text, COALESCE(decided_by::text, ''), decided_at, created_at
		FROM student_cases
		WHERE ($3::uuid IS NULL OR student_id=$3::uuid) AND ($4::text IS NULL OR type=$4::text) AND ($5::text IS NULL OR status=$5::text)
		ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset, scope, typeFilter, statusFilter)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.StudentCase{}
	for rows.Next() {
		var sc portal.StudentCase
		if err := rows.Scan(&sc.ID, &sc.StudentID, &sc.SessionID, &sc.Level, &sc.Type, &sc.Status, &sc.Reason, &sc.Details,
			&sc.AttachmentID, &sc.RaisedBy, &sc.DecidedBy, &sc.DecidedAt, &sc.CreatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, sc)
	}
	return out, total, rows.Err()
}

type RaiseCaseInput struct {
	StudentID    string
	SessionID    string
	Level        string
	Type         string
	Reason       string
	Details      string
	AttachmentID string
}

// RaiseCase opens one of the five case types for a student. Only 'deferment'
// cases may carry an attachment.
func (r *Repo) RaiseCase(ctx context.Context, in RaiseCaseInput, actorUserID string) (portal.StudentCase, error) {
	switch in.Type {
	case "deferment", "absconded", "suspended", "dex", "teaching_practice":
	default:
		return portal.StudentCase{}, apperr.Invalid("invalid case type")
	}
	if in.AttachmentID != "" && in.Type != "deferment" {
		return portal.StudentCase{}, apperr.Invalid("only deferment cases may carry an attachment")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.StudentCase, error) {
		var sc portal.StudentCase
		err := tx.QueryRow(ctx, `
			INSERT INTO student_cases (student_id, session_id, level, type, reason, details, attachment_id, raised_by)
			VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::uuid, $8::uuid)
			RETURNING id::text, student_id::text, session_id::text, level, type, status, reason, details,
			          COALESCE(attachment_id::text, ''), raised_by::text, COALESCE(decided_by::text, ''), decided_at, created_at`,
			in.StudentID, in.SessionID, in.Level, in.Type, in.Reason, in.Details, db.UUIDOrNil(in.AttachmentID), actorUserID).
			Scan(&sc.ID, &sc.StudentID, &sc.SessionID, &sc.Level, &sc.Type, &sc.Status, &sc.Reason, &sc.Details,
				&sc.AttachmentID, &sc.RaisedBy, &sc.DecidedBy, &sc.DecidedAt, &sc.CreatedAt)
		if err != nil {
			return portal.StudentCase{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "raised", "student-case", sc.ID, map[string]any{"type": in.Type})
		return sc, nil
	})
}

// DecideCase approves or declines a flagged case.
func (r *Repo) DecideCase(ctx context.Context, id, status, actorUserID string) (portal.StudentCase, error) {
	if status != "approved" && status != "declined" {
		return portal.StudentCase{}, apperr.Invalid(`status must be "approved" or "declined"`)
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.StudentCase, error) {
		var sc portal.StudentCase
		err := tx.QueryRow(ctx, `
			UPDATE student_cases SET status=$2, decided_by=$3::uuid, decided_at=now()
			WHERE id=$1::uuid AND status='flagged'
			RETURNING id::text, student_id::text, session_id::text, level, type, status, reason, details,
			          COALESCE(attachment_id::text, ''), raised_by::text, COALESCE(decided_by::text, ''), decided_at, created_at`,
			id, status, actorUserID).
			Scan(&sc.ID, &sc.StudentID, &sc.SessionID, &sc.Level, &sc.Type, &sc.Status, &sc.Reason, &sc.Details,
				&sc.AttachmentID, &sc.RaisedBy, &sc.DecidedBy, &sc.DecidedAt, &sc.CreatedAt)
		if db.IsNotFound(err) {
			return portal.StudentCase{}, apperr.NotFound("flagged case not found")
		}
		if err != nil {
			return portal.StudentCase{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, status, "student-case", sc.ID, nil)
		return sc, nil
	})
}

// --- grade condonement ---

// CondoneResult applies the 38-39 borderline-F override: the grade stays F
// but the result is excluded from the carryover list from now on.
func (r *Repo) CondoneResult(ctx context.Context, resultID, actorUserID string) (portal.Condonement, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.Condonement, error) {
		var grade string
		var total int
		err := tx.QueryRow(ctx, `SELECT grade, total FROM results WHERE id=$1::uuid`, resultID).Scan(&grade, &total)
		if db.IsNotFound(err) {
			return portal.Condonement{}, apperr.NotFound("result not found")
		}
		if err != nil {
			return portal.Condonement{}, db.Translate(err)
		}
		if grade != "F" || total < 38 || total > 39 {
			return portal.Condonement{}, apperr.Invalid("only a borderline F (total 38-39) can be condoned")
		}
		var c portal.Condonement
		err = tx.QueryRow(ctx, `
			INSERT INTO grade_condonements (result_id, condoned_by) VALUES ($1::uuid, $2::uuid)
			RETURNING result_id::text, condoned_by::text, condoned_at`, resultID, actorUserID).
			Scan(&c.ResultID, &c.CondonedBy, &c.CondonedAt)
		if err != nil {
			return portal.Condonement{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "condoned", "result", resultID, map[string]any{"total": total})
		return c, nil
	})
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
