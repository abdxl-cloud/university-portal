// Package ops is the Postgres-backed operations domain: approvals,
// notifications, audit logs, support tickets and the dashboard snapshot. It is
// the last slice of the in-memory store to move to Postgres. Follows
// backend/CONVENTIONS.md.
package ops

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

func (r *Repo) Approvals(ctx context.Context, limit, offset int) ([]portal.Approval, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM approvals`,
		`SELECT id::text, domain, entity_id, requested_by, assigned_to, status, created_at
		 FROM approvals ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset, scanApprovalRows)
}

func (r *Repo) Notifications(ctx context.Context, limit, offset int) ([]portal.Notification, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM notifications`,
		`SELECT id::text, user_id::text, title, body, tone, read, created_at
		 FROM notifications ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset, scanNotificationRows)
}

func (r *Repo) AuditLogs(ctx context.Context, limit, offset int) ([]portal.AuditLog, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM audit_logs`,
		`SELECT id::text, COALESCE(actor_user_id::text,''), action, entity_type, COALESCE(entity_id,''), metadata, created_at
		 FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.AuditLog, error) {
			var a portal.AuditLog
			var meta []byte
			if err := rows.Scan(&a.ID, &a.ActorID, &a.Action, &a.EntityType, &a.EntityID, &meta, &a.CreatedAt); err != nil {
				return portal.AuditLog{}, err
			}
			if len(meta) > 0 {
				_ = json.Unmarshal(meta, &a.Metadata)
			}
			return a, nil
		})
}

func (r *Repo) SupportTickets(ctx context.Context, limit, offset int) ([]portal.SupportTicket, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM support_tickets`,
		`SELECT id::text, student_id::text, subject, status, created_at
		 FROM support_tickets ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.SupportTicket, error) {
			var t portal.SupportTicket
			err := rows.Scan(&t.ID, &t.StudentID, &t.Subject, &t.Status, &t.CreatedAt)
			return t, err
		})
}

func scanApprovalRows(rows pgx.Rows) (portal.Approval, error) { return scanApproval(rows) }

func scanApproval(row pgx.Row) (portal.Approval, error) {
	var a portal.Approval
	err := row.Scan(&a.ID, &a.Domain, &a.EntityID, &a.RequestedBy, &a.AssignedTo, &a.Status, &a.CreatedAt)
	return a, err
}

func scanNotificationRows(rows pgx.Rows) (portal.Notification, error) { return scanNotification(rows) }

func scanNotification(row pgx.Row) (portal.Notification, error) {
	var n portal.Notification
	err := row.Scan(&n.ID, &n.UserID, &n.Title, &n.Body, &n.Tone, &n.Read, &n.CreatedAt)
	return n, err
}

// DecideApproval sets an approval's status and audits it.
func (r *Repo) DecideApproval(ctx context.Context, id, status, actorUserID string) (portal.Approval, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.Approval, error) {
		ap, err := scanApproval(tx.QueryRow(ctx, `
			UPDATE approvals SET status=$2 WHERE id=$1::uuid
			RETURNING id::text, domain, entity_id, requested_by, assigned_to, status, created_at`, id, status))
		if db.IsNotFound(err) {
			return portal.Approval{}, apperr.NotFound("approval not found")
		}
		if err != nil {
			return portal.Approval{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, status, "approval", id, nil)
		return ap, nil
	})
}

// MarkNotificationRead flags a notification read and audits it.
func (r *Repo) MarkNotificationRead(ctx context.Context, id, actorUserID string) (portal.Notification, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.Notification, error) {
		n, err := scanNotification(tx.QueryRow(ctx, `
			UPDATE notifications SET read=true WHERE id=$1::uuid
			RETURNING id::text, user_id::text, title, body, tone, read, created_at`, id))
		if db.IsNotFound(err) {
			return portal.Notification{}, apperr.NotFound("notification not found")
		}
		if err != nil {
			return portal.Notification{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "read", "notification", id, nil)
		return n, nil
	})
}

// Dashboard returns the aggregate counts for the landing snapshot.
func (r *Repo) Dashboard(ctx context.Context) (portal.DashboardSnapshot, error) {
	var d portal.DashboardSnapshot
	err := r.pool.QueryRow(ctx, `
		SELECT
			(SELECT count(*) FROM students),
			(SELECT count(*) FROM staff_profiles),
			(SELECT count(*) FROM invoices WHERE status='pending'),
			(SELECT count(*) FROM approvals WHERE status='pending'),
			(SELECT count(*) FROM library_loans),
			(SELECT count(*) FROM clinic_appointments),
			(SELECT count(*) FROM hostel_applications WHERE status='pending')`).
		Scan(&d.Students, &d.Staff, &d.PendingFees, &d.PendingApprovals, &d.LibraryLoans, &d.ClinicQueue, &d.HostelRequests)
	return d, err
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
