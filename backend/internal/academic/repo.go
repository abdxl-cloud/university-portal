// Package academic is the Postgres-backed read layer for academic reference
// data and the people directory: sessions, faculties, departments, programs,
// students, staff, courses, and results. It follows the conventions documented
// in backend/CONVENTIONS.md (see internal/library for the canonical template).
package academic

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

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

func (r *Repo) Sessions(ctx context.Context, limit, offset int) ([]portal.AcademicSession, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM academic_sessions`,
		`SELECT id::text, name, semester, is_current FROM academic_sessions ORDER BY is_current DESC, name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.AcademicSession, error) {
			var s portal.AcademicSession
			err := rows.Scan(&s.ID, &s.Name, &s.Semester, &s.IsCurrent)
			return s, err
		})
}

func (r *Repo) Faculties(ctx context.Context, limit, offset int) ([]portal.Faculty, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM faculties`,
		`SELECT id::text, name FROM faculties ORDER BY name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.Faculty, error) {
			var f portal.Faculty
			err := rows.Scan(&f.ID, &f.Name)
			return f, err
		})
}

func (r *Repo) Departments(ctx context.Context, limit, offset int) ([]portal.Department, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM departments`,
		`SELECT id::text, faculty_id::text, name, code FROM departments ORDER BY name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.Department, error) {
			var d portal.Department
			err := rows.Scan(&d.ID, &d.FacultyID, &d.Name, &d.Code)
			return d, err
		})
}

func (r *Repo) Programs(ctx context.Context, limit, offset int) ([]portal.Program, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM programs`,
		`SELECT id::text, department_id::text, name, award, duration FROM programs ORDER BY name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.Program, error) {
			var p portal.Program
			err := rows.Scan(&p.ID, &p.DepartmentID, &p.Name, &p.Award, &p.Duration)
			return p, err
		})
}

func (r *Repo) Students(ctx context.Context, limit, offset int) ([]portal.StudentProfile, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM students`,
		`SELECT s.id::text, s.user_id::text, s.matric_no, s.first_name, s.last_name, COALESCE(u.email,''),
		        COALESCE(s.phone,''), s.level, s.program_id::text, s.department_id::text, s.status
		 FROM students s JOIN users u ON u.id = s.user_id
		 ORDER BY s.last_name, s.first_name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.StudentProfile, error) {
			var s portal.StudentProfile
			err := rows.Scan(&s.ID, &s.UserID, &s.MatricNo, &s.FirstName, &s.LastName, &s.Email,
				&s.Phone, &s.Level, &s.ProgramID, &s.DepartmentID, &s.Status)
			return s, err
		})
}

func (r *Repo) Staff(ctx context.Context, limit, offset int) ([]portal.StaffProfile, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM staff_profiles`,
		`SELECT sp.id::text, sp.user_id::text, sp.staff_no, sp.display_name, COALESCE(u.email,''), sp.role,
		        COALESCE(sp.department_id::text,''), COALESCE(sp.office,''), sp.status
		 FROM staff_profiles sp JOIN users u ON u.id = sp.user_id
		 ORDER BY sp.display_name LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.StaffProfile, error) {
			var s portal.StaffProfile
			err := rows.Scan(&s.ID, &s.UserID, &s.StaffNo, &s.DisplayName, &s.Email, &s.Role,
				&s.DepartmentID, &s.Office, &s.Status)
			return s, err
		})
}

func (r *Repo) Courses(ctx context.Context, limit, offset int) ([]portal.Course, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM courses`,
		`SELECT id::text, code, title, units, level, semester, department_id::text, COALESCE(lecturer_id::text,'')
		 FROM courses ORDER BY code LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.Course, error) {
			var c portal.Course
			err := rows.Scan(&c.ID, &c.Code, &c.Title, &c.Units, &c.Level, &c.Semester, &c.DepartmentID, &c.LecturerID)
			return c, err
		})
}

func (r *Repo) Results(ctx context.Context, limit, offset int) ([]portal.Result, int, error) {
	return list(ctx, r,
		`SELECT count(*) FROM results`,
		`SELECT id::text, student_id::text, course_id::text, session_id::text, ca, exam, total, grade, status
		 FROM results ORDER BY status LIMIT $1 OFFSET $2`,
		limit, offset, func(rows pgx.Rows) (portal.Result, error) {
			var res portal.Result
			err := rows.Scan(&res.ID, &res.StudentID, &res.CourseID, &res.SessionID, &res.CA, &res.Exam, &res.Total, &res.Grade, &res.Status)
			return res, err
		})
}
