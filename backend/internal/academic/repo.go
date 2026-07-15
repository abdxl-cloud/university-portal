// Package academic is the Postgres-backed read layer for academic reference
// data and the people directory: sessions, faculties, departments, programs,
// students, staff, courses, and results. It follows the conventions documented
// in backend/CONVENTIONS.md (see internal/library for the canonical template).
package academic

import (
	"context"

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

func (r *Repo) Students(ctx context.Context, limit, offset int, studentID, departmentID, level, q string) ([]portal.StudentProfile, int, error) {
	scope := db.UUIDOrNil(studentID)
	deptScope := db.UUIDOrNil(departmentID)
	lvl := nullIfEmpty(level)
	search := nullIfEmpty(q)
	const filter = `($3::uuid IS NULL OR s.id=$3::uuid) AND ($4::uuid IS NULL OR s.department_id=$4::uuid) AND ($5::text IS NULL OR s.level=$5::text) AND ($6::text IS NULL OR s.matric_no ILIKE '%'||$6||'%' OR s.first_name ILIKE '%'||$6||'%' OR s.last_name ILIKE '%'||$6||'%')`
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM students s WHERE ($1::uuid IS NULL OR s.id=$1::uuid) AND ($2::uuid IS NULL OR s.department_id=$2::uuid) AND ($3::text IS NULL OR s.level=$3::text) AND ($4::text IS NULL OR s.matric_no ILIKE '%'||$4||'%' OR s.first_name ILIKE '%'||$4||'%' OR s.last_name ILIKE '%'||$4||'%')`, scope, deptScope, lvl, search).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT s.id::text, s.user_id::text, s.matric_no, s.first_name, s.last_name, COALESCE(u.email,''), COALESCE(s.phone,''), s.level, s.program_id::text, s.department_id::text, s.status FROM students s JOIN users u ON u.id=s.user_id WHERE `+filter+` ORDER BY s.last_name, s.first_name LIMIT $1 OFFSET $2`, limit, offset, scope, deptScope, lvl, search)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.StudentProfile{}
	for rows.Next() {
		var v portal.StudentProfile
		if err := rows.Scan(&v.ID, &v.UserID, &v.MatricNo, &v.FirstName, &v.LastName, &v.Email, &v.Phone, &v.Level, &v.ProgramID, &v.DepartmentID, &v.Status); err != nil {
			return nil, 0, err
		}
		out = append(out, v)
	}
	return out, total, rows.Err()
}

func (r *Repo) StudentIDByUserID(ctx context.Context, userID string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `SELECT id::text FROM students WHERE user_id=$1::uuid AND status='active'`, userID).Scan(&id)
	return id, err
}

func (r *Repo) Student(ctx context.Context, id string) (portal.StudentProfile, error) {
	var v portal.StudentProfile
	err := r.pool.QueryRow(ctx, `SELECT s.id::text, s.user_id::text, s.matric_no, s.first_name, s.last_name, COALESCE(u.email,''), COALESCE(s.phone,''), s.level, s.program_id::text, s.department_id::text, s.status FROM students s JOIN users u ON u.id=s.user_id WHERE s.id=$1::uuid`, id).
		Scan(&v.ID, &v.UserID, &v.MatricNo, &v.FirstName, &v.LastName, &v.Email, &v.Phone, &v.Level, &v.ProgramID, &v.DepartmentID, &v.Status)
	if db.IsNotFound(err) {
		return v, apperr.NotFound("student not found")
	}
	return v, err
}

// nullIfEmpty turns "" into a nil *string so it binds as SQL NULL, letting
// "$n::text IS NULL OR col = $n" act as an optional filter.
func nullIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func (r *Repo) Staff(ctx context.Context, limit, offset int, departmentID, q string) ([]portal.StaffProfile, int, error) {
	deptScope := db.UUIDOrNil(departmentID)
	search := nullIfEmpty(q)
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM staff_profiles WHERE ($1::uuid IS NULL OR department_id=$1::uuid) AND ($2::text IS NULL OR staff_no ILIKE '%'||$2||'%' OR display_name ILIKE '%'||$2||'%')`, deptScope, search).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT sp.id::text, sp.user_id::text, sp.staff_no, sp.display_name, COALESCE(u.email,''), sp.role,
	        COALESCE(sp.department_id::text,''), COALESCE(sp.office,''), sp.status
	 FROM staff_profiles sp JOIN users u ON u.id = sp.user_id
	 WHERE ($3::uuid IS NULL OR sp.department_id=$3::uuid) AND ($4::text IS NULL OR sp.staff_no ILIKE '%'||$4||'%' OR sp.display_name ILIKE '%'||$4||'%')
	 ORDER BY sp.display_name LIMIT $1 OFFSET $2`, limit, offset, deptScope, search)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.StaffProfile{}
	for rows.Next() {
		var s portal.StaffProfile
		if err := rows.Scan(&s.ID, &s.UserID, &s.StaffNo, &s.DisplayName, &s.Email, &s.Role,
			&s.DepartmentID, &s.Office, &s.Status); err != nil {
			return nil, 0, err
		}
		out = append(out, s)
	}
	return out, total, rows.Err()
}

