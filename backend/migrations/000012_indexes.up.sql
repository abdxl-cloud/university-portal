-- Every table added in 000002_portal_domain had zero indexes beyond what a
-- PRIMARY KEY/UNIQUE constraint auto-creates. At demo scale (a few dozen rows
-- per table) that's invisible; at a real university's scale (100k+ students
-- across many faculties/departments, results/registrations/notifications
-- accumulating every session) every one of these becomes a sequential scan.
--
-- Skipped on purpose (already covered by an existing composite index whose
-- leading column matches the lookup):
--   results(student_id, course_id, session_id) UNIQUE  -> student_id lookups covered
--   invoice_items(invoice_id, fee_item_id) PK           -> invoice_id lookups covered
--   course_registration_lines(registration_id, course_id) PK -> registration_id lookups covered

-- students: user_id is looked up on essentially every authenticated student
-- request (studentScope -> StudentIDByUserID), the hottest path in the app.
CREATE INDEX idx_students_user_id ON students (user_id);
CREATE INDEX idx_students_department_id ON students (department_id);
CREATE INDEX idx_students_program_id ON students (program_id);

-- staff_profiles: same "my profile" resolution pattern once the staff domain
-- gets its own scoping (mirrors students.user_id above).
CREATE INDEX idx_staff_profiles_user_id ON staff_profiles (user_id);
CREATE INDEX idx_staff_profiles_department_id ON staff_profiles (department_id);

-- org hierarchy
CREATE INDEX idx_departments_faculty_id ON departments (faculty_id);
CREATE INDEX idx_programs_department_id ON programs (department_id);

-- courses: lecturer_id backs "my courses" for staff; department_id backs
-- department-scoped catalogue browsing.
CREATE INDEX idx_courses_department_id ON courses (department_id);
CREATE INDEX idx_courses_lecturer_id ON courses (lecturer_id);

-- results: course_id/session_id back the lecturer roster and level-compile
-- queries (results.student_id itself is already covered by the UNIQUE above).
CREATE INDEX idx_results_course_id ON results (course_id);
CREATE INDEX idx_results_session_id ON results (session_id);
CREATE INDEX idx_results_status ON results (status);

-- course_registrations: hot list-by-student path, sorted by submitted_at.
CREATE INDEX idx_course_registrations_student_id ON course_registrations (student_id);
CREATE INDEX idx_course_registrations_session_id ON course_registrations (session_id);
CREATE INDEX idx_course_registrations_submitted_at ON course_registrations (submitted_at DESC);
CREATE INDEX idx_course_registration_lines_course_id ON course_registration_lines (course_id);

-- fees: invoices filtered by student, payments joined through invoice_id.
CREATE INDEX idx_invoices_student_id ON invoices (student_id);
CREATE INDEX idx_invoices_session_id ON invoices (session_id);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_payments_invoice_id ON payments (invoice_id);

-- hostels
CREATE INDEX idx_hostel_rooms_hall_id ON hostel_rooms (hall_id);
CREATE INDEX idx_hostel_beds_room_id ON hostel_beds (room_id);
CREATE INDEX idx_hostel_applications_student_id ON hostel_applications (student_id);
CREATE INDEX idx_hostel_applications_hall_id ON hostel_applications (hall_id);
CREATE INDEX idx_hostel_applications_status ON hostel_applications (status);
CREATE INDEX idx_hostel_applications_created_at ON hostel_applications (created_at DESC);

-- library: loans/reservations filtered by student and sorted by due_at/
-- created_at; ScanReturn joins library_loans to library_books on book_id
-- filtered by status.
CREATE INDEX idx_library_loans_student_id ON library_loans (student_id);
CREATE INDEX idx_library_loans_book_id_status ON library_loans (book_id, status);
CREATE INDEX idx_library_loans_due_at ON library_loans (due_at DESC);
CREATE INDEX idx_library_reservations_student_id ON library_reservations (student_id);
CREATE INDEX idx_library_reservations_book_id ON library_reservations (book_id);
CREATE INDEX idx_library_reservations_created_at ON library_reservations (created_at DESC);

-- clinic
CREATE INDEX idx_clinic_appointments_student_id ON clinic_appointments (student_id);
CREATE INDEX idx_clinic_appointments_created_at ON clinic_appointments (created_at DESC);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions (patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions (doctor_id);

-- ops: approvals/notifications/support_tickets are always filtered by
-- assignee/owner or status and sorted by created_at.
CREATE INDEX idx_approvals_assigned_to ON approvals (assigned_to);
CREATE INDEX idx_approvals_status ON approvals (status);
CREATE INDEX idx_approvals_created_at ON approvals (created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id) WHERE NOT read;
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX idx_support_tickets_student_id ON support_tickets (student_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets (created_at DESC);

-- audit_logs: admin views filter by actor and always sort by recency.
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs (actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- sessions: token_hash is already UNIQUE (indexed); user_id isn't, needed for
-- "list my active sessions" / "revoke all sessions for this user" admin ops.
CREATE INDEX idx_sessions_user_id ON sessions (user_id);
