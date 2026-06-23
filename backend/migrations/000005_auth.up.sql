-- Real authentication: opaque-token sessions + demo accounts in the users table.

CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

-- Seed the demo accounts into the real users table so the existing demo logins
-- keep working against a connected database. Password for all is "demo1234",
-- bcrypt-hashed by pgcrypto (enabled in 000001). The student (FUT/2022/CSC/10428)
-- already exists from the 000004 seed, so its password_hash is updated in place.
INSERT INTO users (role_id, identifier, email, password_hash, display_name)
SELECT r.id, v.identifier, v.email, crypt('demo1234', gen_salt('bf', 10)), v.display_name
FROM (VALUES
  ('student',   'FUT/2022/CSC/10428', 'student@futech.edu.ng',  'Adaeze N. Okeke'),
  ('lecturer',  'FUT/STF/CSC/0391',   'lecturer@futech.edu.ng', 'Dr. F. Okonkwo'),
  ('adviser',   'FUT/STF/CSC/0288',   'adviser@futech.edu.ng',  'Dr. Chioma Madu'),
  ('hod',       'FUT/STF/CSC/0102',   'hod@futech.edu.ng',      'Prof. Kunle Adewale'),
  ('dean',      'FUT/STF/COM/0007',   'dean@futech.edu.ng',     'Prof. Adaeze Nwachukwu'),
  ('exams',     'FUT/STF/EXM/0451',   'exams@futech.edu.ng',    'Mr. Sunday Eke'),
  ('bursary',   'FUT/STF/BUR/0319',   'bursary@futech.edu.ng',  'Mrs. Halima Bello'),
  ('librarian', 'FUT/STF/LIB/0044',   'library@futech.edu.ng',  'Mrs. Grace Eze'),
  ('clinic',    'FUT/STF/MED/0009',   'clinic@futech.edu.ng',   'Dr. Ahmed Bello'),
  ('hostel',    'FUT/STF/SAF/0277',   'hostel@futech.edu.ng',   'Mr. Tunde Afolabi'),
  ('registry',  'FUT/STF/REG/0061',   'registry@futech.edu.ng', 'Mrs. Patricia Okon'),
  ('ict',       'FUT/STF/ICT/0015',   'ict@futech.edu.ng',      'Engr. David Umeh')
) AS v(role_code, identifier, email, display_name)
JOIN roles r ON r.code = v.role_code
ON CONFLICT (identifier) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      email         = EXCLUDED.email,
      display_name  = EXCLUDED.display_name,
      role_id       = EXCLUDED.role_id;
