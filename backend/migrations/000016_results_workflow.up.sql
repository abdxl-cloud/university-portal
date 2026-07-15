-- Standardize the results status vocabulary the whole submit/approve/publish
-- pipeline depends on: draft (scores entered) -> submitted (lecturer done) ->
-- approved (review chain cleared) -> released (visible in transcripts). The
-- one seeded demo row used 'published' before this was ever pinned down, and
-- AcademicRecord already filters on 'released' -- fix the drift.
UPDATE results SET status = 'released' WHERE status = 'published';
ALTER TABLE results ADD CONSTRAINT results_status_check
  CHECK (status IN ('draft', 'submitted', 'approved', 'released'));

-- The configurable review chain a compiled level's results walk through
-- before publication. Ships with the HOD -> Dean pair the frontend hardcoded;
-- ICT can edit it via PUT /api/v1/workflow-stages.
CREATE TABLE workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INT NOT NULL UNIQUE,
  actor_role TEXT NOT NULL,
  label TEXT NOT NULL
);

INSERT INTO workflow_stages (position, actor_role, label) VALUES
  (1, 'hod', 'Head of Department review'),
  (2, 'dean', 'Dean review');

-- One row per department+level+session cohort, tracking where its compiled
-- results sit in the workflow_stages chain above.
CREATE TABLE level_review_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id),
  level TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES academic_sessions(id),
  stage TEXT NOT NULL DEFAULT 'compiling'
    CHECK (stage IN ('compiling', 'reviewing', 'ready', 'published')),
  review_index INT NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (department_id, level, session_id)
);

CREATE INDEX idx_level_review_progress_session_id ON level_review_progress (session_id);

-- The five case types role-academics.jsx's CASE_TYPES describes: a student
-- (or staff on their behalf) flags something that needs a decision before the
-- student's record can be treated as normal for that session/level.
CREATE TABLE student_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  session_id UUID NOT NULL REFERENCES academic_sessions(id),
  level TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('deferment', 'absconded', 'suspended', 'dex', 'teaching_practice')),
  status TEXT NOT NULL DEFAULT 'flagged'
    CHECK (status IN ('flagged', 'approved', 'declined')),
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  -- References the future storage domain's documents(id); no FK yet since
  -- that table doesn't exist (Phase 6, still pending). Only 'deferment' cases
  -- are expected to carry one.
  attachment_id UUID,
  raised_by UUID NOT NULL REFERENCES users(id),
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_cases_student_id ON student_cases (student_id);
CREATE INDEX idx_student_cases_session_id ON student_cases (session_id);
CREATE INDEX idx_student_cases_status ON student_cases (status);

-- The 38-39 borderline-F override: a result stays graded F but is excluded
-- from the carryover list once condoned.
CREATE TABLE grade_condonements (
  result_id UUID PRIMARY KEY REFERENCES results(id),
  condoned_by UUID NOT NULL REFERENCES users(id),
  condoned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