func (r *Repo) StaffIDByUserID(ctx context.Context, userID string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `SELECT id::text FROM staff_profiles WHERE user_id=$1::uuid AND status='active'`, userID).Scan(&id)
	return id, err
}

func (r *Repo) StaffMember(ctx context.Context, id string) (portal.StaffProfile, error) {
	var s portal.StaffProfile
	err := r.pool.QueryRow(ctx, `SELECT sp.id::text, sp.user_id::text, sp.staff_no, sp.display_name, COALESCE(u.email,''), sp.role,
	        COALESCE(sp.department_id::text,''), COALESCE(sp.office,''), sp.status
	 FROM staff_profiles sp JOIN users u ON u.id = sp.user_id WHERE sp.id=$1::uuid`, id).
		Scan(&s.ID, &s.UserID, &s.StaffNo, &s.DisplayName, &s.Email, &s.Role, &s.DepartmentID, &s.Office, &s.Status)
	if db.IsNotFound(err) {
		return s, apperr.NotFound("staff member not found")
	}
	return s, err
}

func (r *Repo) Courses(ctx context.Context, limit, offset int, departmentID, level, semester, q string) ([]portal.Course, int, error) {
	deptScope := db.UUIDOrNil(departmentID)
	lvl := nullIfEmpty(level)
	sem := nullIfEmpty(semester)
	search := nullIfEmpty(q)
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM courses WHERE ($1::uuid IS NULL OR department_id=$1::uuid) AND ($2::text IS NULL OR level=$2::text) AND ($3::text IS NULL OR semester=$3::text) AND ($4::text IS NULL OR code ILIKE '%'||$4||'%' OR title ILIKE '%'||$4||'%')`, deptScope, lvl, sem, search).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT id::text, code, title, COALESCE(description,''), units, level, semester, department_id::text, COALESCE(lecturer_id::text,'')
	 FROM courses
	 WHERE ($3::uuid IS NULL OR department_id=$3::uuid) AND ($4::text IS NULL OR level=$4::text) AND ($5::text IS NULL OR semester=$5::text) AND ($6::text IS NULL OR code ILIKE '%'||$6||'%' OR title ILIKE '%'||$6||'%')
	 ORDER BY code LIMIT $1 OFFSET $2`, limit, offset, deptScope, lvl, sem, search)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.Course{}
	for rows.Next() {
		var c portal.Course
		if err := rows.Scan(&c.ID, &c.Code, &c.Title, &c.Description, &c.Units, &c.Level, &c.Semester, &c.DepartmentID, &c.LecturerID); err != nil {
			return nil, 0, err
		}
		out = append(out, c)
	}
	return out, total, rows.Err()
}

func (r *Repo) CourseByID(ctx context.Context, id string) (portal.Course, error) {
	var c portal.Course
	err := r.pool.QueryRow(ctx, `SELECT id::text, code, title, COALESCE(description,''), units, level, semester, department_id::text, COALESCE(lecturer_id::text,'')
	 FROM courses WHERE id=$1::uuid`, id).
		Scan(&c.ID, &c.Code, &c.Title, &c.Description, &c.Units, &c.Level, &c.Semester, &c.DepartmentID, &c.LecturerID)
	if db.IsNotFound(err) {
		return c, apperr.NotFound("course not found")
	}
	return c, err
}

// gradePoint mirrors the frontend's GP_MAP (A=5..F=0) on a 5.00 scale.
const gradePointCase = `CASE grade WHEN 'A' THEN 5 WHEN 'B' THEN 4 WHEN 'C' THEN 3 WHEN 'D' THEN 2 WHEN 'E' THEN 1 ELSE 0 END`

