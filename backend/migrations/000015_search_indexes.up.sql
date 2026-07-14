CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_students_matric_no_trgm ON students USING gin (matric_no gin_trgm_ops);
CREATE INDEX idx_students_first_name_trgm ON students USING gin (first_name gin_trgm_ops);
CREATE INDEX idx_students_last_name_trgm ON students USING gin (last_name gin_trgm_ops);

CREATE INDEX idx_staff_profiles_staff_no_trgm ON staff_profiles USING gin (staff_no gin_trgm_ops);
CREATE INDEX idx_staff_profiles_display_name_trgm ON staff_profiles USING gin (display_name gin_trgm_ops);

CREATE INDEX idx_courses_code_trgm ON courses USING gin (code gin_trgm_ops);
CREATE INDEX idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops);
