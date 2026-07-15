ALTER TABLE workflow_stages ADD COLUMN actor_role TEXT;

UPDATE workflow_stages ws SET actor_role = (
  SELECT wsr.actor_role FROM workflow_stage_roles wsr
  WHERE wsr.stage_id = ws.id
  ORDER BY wsr.actor_role LIMIT 1
);

ALTER TABLE workflow_stages ALTER COLUMN actor_role SET NOT NULL;

DROP TABLE level_review_stage_approvals;
DROP TABLE workflow_stage_roles;
