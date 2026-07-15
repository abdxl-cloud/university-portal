// Integration tests against a real Postgres (per backend/CONVENTIONS.md, this
// codebase uses no mocks). Point DATABASE_URL at a reachable instance with
// the full migration set applied; tests skip themselves if it's unset.
// Fixtures use randomly-suffixed identifiers and clean up after themselves
// via t.Cleanup, so they're safe to run against a shared/live database.
package courses

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"formbuilder/backend/internal/apperr"
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

// fixture holds everything a test needs to exercise the results/workflow
// pipeline: one department+program+session, a lecturer, and a couple of
// students. Every row is tagged with a random suffix and torn down in
// reverse-FK order at the end of the test.
type fixture struct {
	pool         *pgxpool.Pool
	DepartmentID string
	SessionID    string
	LecturerUser string
	LecturerID   string // staff_profiles.id
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
	f := &fixture{pool: pool}

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

	mustScan(&f.Student1User, `INSERT INTO users (role_id, identifier, password_hash, display_name) VALUES ($1::uuid, $2, 'x', 'Test Student One') RETURNING id::text`,
		studentRoleID, "TST/STU1/"+suffix)
	mustScan(&f.Student1ID, `INSERT INTO students (user_id, matric_no, first_name, last_name, level, program_id, department_id, status) VALUES ($1::uuid, $2, 'One', 'Test', '300', $3::uuid, $4::uuid, 'active') RETURNING id::text`,
		f.Student1User, "TST/1/"+suffix, programID, f.DepartmentID)

	mustScan(&f.Student2User, `INSERT INTO users (role_id, identifier, password_hash, display_name) VALUES ($1::uuid, $2, 'x', 'Test Student Two') RETURNING id::text`,
		studentRoleID, "TST/STU2/"+suffix)
	mustScan(&f.Student2ID, `INSERT INTO students (user_id, matric_no, first_name, last_name, level, program_id, department_id, status) VALUES ($1::uuid, $2, 'Two', 'Test', '300', $3::uuid, $4::uuid, 'active') RETURNING id::text`,
		f.Student2User, "TST/2/"+suffix, programID, f.DepartmentID)

	t.Cleanup(func() {
		mustExec(`DELETE FROM grade_condonements WHERE result_id IN (SELECT id FROM results WHERE session_id=$1::uuid)`, f.SessionID)
		mustExec(`DELETE FROM level_review_stage_approvals WHERE level_review_progress_id IN (SELECT id FROM level_review_progress WHERE session_id=$1::uuid)`, f.SessionID)
		mustExec(`DELETE FROM level_review_progress WHERE session_id=$1::uuid`, f.SessionID)
		mustExec(`DELETE FROM student_cases WHERE session_id=$1::uuid`, f.SessionID)
		mustExec(`DELETE FROM results WHERE session_id=$1::uuid`, f.SessionID)
		mustExec(`DELETE FROM courses WHERE department_id=$1::uuid`, f.DepartmentID)
		mustExec(`DELETE FROM students WHERE id=ANY($1::uuid[])`, []string{f.Student1ID, f.Student2ID})
		mustExec(`DELETE FROM staff_profiles WHERE id=$1::uuid`, f.LecturerID)
		testUsers := []string{f.LecturerUser, f.Student1User, f.Student2User}
		mustExec(`DELETE FROM audit_logs WHERE actor_user_id=ANY($1::uuid[])`, testUsers)
		mustExec(`DELETE FROM users WHERE id=ANY($1::uuid[])`, testUsers)
		mustExec(`DELETE FROM academic_sessions WHERE id=$1::uuid`, f.SessionID)
		mustExec(`DELETE FROM programs WHERE id=$1::uuid`, programID)
		mustExec(`DELETE FROM departments WHERE id=$1::uuid`, f.DepartmentID)
		mustExec(`DELETE FROM faculties WHERE id=$1::uuid`, facultyID)
	})

	return f
}

