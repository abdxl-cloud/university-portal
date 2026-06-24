// Package fees is the Postgres-backed fees domain: invoices (with line items),
// payments, and invoice payment. Follows backend/CONVENTIONS.md.
package fees

import (
	"context"
	"crypto/rand"
	"encoding/hex"
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

func (r *Repo) ListInvoices(ctx context.Context, limit, offset int) ([]portal.Invoice, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM invoices`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, student_id::text, session_id::text, total_kobo, currency, status, issued_at
		FROM invoices ORDER BY issued_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	invoices := []portal.Invoice{}
	ids := []string{}
	for rows.Next() {
		var inv portal.Invoice
		var totalKobo int64
		var currency string
		if err := rows.Scan(&inv.ID, &inv.StudentID, &inv.SessionID, &totalKobo, &currency, &inv.Status, &inv.IssuedAt); err != nil {
			return nil, 0, err
		}
		inv.Total = portal.Money{Amount: totalKobo, Currency: currency}
		inv.Items = []portal.FeeItem{}
		invoices = append(invoices, inv)
		ids = append(ids, inv.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if len(ids) > 0 {
		items, err := r.itemsByInvoice(ctx, ids)
		if err != nil {
			return nil, 0, err
		}
		for i := range invoices {
			if lines, ok := items[invoices[i].ID]; ok {
				invoices[i].Items = lines
			}
		}
	}
	return invoices, total, nil
}

func (r *Repo) itemsByInvoice(ctx context.Context, invoiceIDs []string) (map[string][]portal.FeeItem, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT ii.invoice_id::text, fi.id::text, fi.label, ii.amount_kobo, ii.currency, fi.required
		FROM invoice_items ii
		JOIN fee_items fi ON fi.id = ii.fee_item_id
		WHERE ii.invoice_id = ANY($1::uuid[])`, invoiceIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string][]portal.FeeItem{}
	for rows.Next() {
		var invoiceID string
		var item portal.FeeItem
		var amountKobo int64
		var currency string
		if err := rows.Scan(&invoiceID, &item.ID, &item.Label, &amountKobo, &currency, &item.Required); err != nil {
			return nil, err
		}
		item.Amount = portal.Money{Amount: amountKobo, Currency: currency}
		out[invoiceID] = append(out[invoiceID], item)
	}
	return out, rows.Err()
}

func (r *Repo) ListPayments(ctx context.Context, limit, offset int) ([]portal.Payment, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM payments`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, invoice_id::text, reference, channel, amount_kobo, currency, status, paid_at
		FROM payments ORDER BY paid_at DESC NULLS LAST LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.Payment{}
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, rows.Err()
}

// PayInvoice marks a pending invoice paid and records a confirmed payment for
// its full amount (mirrors the previous in-memory behaviour).
func (r *Repo) PayInvoice(ctx context.Context, invoiceID, channel, actorUserID string) (portal.Payment, error) {
	if channel == "" {
		channel = "online"
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.Payment, error) {
		var totalKobo int64
		var currency, status string
		err := tx.QueryRow(ctx, `SELECT total_kobo, currency, status FROM invoices WHERE id=$1::uuid FOR UPDATE`, invoiceID).
			Scan(&totalKobo, &currency, &status)
		if db.IsNotFound(err) {
			return portal.Payment{}, apperr.NotFound("invoice not found")
		}
		if err != nil {
			return portal.Payment{}, err
		}
		if status == "paid" {
			return portal.Payment{}, apperr.Invalid("invoice already paid")
		}
		if _, err := tx.Exec(ctx, `UPDATE invoices SET status='paid' WHERE id=$1::uuid`, invoiceID); err != nil {
			return portal.Payment{}, err
		}
		payment, err := scanPayment(tx.QueryRow(ctx, `
			INSERT INTO payments (invoice_id, reference, channel, amount_kobo, currency, status, paid_at)
			VALUES ($1::uuid, $2, $3, $4, $5, 'confirmed', now())
			RETURNING id::text, invoice_id::text, reference, channel, amount_kobo, currency, status, paid_at`,
			invoiceID, "TRX-"+newID(), channel, totalKobo, currency))
		if err != nil {
			return portal.Payment{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "paid", "invoice", invoiceID, map[string]any{"channel": channel})
		return payment, nil
	})
}

func scanPayment(row pgx.Row) (portal.Payment, error) {
	var p portal.Payment
	var amountKobo int64
	var currency string
	var paidAt *time.Time
	if err := row.Scan(&p.ID, &p.InvoiceID, &p.Reference, &p.Channel, &amountKobo, &currency, &p.Status, &paidAt); err != nil {
		return portal.Payment{}, err
	}
	p.Amount = portal.Money{Amount: amountKobo, Currency: currency}
	if paidAt != nil {
		p.PaidAt = *paidAt
	}
	return p, nil
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

func newID() string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