// AcademicRecord computes a student's transcript: per-semester TNU (total
// units)/TCP (total credit points)/GPA with a running CGPA, ordered
// chronologically (session name/semester sort lexically in this schema's
// naming convention, e.g. "2024/2025" < "2025/2026", "First" < "Second"),
// plus any course with an 'F' that has no later passing attempt.
func (r *Repo) AcademicRecord(ctx context.Context, studentID string) (portal.AcademicRecord, error) {
	rec := portal.AcademicRecord{StudentID: studentID, Semesters: []portal.AcademicRecordSemester{}, Carryovers: []portal.Carryover{}}

	rows, err := r.pool.Query(ctx, `
		SELECT r.session_id::text, s.name, s.semester,
		       COALESCE(SUM(c.units), 0) AS tnu,
		       COALESCE(SUM(c.units * (`+gradePointCase+`)), 0) AS tcp
		FROM results r
		JOIN courses c ON c.id = r.course_id
		JOIN academic_sessions s ON s.id = r.session_id
		WHERE r.student_id = $1::uuid AND r.status = 'released'
		GROUP BY r.session_id, s.name, s.semester
		ORDER BY s.name, s.semester`, studentID)
	if err != nil {
		return rec, err
	}
	defer rows.Close()

	var runTNU, runTCP int
	for rows.Next() {
		var sem portal.AcademicRecordSemester
		if err := rows.Scan(&sem.SessionID, &sem.Session, &sem.Semester, &sem.TNU, &sem.TCP); err != nil {
			return rec, err
		}
		if sem.TNU > 0 {
			sem.GPA = float64(sem.TCP) / float64(sem.TNU)
		}
		runTNU += sem.TNU
		runTCP += sem.TCP
		if runTNU > 0 {
			sem.CGPA = float64(runTCP) / float64(runTNU)
		}
		rec.Semesters = append(rec.Semesters, sem)
	}
	if err := rows.Err(); err != nil {
		return rec, err
	}
	if runTNU > 0 {
		rec.CGPA = float64(runTCP) / float64(runTNU)
	}
	rec.Standing = "Good Standing"
	if len(rec.Semesters) > 0 && rec.Semesters[len(rec.Semesters)-1].GPA < 1.5 {
		rec.Standing = "Probation"
	}

	// carryovers: any F with no later result for the same course that isn't
	// itself an F (a resit is a new row in a later session, same course_id),
	// excluding results condoned via grade_condonements (the 38-39 override).
	coRows, err := r.pool.Query(ctx, `
		SELECT r.course_id::text, c.code, c.title, s.name || ' · ' || s.semester, r.total
		FROM results r
		JOIN courses c ON c.id = r.course_id
		JOIN academic_sessions s ON s.id = r.session_id
		WHERE r.student_id = $1::uuid AND r.grade = 'F'
		  AND NOT EXISTS (SELECT 1 FROM grade_condonements gc WHERE gc.result_id = r.id)
		  AND NOT EXISTS (
		    SELECT 1 FROM results r2
		    WHERE r2.student_id = r.student_id AND r2.course_id = r.course_id
		      AND r2.grade <> 'F' AND r2.id <> r.id
		  )
		ORDER BY c.code`, studentID)
	if err != nil {
		return rec, err
	}
	defer coRows.Close()
	for coRows.Next() {
		var co portal.Carryover
		if err := coRows.Scan(&co.CourseID, &co.Code, &co.Title, &co.FailedIn, &co.FailScore); err != nil {
			return rec, err
		}
		rec.Carryovers = append(rec.Carryovers, co)
	}
	return rec, coRows.Err()
}

func (r *Repo) Results(ctx context.Context, limit, offset int, studentID string) ([]portal.Result, int, error) {
	scope := db.UUIDOrNil(studentID)
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM results WHERE ($1::uuid IS NULL OR student_id=$1::uuid)`, scope).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT id::text, student_id::text, course_id::text, session_id::text, ca, exam, total, grade, status FROM results WHERE ($3::uuid IS NULL OR student_id=$3::uuid) ORDER BY status LIMIT $1 OFFSET $2`, limit, offset, scope)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.Result{}
	for rows.Next() {
		var v portal.Result
		if err := rows.Scan(&v.ID, &v.StudentID, &v.CourseID, &v.SessionID, &v.CA, &v.Exam, &v.Total, &v.Grade, &v.Status); err != nil {
			return nil, 0, err
		}
		out = append(out, v)
	}
	return out, total, rows.Err()
}
