// Integration tests against a real Postgres (per backend/CONVENTIONS.md, this
// codebase uses no mocks). Point DATABASE_URL at a reachable instance with
// the full migration set applied; tests skip themselves if it's unset.
// Fixtures use randomly-suffixed identifiers and clean up after themselves
// via t.Cleanup, so they're safe to run against a shared/live database.
package staff

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func rid(t *testing.T) string {
	t.Helper()
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		t.Fatalf("rand: %v", err)
	}
	return hex.EncodeToString(b)
}

// fixture holds a department+program+session, a lecturer, and two students
// both approved-registered for one course, so Roster() has rows to return.
type fixture struct {
	pool         *pgxpool.Pool
	DepartmentID string
	Level        string
	SessionID    string
	LecturerUser string
	LecturerID   string // staff_profiles.id
	CourseID     string
	Student1ID   string
	Student1User string
	Student2ID   string
	Student2User string
}

func newFixture(t *testing.T) *fixture {
	t.Helper()
	pool := testPool(t)
	ctx := context.Background()
	suffix := rid(t)
	f := &fixture{pool: pool, Level: "300"}

	mustExec := func(sql string, args ...any) {
		t.Helper()
		if _, err := pool.Exec(ctx, sql, args...); err != nil {
			t.Fatalf("fixture setup (%s): %v", sql, err)
		}
	}
	mustScan := func(dst *string, sql string, args ...any) {
		t.Helper()
		if err := pool.QueryRow(ctx, sql, args...).Scan(dst); err != nil {
			t.Fatalf("fixture setup (%s): %v", sql, err)
		}
	}

	var facultyID string
	mustScan(&facultyID, `INSERT INTO faculties (name) VALUES ($1) RETURNING id::text`, "Test Faculty "+suffix)
	mustScan(&f.DepartmentID, `INSERT INTO departments (faculty_id, name, code) VALUES ($1::uuid, $2, $3) RETURNING id::text`,
		facultyID, "Test Dept "+suffix, "TST"+suffix)
	var programID string
	mustScan(&programID, `INSERT INTO programs (department_id, name, award, duration) VALUES ($1::uuid, $2, 'B.Sc.', 4) RETURNING id::text`,
		f.DepartmentID, "Test Program "+suffix)
	mustScan(&f.SessionID, `INSERT INTO academic_sessions (name, semester) VALUES ($1, 'First') RETURNING id::text`, "2099/2100-"+suffix)

	var studentRoleID, lecturerRoleID string
	mustScan(&studentRoleID, `SELECT id::text FROM roles WHERE code='student'`)
	mustScan(&lecturerRoleID, `SELECT id::text FROM roles WHERE code='lecturer'`)

	mustScan(&f.LecturerUser, `INSERT INTO users (role_id, identifier, password_hash, display_name) VALUES ($1::uuid, $2, 'x', 'Test Lecturer') RETURNING id::text`,
		lecturerRoleID, "TST/LEC/"+suffix)
	mustScan(&f.LecturerID, `INSERT INTO staff_profiles (user_id, staff_no, display_name, role, department_id, status) VALUES ($1::uuid, $2, 'Test Lecturer', 'lecturer', $3::uuid, 'active') RETURNING id::text`,
		f.LecturerUser, "TST/LEC/"+suffix, f.DepartmentID)

	mustScan(&f.CourseID, `INSERT INTO courses (department_id, lecturer_id, code, title, units, level, semester) VALUES ($1::uuid, $2::uuid, $3, 'Test Course', 3, $4, 'First') RETURNING id::text`,
		f.DepartmentID, f.LecturerID, "TST 101 "+suffix, f.Level)

	mustScan(&f.Student1User, `INSERT INTO users (role_id, identifier, password_hash, display_name) VALUES ($1::uuid, $2, 'x', 'Test Student One') RETURNING id::text`,
		studentRoleID, "TST/STU1/"+suffix)
	mustScan(&f.Student1ID, `INSERT INTO students (user_id, matric_no, first_name, last_name, level, program_id, department_id, status) VALUES ($1::uuid, $2, 'One', 'Test', $3, $4::uuid, $5::uuid, 'active') RETURNING id::text`,
		f.Student1User, "TST/1/"+suffix, f.Level, programID, f.DepartmentID)

	mustScan(&f.Student2User, `INSERT INTO users (role_id, identifier, password_hash, display_name) VALUES ($1::uuid, $2, 'x', 'Test Student Two') RETURNING id::text`,
		studentRoleID, "TST/STU2/"+suffix)
	mustScan(&f.Student2ID, `INSERT INTO students (user_id, matric_no, first_name, last_name, level, program_id, department_id, status) VALUES ($1::uuid, $2, 'Two', 'Test', $3, $4::uuid, $5::uuid, 'active') RETURNING id::text`,
		f.Student2User, "TST/2/"+suffix, f.Level, programID, f.DepartmentID)

	for _, sid := range []string{f.Student1ID, f.Student2ID} {
		var regID string
		mustScan(&regID, `INSERT INTO course_registrations (student_id, session_id, status, units, submitted_at) VALUES ($1::uuid, $2::uuid, 'approved', 3, now()) RETURNING id::text`,
			sid, f.SessionID)
		mustExec(`INSERT INTO course_registration_lines (registration_id, course_id) VALUES ($1::uuid, $2::uuid)`, regID, f.CourseID)
	}

	t.Cleanup(func() {
		testUsers := []string{f.LecturerUser, f.Student1User, f.Student2User}
		mustExec(`DELETE FROM class_reps WHERE department_id=$1::uuid`, f.DepartmentID)
		mustExec(`DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id=$1::uuid)`, f.CourseID)
		mustExec(`DELETE FROM assignments WHERE course_id=$1::uuid`, f.CourseID)
		mustExec(`DELETE FROM course_materials WHERE course_id=$1::uuid`, f.CourseID)
		mustExec(`DELETE FROM course_posts WHERE course_id=$1::uuid`, f.CourseID)
		mustExec(`DELETE FROM course_registration_lines WHERE course_id=$1::uuid`, f.CourseID)
		mustExec(`DELETE FROM course_registrations WHERE session_id=$1::uuid`, f.SessionID)
		mustExec(`DELETE FROM results WHERE session_id=$1::uuid`, f.SessionID)
		mustExec(`DELETE FROM courses WHERE id=$1::uuid`, f.CourseID)
		mustExec(`DELETE FROM students WHERE id=ANY($1::uuid[])`, []string{f.Student1ID, f.Student2ID})
		mustExec(`DELETE FROM staff_profiles WHERE id=$1::uuid`, f.LecturerID)
		mustExec(`DELETE FROM audit_logs WHERE actor_user_id=ANY($1::uuid[])`, testUsers)
		mustExec(`DELETE FROM users WHERE id=ANY($1::uuid[])`, testUsers)
		mustExec(`DELETE FROM academic_sessions WHERE id=$1::uuid`, f.SessionID)
		mustExec(`DELETE FROM programs WHERE id=$1::uuid`, programID)
		mustExec(`DELETE FROM departments WHERE id=$1::uuid`, f.DepartmentID)
		mustExec(`DELETE FROM faculties WHERE id=$1::uuid`, facultyID)
	})

	return f
}

