ALTER TABLE course_materials DROP COLUMN document_id;
ALTER TABLE assignment_submissions DROP COLUMN document_id;
ALTER TABLE student_cases DROP CONSTRAINT student_cases_attachment_id_fkey;
DROP TABLE documents;