func (f *fixture) newCourse(t *testing.T, code string) string {
	t.Helper()
	var id string
	err := f.pool.QueryRow(context.Background(), `
		INSERT INTO courses (department_id, lecturer_id, code, title, units, level, semester)
		VALUES ($1::uuid, $2::uuid, $3, 'Test Course', 3, '300', 'First') RETURNING id::text`,
		f.DepartmentID, f.LecturerID, code).Scan(&id)
	if err != nil {
		t.Fatalf("create course: %v", err)
	}
	return id
}

func (f *fixture) insertResult(t *testing.T, studentID, courseID string, ca, exam int, grade, status string) string {
	t.Helper()
	var id string
	err := f.pool.QueryRow(context.Background(), `
		INSERT INTO results (student_id, course_id, session_id, ca, exam, total, grade, status)
		VALUES ($1::uuid, $2::uuid, $3::uuid, $4::int, $5::int, $6::int, $7, $8) RETURNING id::text`,
		studentID, courseID, f.SessionID, ca, exam, ca+exam, grade, status).Scan(&id)
	if err != nil {
		t.Fatalf("insert result: %v", err)
	}
	return id
}

func (f *fixture) resultStatus(t *testing.T, id string) string {
	t.Helper()
	var status string
	if err := f.pool.QueryRow(context.Background(), `SELECT status FROM results WHERE id=$1::uuid`, id).Scan(&status); err != nil {
		t.Fatalf("read result status: %v", err)
	}
	return status
}

func TestSubmitDecideAndCondoneResults(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()
	course := f.newCourse(t, "TST 101 "+rid(t))
	res1 := f.insertResult(t, f.Student1ID, course, 20, 30, "F", "draft")

	// Wrong lecturer can't submit someone else's course.
	if _, err := r.SubmitResults(ctx, course, f.SessionID, "not-the-lecturer", f.LecturerUser); !errors.Is(err, apperr.ErrForbidden) {
		t.Fatalf("expected forbidden for wrong lecturer, got %v", err)
	}

	n, err := r.SubmitResults(ctx, course, f.SessionID, f.LecturerID, f.LecturerUser)
	if err != nil {
		t.Fatalf("submit: %v", err)
	}
	if n != 1 {
		t.Fatalf("expected 1 row submitted, got %d", n)
	}
	if got := f.resultStatus(t, res1); got != "submitted" {
		t.Fatalf("expected submitted, got %s", got)
	}

	// Submitting again finds nothing left in draft.
	if _, err := r.SubmitResults(ctx, course, f.SessionID, f.LecturerID, f.LecturerUser); err == nil {
		t.Fatal("expected error resubmitting an already-submitted sheet")
	}

	// Query sends it back to draft.
	if _, err := r.DecideResults(ctx, course, f.SessionID, "query", "fix ca", f.LecturerUser); err != nil {
		t.Fatalf("query: %v", err)
	}
	if got := f.resultStatus(t, res1); got != "draft" {
		t.Fatalf("expected draft after query, got %s", got)
	}

	// Resubmit and approve for real.
	if _, err := r.SubmitResults(ctx, course, f.SessionID, f.LecturerID, f.LecturerUser); err != nil {
		t.Fatalf("resubmit: %v", err)
	}
	if _, err := r.DecideResults(ctx, course, f.SessionID, "approved", "", f.LecturerUser); err != nil {
		t.Fatalf("approve: %v", err)
	}
	if got := f.resultStatus(t, res1); got != "approved" {
		t.Fatalf("expected approved, got %s", got)
	}

	// Condonement: total is 50 (20+30), not a borderline F, so it's rejected.
	if _, err := r.CondoneResult(ctx, res1, f.LecturerUser); err == nil {
		t.Fatal("expected condonement to be rejected for a non-borderline total")
	}

	res2 := f.insertResult(t, f.Student2ID, course, 15, 24, "F", "draft") // total 39
	c, err := r.CondoneResult(ctx, res2, f.LecturerUser)
	if err != nil {
		t.Fatalf("condone borderline F: %v", err)
	}
	if c.ResultID != res2 {
		t.Fatalf("condonement result id mismatch: %s vs %s", c.ResultID, res2)
	}
}