func TestRosterAndUpsertScore(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()

	roster, err := r.Roster(ctx, f.CourseID, f.SessionID)
	if err != nil {
		t.Fatalf("roster: %v", err)
	}
	if len(roster) != 2 {
		t.Fatalf("expected 2 roster entries, got %d", len(roster))
	}
	for _, e := range roster {
		if e.Total != nil {
			t.Fatalf("expected no score yet, got %+v", e)
		}
	}

	if _, err := r.UpsertScore(ctx, f.CourseID, f.Student1ID, f.SessionID, "ca", 25, "not-the-lecturer", f.LecturerUser); err == nil {
		t.Fatal("expected forbidden for wrong lecturer")
	}

	entry, err := r.UpsertScore(ctx, f.CourseID, f.Student1ID, f.SessionID, "ca", 25, f.LecturerID, f.LecturerUser)
	if err != nil {
		t.Fatalf("upsert ca: %v", err)
	}
	if entry.CA == nil || *entry.CA != 25 || entry.Total == nil || *entry.Total != 25 || entry.Grade != "F" {
		t.Fatalf("unexpected entry after ca: %+v", entry)
	}

	entry, err = r.UpsertScore(ctx, f.CourseID, f.Student1ID, f.SessionID, "exam", 50, f.LecturerID, f.LecturerUser)
	if err != nil {
		t.Fatalf("upsert exam: %v", err)
	}
	if entry.Total == nil || *entry.Total != 75 || entry.Grade != "A" {
		t.Fatalf("unexpected entry after exam: %+v", entry)
	}

	if _, err := f.pool.Exec(ctx, `UPDATE results SET status='submitted' WHERE student_id=$1::uuid AND course_id=$2::uuid AND session_id=$3::uuid`,
		f.Student1ID, f.CourseID, f.SessionID); err != nil {
		t.Fatalf("lock fixture result: %v", err)
	}
	if _, err := r.UpsertScore(ctx, f.CourseID, f.Student1ID, f.SessionID, "ca", 10, f.LecturerID, f.LecturerUser); err == nil {
		t.Fatal("expected locked scores to reject further edits")
	}

	if _, err := r.UpsertScore(ctx, f.CourseID, f.Student1ID, f.SessionID, "ca", 999, f.LecturerID, f.LecturerUser); err == nil {
		t.Fatal("expected out-of-range ca to be rejected")
	}
}

