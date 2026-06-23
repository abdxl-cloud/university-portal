-- Minimal seed so the library scan flow works end-to-end against Postgres.
-- The student's matric number matches the demo login identifier in
-- internal/auth (FUT/2022/CSC/10428) so a librarian can scan that student's QR.

WITH fac AS (
  INSERT INTO faculties (name) VALUES ('Computing & Engineering')
  RETURNING id
), dept AS (
  INSERT INTO departments (faculty_id, name, code)
  SELECT id, 'Computer Science', 'CSC' FROM fac
  RETURNING id
), prog AS (
  INSERT INTO programs (department_id, name, award, duration)
  SELECT id, 'B.Sc Computer Science', 'B.Sc', 4 FROM dept
  RETURNING id
), sess AS (
  INSERT INTO academic_sessions (name, semester, is_current)
  VALUES ('2024/2025', 'First', true)
  RETURNING id
), usr AS (
  INSERT INTO users (role_id, identifier, email, password_hash, display_name)
  SELECT r.id, 'FUT/2022/CSC/10428', 'student@futech.edu.ng', 'seed-not-used', 'Adaeze N. Okeke'
  FROM roles r WHERE r.code = 'student'
  RETURNING id
)
INSERT INTO students (user_id, matric_no, first_name, last_name, phone, level, program_id, department_id, status)
SELECT usr.id, 'FUT/2022/CSC/10428', 'Adaeze', 'Okeke', '08030000000', '300', prog.id, dept.id, 'active'
FROM usr, prog, dept;

INSERT INTO library_books (title, author, category, publication_year, call_no, copies, available, isbn) VALUES
  ('Introduction to Algorithms', 'Cormen, Leiserson, Rivest, Stein', 'Computer Science', 2009, 'QA76.6 .C66 2009', 3, 3, '9780262033848'),
  ('Database System Concepts', 'Silberschatz, Korth, Sudarshan', 'Computer Science', 2019, 'QA76.9.D3 S55 2019', 2, 2, '9780078022159'),
  ('Operating System Concepts', 'Silberschatz, Galvin, Gagne', 'Computer Science', 2018, 'QA76.76.O63 S55 2018', 2, 2, '9781118063330');
