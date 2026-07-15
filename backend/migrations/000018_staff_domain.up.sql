-- Staff domain: a course's class space (materials, announcements,
-- assignments) plus per-department+level+session class reps. Roster/score
-- entry needs no new table -- it reads the roster from approved
-- course_registration_lines and writes scores straight into results while
-- status='draft' (see internal/staff.UpsertScore).

CREATE TABLE course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_materials_course_id ON course_materials (course_id);

CREATE TABLE course_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_posts_course_id ON course_posts (course_id);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  points INT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_course_id ON assignments (course_id);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  student_id UUID NOT NULL REFERENCES students(id),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
  file_name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade INT,
  feedback TEXT NOT NULL DEFAULT '',
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX idx_assignment_submissions_student_id ON assignment_submissions (student_id);

-- One (or occasionally more, e.g. rep + assistant) student(s) recognized as
-- the class representative for a department+level+session cohort.
CREATE TABLE class_reps (
  department_id UUID NOT NULL REFERENCES departments(id),
  level TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES academic_sessions(id),
  student_id UUID NOT NULL REFERENCES students(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (department_id, level, session_id, student_id)
);

CREATE INDEX idx_class_reps_student_id ON class_reps (student_id);