func TestAssignmentsSubmissionsGrading(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()
	due := time.Now().Add(48 * time.Hour).UTC().Truncate(time.Second)

	if _, err := r.CreateAssignment(ctx, f.CourseID, "Assignment 1", due, 20, "do the thing", "not-the-lecturer", f.LecturerUser); err == nil {
		t.Fatal("expected forbidden for wrong lecturer")
	}

	asg, err := r.CreateAssignment(ctx, f.CourseID, "Assignment 1", due, 20, "do the thing", f.LecturerID, f.LecturerUser)
	if err != nil {
		t.Fatalf("create assignment: %v", err)
	}

	list, total, err := r.Assignments(ctx, 50, 0, f.CourseID)
	if err != nil {
		t.Fatalf("list assignments: %v", err)
	}
	if total != 1 || len(list) != 1 {
		t.Fatalf("expected 1 assignment, got total=%d len=%d", total, len(list))
	}

	sub, err := r.Submit(ctx, asg.ID, f.Student1ID, "work.pdf", "here it is", "", f.Student1User)
	if err != nil {
		t.Fatalf("submit: %v", err)
	}
	if sub.Status != "submitted" {
		t.Fatalf("expected submitted, got %s", sub.Status)
	}

	subs, total, err := r.Submissions(ctx, 50, 0, asg.ID)
	if err != nil {
		t.Fatalf("list submissions: %v", err)
	}
	if total != 1 || subs[0].MatricNo == "" || subs[0].StudentName == "" {
		t.Fatalf("expected 1 enriched submission, got %+v", subs)
	}

	if _, err := r.GradeSubmission(ctx, sub.ID, 18, "great work", "not-the-lecturer", f.LecturerUser); err == nil {
		t.Fatal("expected forbidden for wrong lecturer")
	}
	graded, err := r.GradeSubmission(ctx, sub.ID, 18, "great work", f.LecturerID, f.LecturerUser)
	if err != nil {
		t.Fatalf("grade: %v", err)
	}
	if graded.Status != "graded" || graded.Grade == nil || *graded.Grade != 18 {
		t.Fatalf("unexpected graded submission: %+v", graded)
	}

	if _, err := r.Submit(ctx, asg.ID, f.Student1ID, "resubmit.pdf", "", "", f.Student1User); err == nil {
		t.Fatal("expected resubmission after grading to be rejected")
	}
}

