// Package hostels is the Postgres-backed hostel domain: halls, rooms, beds and
// applications (reads) plus apply / decide mutations. Follows
// backend/CONVENTIONS.md (academic for the read helper, fees for mutations).
package hostels

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

// list runs a count + paginated select and scans each row with scan.
func list[T any](ctx context.Context, r *Repo, countSQL, selectSQL string, limit, offset int, scan func(pgx.Rows) (T, error)) ([]T, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, countSQL).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, selectSQL, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []T{}
	for rows.Next() {
		item, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, item)
	}
	return out, total, rows.Err()
}

func (r *Repo) Halls(ctx context.Context, limit, offset int) ([]portal.HostelHall, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM hostel_halls`,
		`SELECT id::text, name, gender FROM hostel_halls ORDER BY name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.HostelHall, error) {
			var h portal.HostelHall
			err := rows.Scan(&h.ID, &h.Name, &h.Gender)
			return h, err
		})
}

func (r *Repo) Rooms(ctx context.Context, limit, offset int) ([]portal.HostelRoom, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM hostel_rooms`,
		`SELECT id::text, hall_id::text, room_no, capacity, occupied FROM hostel_rooms ORDER BY room_no LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.HostelRoom, error) {
			var rm portal.HostelRoom
			err := rows.Scan(&rm.ID, &rm.HallID, &rm.RoomNo, &rm.Capacity, &rm.Occupied)
			return rm, err
		})
}

func (r *Repo) Beds(ctx context.Context, limit, offset int) ([]portal.HostelBed, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM hostel_beds`,
		`SELECT id::text, room_id::text, label, status FROM hostel_beds ORDER BY label LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.HostelBed, error) {
			var b portal.HostelBed
			err := rows.Scan(&b.ID, &b.RoomID, &b.Label, &b.Status)
			return b, err
		})
}

func (r *Repo) Applications(ctx context.Context, limit, offset int) ([]portal.HostelApplication, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM hostel_applications`,
		`SELECT id::text, student_id::text, hall_id::text, status, created_at FROM hostel_applications ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.HostelApplication, error) {
			var a portal.HostelApplication
			err := rows.Scan(&a.ID, &a.StudentID, &a.HallID, &a.Status, &a.CreatedAt)
			return a, err
		})
}

func scanApplication(row pgx.Row) (portal.HostelApplication, error) {
	var a portal.HostelApplication
	err := row.Scan(&a.ID, &a.StudentID, &a.HallID, &a.Status, &a.CreatedAt)
	return a, err
}

// Apply opens a pending hostel application for the given student and hall.
func (r *Repo) Apply(ctx context.Context, studentID, hallID, actorUserID string) (portal.HostelApplication, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.HostelApplication, error) {
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM hostel_halls WHERE id=$1::uuid)`, hallID).Scan(&exists); err != nil {
			return portal.HostelApplication{}, db.Translate(err)
		}
		if !exists {
			return portal.HostelApplication{}, apperr.NotFound("hall not found")
		}
		app, err := scanApplication(tx.QueryRow(ctx, `
			INSERT INTO hostel_applications (student_id, hall_id, status)
			VALUES ($1::uuid, $2::uuid, 'pending')
			RETURNING id::text, student_id::text, hall_id::text, status, created_at`, studentID, hallID))
		if err != nil {
			return portal.HostelApplication{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "submitted", "hostel-application", app.ID, nil)
		return app, nil
	})
}

// Decide sets an application's status (allocated / rejected) and audits it.
func (r *Repo) Decide(ctx context.Context, id, status, actorUserID string) (portal.HostelApplication, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.HostelApplication, error) {
		app, err := scanApplication(tx.QueryRow(ctx, `
			UPDATE hostel_applications SET status=$2 WHERE id=$1::uuid
			RETURNING id::text, student_id::text, hall_id::text, status, created_at`, id, status))
		if db.IsNotFound(err) {
			return portal.HostelApplication{}, apperr.NotFound("application not found")
		}
		if err != nil {
			return portal.HostelApplication{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, status, "hostel-application", id, nil)
		return app, nil
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
