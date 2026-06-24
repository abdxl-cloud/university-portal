// Package clinic is the Postgres-backed clinic domain: patient records,
// appointments, prescriptions and pharmacy stock (reads) plus book / update
// appointment mutations. Follows backend/CONVENTIONS.md.
package clinic

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

func (r *Repo) Patients(ctx context.Context, limit, offset int) ([]portal.PatientRecord, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM patient_records`,
		`SELECT id::text, student_id::text, COALESCE(blood_group,''), COALESCE(genotype,''), COALESCE(allergies,''), COALESCE(emergency_no,'')
		 FROM patient_records ORDER BY id LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.PatientRecord, error) {
			var p portal.PatientRecord
			err := rows.Scan(&p.ID, &p.StudentID, &p.BloodGroup, &p.Genotype, &p.Allergies, &p.EmergencyNo)
			return p, err
		})
}

func (r *Repo) Appointments(ctx context.Context, limit, offset int) ([]portal.ClinicAppointment, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM clinic_appointments`,
		`SELECT id::text, student_id::text, service, appointment_date, appointment_time, status, created_at
		 FROM clinic_appointments ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset, scanAppointmentRows)
}

func (r *Repo) Prescriptions(ctx context.Context, limit, offset int) ([]portal.Prescription, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM prescriptions`,
		`SELECT id::text, patient_id::text, drug, dosage, COALESCE(doctor_id::text,''), issued_at
		 FROM prescriptions ORDER BY issued_at DESC LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.Prescription, error) {
			var p portal.Prescription
			err := rows.Scan(&p.ID, &p.PatientID, &p.Drug, &p.Dosage, &p.DoctorID, &p.IssuedAt)
			return p, err
		})
}

func (r *Repo) Pharmacy(ctx context.Context, limit, offset int) ([]portal.PharmacyItem, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM pharmacy_items`,
		`SELECT id::text, name, stock, unit, status FROM pharmacy_items ORDER BY name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.PharmacyItem, error) {
			var p portal.PharmacyItem
			err := rows.Scan(&p.ID, &p.Name, &p.Stock, &p.Unit, &p.Status)
			return p, err
		})
}

func scanAppointmentRows(rows pgx.Rows) (portal.ClinicAppointment, error) {
	return scanAppointment(rows)
}

func scanAppointment(row pgx.Row) (portal.ClinicAppointment, error) {
	var a portal.ClinicAppointment
	err := row.Scan(&a.ID, &a.StudentID, &a.Service, &a.Date, &a.Time, &a.Status, &a.CreatedAt)
	return a, err
}

// BookAppointment opens a pending appointment and audits it.
func (r *Repo) BookAppointment(ctx context.Context, studentID, service, date, slot, actorUserID string) (portal.ClinicAppointment, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.ClinicAppointment, error) {
		appt, err := scanAppointment(tx.QueryRow(ctx, `
			INSERT INTO clinic_appointments (student_id, service, appointment_date, appointment_time, status)
			VALUES ($1::uuid, $2, $3, $4, 'pending')
			RETURNING id::text, student_id::text, service, appointment_date, appointment_time, status, created_at`,
			studentID, service, date, slot))
		if err != nil {
			return portal.ClinicAppointment{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, "booked", "clinic-appointment", appt.ID, nil)
		return appt, nil
	})
}

// UpdateAppointmentStatus sets the appointment status and audits it.
func (r *Repo) UpdateAppointmentStatus(ctx context.Context, id, status, actorUserID string) (portal.ClinicAppointment, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.ClinicAppointment, error) {
		appt, err := scanAppointment(tx.QueryRow(ctx, `
			UPDATE clinic_appointments SET status=$2 WHERE id=$1::uuid
			RETURNING id::text, student_id::text, service, appointment_date, appointment_time, status, created_at`,
			id, status))
		if db.IsNotFound(err) {
			return portal.ClinicAppointment{}, apperr.NotFound("appointment not found")
		}
		if err != nil {
			return portal.ClinicAppointment{}, db.Translate(err)
		}
		r.audit(ctx, tx, actorUserID, status, "clinic-appointment", id, nil)
		return appt, nil
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