func TestMaterialsAndPosts(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()

	if _, err := r.AddMaterial(ctx, f.CourseID, "slides.pdf", "PDF", "2.1 MB", "", "not-the-lecturer", f.LecturerUser); err == nil {
		t.Fatal("expected forbidden for wrong lecturer")
	}
	if _, err := r.AddMaterial(ctx, f.CourseID, "slides.pdf", "PDF", "2.1 MB", "", f.LecturerID, f.LecturerUser); err != nil {
		t.Fatalf("add material: %v", err)
	}
	mats, total, err := r.Materials(ctx, 50, 0, f.CourseID)
	if err != nil {
		t.Fatalf("list materials: %v", err)
	}
	if total != 1 || len(mats) != 1 {
		t.Fatalf("expected 1 material, got total=%d len=%d", total, len(mats))
	}

	if _, err := r.AddPost(ctx, f.CourseID, "welcome to class", f.LecturerUser); err != nil {
		t.Fatalf("add post: %v", err)
	}
	posts, total, err := r.Posts(ctx, 50, 0, f.CourseID)
	if err != nil {
		t.Fatalf("list posts: %v", err)
	}
	if total != 1 || len(posts) != 1 {
		t.Fatalf("expected 1 post, got total=%d len=%d", total, len(posts))
	}
}

func TestClassRepsAndHelpers(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()

	if _, err := r.AssignClassRep(ctx, f.DepartmentID, "999", f.SessionID, f.Student1ID, f.LecturerUser); err == nil {
		t.Fatal("expected mismatched level to be rejected")
	}

	rep, err := r.AssignClassRep(ctx, f.DepartmentID, f.Level, f.SessionID, f.Student1ID, f.LecturerUser)
	if err != nil {
		t.Fatalf("assign class rep: %v", err)
	}
	if rep.StudentID != f.Student1ID {
		t.Fatalf("unexpected rep: %+v", rep)
	}

	reps, total, err := r.ClassReps(ctx, 50, 0, f.DepartmentID, f.SessionID)
	if err != nil {
		t.Fatalf("list class reps: %v", err)
	}
	if total != 1 || len(reps) != 1 {
		t.Fatalf("expected 1 class rep, got total=%d len=%d", total, len(reps))
	}

	isRepForCourse, err := r.IsClassRepForCourse(ctx, f.CourseID, f.Student1ID)
	if err != nil {
		t.Fatalf("is class rep for course: %v", err)
	}
	if !isRepForCourse {
		t.Fatal("expected student1 to be recognized as class rep for the course")
	}
	if isRepForCourse2, _ := r.IsClassRepForCourse(ctx, f.CourseID, f.Student2ID); isRepForCourse2 {
		t.Fatal("student2 should not be a class rep")
	}

	isRepFor, err := r.IsClassRepFor(ctx, f.Student1ID, f.Student2ID, f.SessionID)
	if err != nil {
		t.Fatalf("is class rep for: %v", err)
	}
	if !isRepFor {
		t.Fatal("expected student1 to be recognized as class rep for student2's cohort")
	}

	if err := r.RevokeClassRep(ctx, f.DepartmentID, f.Level, f.SessionID, f.Student1ID, f.LecturerUser); err != nil {
		t.Fatalf("revoke: %v", err)
	}
	if err := r.RevokeClassRep(ctx, f.DepartmentID, f.Level, f.SessionID, f.Student1ID, f.LecturerUser); err == nil {
		t.Fatal("expected revoking a non-existent assignment to fail")
	}
	if isRepForCourse, _ := r.IsClassRepForCourse(ctx, f.CourseID, f.Student1ID); isRepForCourse {
		t.Fatal("expected class rep status to be gone after revoke")
	}
}
