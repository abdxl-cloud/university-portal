-- Seed staff profiles, courses, and a result so the academic/directory reads
-- return demo data against Postgres. Faculty/department/program/session/student
-- were seeded earlier (000004); staff users in 000005.

INSERT INTO staff_profiles (user_id, staff_no, display_name, role, department_id, office, status)
SELECT u.id, v.staff_no, v.display_name, v.role,
       CASE WHEN v.role IN ('lecturer', 'hod') THEN (SELECT id FROM departments WHERE code = 'CSC') END,
       v.office, 'active'
FROM (VALUES
  ('FUT/STF/CSC/0391', 'FUT/STF/CSC/0391', 'Dr. F. Okonkwo',      'lecturer',  'CS Block, Rm 19'),
  ('FUT/STF/CSC/0102', 'FUT/STF/CSC/0102', 'Prof. Kunle Adewale', 'hod',       'CS Block, Rm 02'),
  ('FUT/STF/BUR/0319', 'FUT/STF/BUR/0319', 'Mrs. Halima Bello',   'bursary',   'Bursary Block, Rm 4'),
  ('FUT/STF/LIB/0044', 'FUT/STF/LIB/0044', 'Mrs. Grace Eze',      'librarian', 'Main Library, Desk 1'),
  ('FUT/STF/MED/0009', 'FUT/STF/MED/0009', 'Dr. Ahmed Bello',     'clinic',    'Medical Centre, Rm 1')
) AS v(identifier, staff_no, display_name, role, office)
JOIN users u ON u.identifier = v.identifier;

INSERT INTO courses (department_id, lecturer_id, code, title, units, level, semester)
SELECT (SELECT id FROM departments WHERE code = 'CSC'),
       (SELECT id FROM staff_profiles WHERE staff_no = 'FUT/STF/CSC/0391'),
       v.code, v.title, v.units, '300', 'First'
FROM (VALUES
  ('CSC 301', 'Data Structures & Algorithms', 3),
  ('CSC 303', 'Operating Systems', 3),
  ('CSC 305', 'Database Management Systems', 3)
) AS v(code, title, units);

INSERT INTO results (student_id, course_id, session_id, ca, exam, total, grade, status)
SELECT (SELECT id FROM students WHERE matric_no = 'FUT/2022/CSC/10428'),
       (SELECT id FROM courses WHERE code = 'CSC 305'),
       (SELECT id FROM academic_sessions WHERE name = '2024/2025'),
       27, 58, 85, 'A', 'published';