func TestLevelReviewLifecycle(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()
	course := f.newCourse(t, "TST 201 "+rid(t))
	res1 := f.insertResult(t, f.Student1ID, course, 20, 40, "B", "submitted")
	res2 := f.insertResult(t, f.Student2ID, course, 20, 40, "B", "submitted")

	// Compiling before every result is approved must fail.
	if _, err := r.CompileLevel(ctx, f.DepartmentID, "300", f.SessionID, f.LecturerUser); err == nil {
		t.Fatal("expected compile to fail while results are still submitted")
	}

	if _, err := f.pool.Exec(ctx, `UPDATE results SET status='approved' WHERE id=ANY($1::uuid[])`, []string{res1, res2}); err != nil {
		t.Fatalf("approve fixture results: %v", err)
	}

	lrp, err := r.CompileLevel(ctx, f.DepartmentID, "300", f.SessionID, f.LecturerUser)
	if err != nil {
		t.Fatalf("compile: %v", err)
	}
	if lrp.Stage != "reviewing" {
		t.Fatalf("expected reviewing, got %s", lrp.Stage)
	}

	// Wrong role can't decide this stage (default seed: position 1 = hod).
	if _, err := r.DecideStage(ctx, lrp.ID, "approved", "dean", f.LecturerUser); err == nil {
		t.Fatal("expected forbidden for wrong stage role")
	}

	lrp, err = r.DecideStage(ctx, lrp.ID, "approved", "hod", f.LecturerUser)
	if err != nil {
		t.Fatalf("hod decide: %v", err)
	}
	if lrp.Stage != "reviewing" || lrp.ReviewIndex != 2 {
		t.Fatalf("expected reviewing at stage 2, got %s/%d", lrp.Stage, lrp.ReviewIndex)
	}

	lrp, err = r.DecideStage(ctx, lrp.ID, "approved", "dean", f.LecturerUser)
	if err != nil {
		t.Fatalf("dean decide: %v", err)
	}
	if lrp.Stage != "ready" {
		t.Fatalf("expected ready after last stage, got %s", lrp.Stage)
	}

	if _, err := r.PublishLevel(ctx, lrp.ID, f.LecturerUser); err != nil {
		t.Fatalf("publish: %v", err)
	}
	if got := f.resultStatus(t, res1); got != "released" {
		t.Fatalf("expected released, got %s", got)
	}
	if got := f.resultStatus(t, res2); got != "released" {
		t.Fatalf("expected released, got %s", got)
	}
}

func TestLevelReviewQueryKicksBackToCompiling(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()
	course := f.newCourse(t, "TST 202 "+rid(t))
	res1 := f.insertResult(t, f.Student1ID, course, 20, 40, "B", "approved")

	lrp, err := r.CompileLevel(ctx, f.DepartmentID, "300", f.SessionID, f.LecturerUser)
	if err != nil {
		t.Fatalf("compile: %v", err)
	}
	lrp, err = r.DecideStage(ctx, lrp.ID, "queried", "hod", f.LecturerUser)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if lrp.Stage != "compiling" || lrp.ReviewIndex != 0 {
		t.Fatalf("expected compiling/0 after query, got %s/%d", lrp.Stage, lrp.ReviewIndex)
	}
	if got := f.resultStatus(t, res1); got != "approved" {
		t.Fatalf("query shouldn't touch result status, got %s", got)
	}
}

