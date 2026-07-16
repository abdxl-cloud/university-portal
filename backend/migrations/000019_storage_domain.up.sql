-- Storage domain: local-disk-backed document uploads (deferment attachments,
-- assignment submissions, course materials), behind a small interface that's
-- swappable for S3-compatible storage later without touching callers.
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_owner_user_id ON documents (owner_user_id);

-- student_cases.attachment_id was left as a bare UUID in 000016 because this
-- table didn't exist yet. Wire up the real FK now.
ALTER TABLE student_cases ADD CONSTRAINT student_cases_attachment_id_fkey
  FOREIGN KEY (attachment_id) REFERENCES documents(id);

-- Optional real-file pointer alongside the client-supplied display metadata
-- already on these tables (file_name/note, name/file_type/size_label) --
-- additive, doesn't change the existing demo-metadata-only flow.
ALTER TABLE assignment_submissions ADD COLUMN document_id UUID REFERENCES documents(id);
ALTER TABLE course_materials ADD COLUMN document_id UUID REFERENCES documents(id);
