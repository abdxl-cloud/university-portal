CREATE TABLE app_modules (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_modules (code, name, enabled) VALUES
  ('academics', 'Academics', true),
  ('finance', 'Finance', true),
  ('hostels', 'Hostels', true),
  ('library', 'Library', true),
  ('clinic', 'Clinic', true),
  ('identity', 'Identity', true),
  ('operations', 'Operations', true),
  ('support', 'Support', true)
ON CONFLICT (code) DO NOTHING;