// TestWorkflowStagesBoard exercises a stage with more than one required
// role (a "board"): it must not advance until every required role has
// approved. It temporarily replaces the global workflow chain and restores
// the original afterward, since workflow_stages is shared, not per-fixture.
func TestWorkflowStagesBoard(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()

	original, err := r.WorkflowStages(ctx)
	if err != nil {
		t.Fatalf("read original stages: %v", err)
	}
	t.Cleanup(func() {
		restore := make([]WorkflowStageInput, len(original))
		for i, s := range original {
			restore[i] = WorkflowStageInput{Position: s.Position, Roles: s.Roles, Label: s.Label}
		}
		if _, err := r.SetWorkflowStages(context.Background(), restore, f.LecturerUser); err != nil {
			t.Errorf("restore original stages: %v", err)
		}
	})

	stages, err := r.SetWorkflowStages(ctx, []WorkflowStageInput{
		{Position: 1, Roles: []string{"hod", "dean"}, Label: "Scrutiny Board"},
	}, f.LecturerUser)
	if err != nil {
		t.Fatalf("set board stage: %v", err)
	}
	if len(stages) != 1 || len(stages[0].Roles) != 2 {
		t.Fatalf("expected one stage with 2 roles, got %+v", stages)
	}

	course := f.newCourse(t, "TST 203 "+rid(t))
	f.insertResult(t, f.Student1ID, course, 20, 40, "B", "approved")

	lrp, err := r.CompileLevel(ctx, f.DepartmentID, "300", f.SessionID, f.LecturerUser)
	if err != nil {
		t.Fatalf("compile: %v", err)
	}

	// hod alone isn't enough for a 2-role board.
	lrp, err = r.DecideStage(ctx, lrp.ID, "approved", "hod", f.LecturerUser)
	if err != nil {
		t.Fatalf("hod decide: %v", err)
	}
	if lrp.Stage != "reviewing" {
		t.Fatalf("expected still reviewing after only one of two board members approved, got %s", lrp.Stage)
	}

	// dean completes the board.
	lrp, err = r.DecideStage(ctx, lrp.ID, "approved", "dean", f.LecturerUser)
	if err != nil {
		t.Fatalf("dean decide: %v", err)
	}
	if lrp.Stage != "ready" {
		t.Fatalf("expected ready once the whole board approved, got %s", lrp.Stage)
	}
}

func TestStudentCasesLifecycle(t *testing.T) {
	f := newFixture(t)
	r := NewRepo(f.pool)
	ctx := context.Background()

	if _, err := r.RaiseCase(ctx, RaiseCaseInput{
		StudentID: f.Student1ID, SessionID: f.SessionID, Level: "300",
		Type: "absconded", Reason: "no reason", AttachmentID: "not-a-real-id",
	}, f.LecturerUser); err == nil {
		t.Fatal("expected attachment on a non-deferment case to be rejected")
	}

	if _, err := r.RaiseCase(ctx, RaiseCaseInput{
		StudentID: f.Student1ID, SessionID: f.SessionID, Level: "300",
		Type: "not-a-real-type", Reason: "no reason",
	}, f.LecturerUser); err == nil {
		t.Fatal("expected invalid case type to be rejected")
	}

	sc, err := r.RaiseCase(ctx, RaiseCaseInput{
		StudentID: f.Student1ID, SessionID: f.SessionID, Level: "300",
		Type: "suspended", Reason: "disciplinary",
	}, f.LecturerUser)
	if err != nil {
		t.Fatalf("raise case: %v", err)
	}
	if sc.Status != "flagged" {
		t.Fatalf("expected flagged, got %s", sc.Status)
	}

	items, total, err := r.StudentCases(ctx, 50, 0, f.Student1ID, "", "")
	if err != nil {
		t.Fatalf("list cases: %v", err)
	}
	if total != 1 || len(items) != 1 {
		t.Fatalf("expected 1 case, got total=%d len=%d", total, len(items))
	}

	decided, err := r.DecideCase(ctx, sc.ID, "approved", f.LecturerUser)
	if err != nil {
		t.Fatalf("decide case: %v", err)
	}
	if decided.Status != "approved" || decided.DecidedBy == "" {
		t.Fatalf("expected approved with a decider, got %+v", decided)
	}

	// Can't decide an already-decided case again.
	if _, err := r.DecideCase(ctx, sc.ID, "declined", f.LecturerUser); err == nil {
		t.Fatal("expected deciding an already-decided case to fail")
	}
}
