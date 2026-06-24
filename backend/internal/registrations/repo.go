// Package registrations is the Postgres-backed course-registration domain:
// listing registrations (with their per-course lines) and submitting a new
// registration. Follows backend/CONVENTIONS.md (see internal/fees for the
// list-with-children + mutation template).
package registrations

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

func (r *Repo) List(ctx context.Context, limit, offset int) ([]portal.CourseRegistration, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM course_registrations`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, student_id::text, session_id::text, status, units, submitted_at
		FROM course_registrations ORDER BY submitted_at DESC NULLS LAST LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	regs := []portal.CourseRegistration{}
	ids := []string{}
	for rows.Next() {
		var reg portal.CourseRegistration
		var submitted *time.Time
		if err := rows.Scan(&reg.ID, &reg.StudentID, &reg.SessionID, &reg.Status, &reg.Units, &submitted); err != nil {
			return nil, 0, err
		}
		if submitted != nil {
			reg.Submitted = *submitted
		}
		reg.Lines = []portal.RegistrationLine{}
		regs = append(regs, reg)
		ids = append(ids, reg.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if len(ids) > 0 {
		lines, err := r.linesByRegistration(ctx, ids)
		if err != nil {
			return nil, 0, err
		}
		for i := range regs {
			if ls, ok := lines[regs[i].ID]; ok {
				regs[i].Lines = ls
			}
		}
	}
	return regs, total, nil
}

func (r *Repo) linesByRegistration(ctx context.Context, registrationIDs []string) (map[string][]portal.RegistrationLine, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT crl.registration_id::text, c.id::text, c.code, c.title, c.units
		FROM course_registration_lines crl
		JOIN courses c ON c.id = crl.course_id
		WHERE crl.registration_id = ANY($1::uuid[])
		ORDER BY c.code`, registrationIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string][]portal.RegistrationLine{}
	for rows.Next() {
		var regID string
		var line portal.RegistrationLine
		if err := rows.Scan(&regID, &line.CourseID, &line.Code, &line.Title, &line.Units); err != nil {
			return nil, err
		}
		out[regID] = append(out[regID], line)
	}
	return out, rows.Err()
}

// Submit creates a pending registration from the given courses, records the
// per-course lines, opens an HOD approval, and audits the action. Mirrors the
// previous in-memory SubmitCourseRegistration rules.
func (r *Repo) Submit(ctx context.Context, studentID, sessionID string, courseIDs []string, actorUserID string) (portal.CourseRegistration, error) {
	if len(courseIDs) == 0 {
		return portal.CourseRegistration{}, apperr.Invalid("at least one course is required")
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.CourseRegistration, error) {
		lines := make([]portal.RegistrationLine, 0, len(courseIDs))
		units := 0
		for _, id := range courseIDs {
			var line portal.RegistrationLine
			err := tx.QueryRow(ctx, `SELECT id::text, code, title, units FROM courses WHERE id=$1::uuid`, id).
				Scan(&line.CourseID, &line.Code, &line.Title, &line.Units)
			if db.IsNotFound(err) {
				return portal.CourseRegistration{}, apperr.NotFound("course not found: " + id)
			}
			if err != nil {
				return portal.CourseRegistration{}, db.Translate(err)
			}
			lines = append(lines, line)
			units += line.Units
		}

		reg := portal.CourseRegistration{StudentID: studentID, SessionID: sessionID, Status: "pending", Units: units, Lines: lines}
		err := tx.QueryRow(ctx, `
			INSERT INTO course_registrations (student_id, session_id, status, units, submitted_at)
			VALUES ($1::uuid, $2::uuid, 'pending', $3, now())
			RETURNING id::text, submitted_at`, studentID, sessionID, units).
			Scan(&reg.ID, &reg.Submitted)
		if err != nil {
			return portal.CourseRegistration{}, db.Translate(err)
		}

		for _, line := range lines {
			if _, err := tx.Exec(ctx, `
				INSERT INTO course_registration_lines (registration_id, course_id) VALUES ($1::uuid, $2::uuid)`,
				reg.ID, line.CourseID); err != nil {
				return portal.CourseRegistration{}, db.Translate(err)
			}
		}

		if _, err := tx.Exec(ctx, `
			INSERT INTO approvals (domain, entity_id, requested_by, assigned_to, status)
			VALUES ('course-registration', $1, $2, 'hod', 'pending')`, reg.ID, studentID); err != nil {
			return portal.CourseRegistration{}, db.Translate(err)
		}

		r.audit(ctx, tx, actorUserID, "submitted", "course-registration", reg.ID, map[string]any{"units": units})
		return reg, nil
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
