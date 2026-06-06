CREATE TABLE faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculties(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  semester TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL,
  award TEXT NOT NULL,
  duration INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  matric_no TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  level TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES programs(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  staff_no TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  office TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  amount_kobo BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  required BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  session_id UUID NOT NULL REFERENCES academic_sessions(id),
  total_kobo BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoice_items (
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fee_item_id UUID NOT NULL REFERENCES fee_items(id),
  amount_kobo BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  PRIMARY KEY (invoice_id, fee_item_id)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  reference TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  amount_kobo BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL,
  paid_at TIMESTAMPTZ
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id),
  lecturer_id UUID REFERENCES staff_profiles(id),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  units INT NOT NULL,
  level TEXT NOT NULL,
  semester TEXT NOT NULL
);

CREATE TABLE course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  session_id UUID NOT NULL REFERENCES academic_sessions(id),
  status TEXT NOT NULL DEFAULT 'draft',
  units INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ
);

CREATE TABLE course_registration_lines (
  registration_id UUID NOT NULL REFERENCES course_registrations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id),
  PRIMARY KEY (registration_id, course_id)
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  session_id UUID NOT NULL REFERENCES academic_sessions(id),
  ca INT NOT NULL DEFAULT 0,
  exam INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  grade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  UNIQUE (student_id, course_id, session_id)
);

CREATE TABLE hostel_halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL
);

CREATE TABLE hostel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES hostel_halls(id),
  room_no TEXT NOT NULL,
  capacity INT NOT NULL,
  occupied INT NOT NULL DEFAULT 0,
  UNIQUE (hall_id, room_no)
);

CREATE TABLE hostel_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES hostel_rooms(id),
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  UNIQUE (room_id, label)
);

CREATE TABLE hostel_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  hall_id UUID NOT NULL REFERENCES hostel_halls(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  publication_year INT,
  call_no TEXT NOT NULL UNIQUE,
  copies INT NOT NULL,
  available INT NOT NULL
);

CREATE TABLE library_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id),
  student_id UUID NOT NULL REFERENCES students(id),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'on-loan',
  fine_kobo BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN'
);

CREATE TABLE library_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id),
  student_id UUID NOT NULL REFERENCES students(id),
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patient_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id),
  blood_group TEXT,
  genotype TEXT,
  allergies TEXT,
  emergency_no TEXT
);

CREATE TABLE clinic_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  service TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient_records(id),
  drug TEXT NOT NULL,
  dosage TEXT NOT NULL,
  doctor_id UUID REFERENCES staff_profiles(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pharmacy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  stock INT NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok'
);

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'accent',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

