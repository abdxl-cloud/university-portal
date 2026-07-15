-- A review stage isn't always one role: a scrutiny board or senate is a set
-- of positions that must ALL sign off before the stage clears. Move the
-- single actor_role column on workflow_stages into a many-to-many table so a
-- stage can require one role (like the existing HOD/Dean steps) or several.
CREATE TABLE workflow_stage_roles (
  stage_id UUID NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL,
  PRIMARY KEY (stage_id, actor_role)
);

INSERT INTO workflow_stage_roles (stage_id, actor_role)
SELECT id, actor_role FROM workflow_stages;

ALTER TABLE workflow_stages DROP COLUMN actor_role;

-- Tracks which of a board stage's required roles have signed off for a given
-- department+level+session cohort's current pass through that stage.
-- Cleared (per cohort) whenever the cohort is (re)compiled, so a requery
-- doesn't let stale approvals count toward the next attempt.
CREATE TABLE level_review_stage_approvals (
  level_review_progress_id UUID NOT NULL REFERENCES level_review_progress(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL,
  approved_by UUID NOT NULL REFERENCES users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (level_review_progress_id, stage_id, actor_role)
);
