-- Additive V7 -> V8 migration. Safe to run repeatedly on the existing D1 database.
CREATE TABLE IF NOT EXISTS media_overrides (
  media_key TEXT PRIMARY KEY,
  r2_key TEXT,
  mime_type TEXT,
  size INTEGER,
  alt_fr TEXT NOT NULL DEFAULT '',
  alt_en TEXT NOT NULL DEFAULT '',
  object_position TEXT NOT NULL DEFAULT 'center',
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cv_access_attempts (
  rate_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cv_access_attempts_expiry ON cv_access_attempts(window_started);
CREATE TABLE IF NOT EXISTS publication_flags (
  language TEXT NOT NULL CHECK (language IN ('fr','en')),
  section TEXT NOT NULL,
  visible INTEGER NOT NULL CHECK (visible IN (0,1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (language, section)
);
INSERT INTO settings (key,value,updated_at) VALUES
  ('cv_access_enabled','false',unixepoch()),
  ('cv_access_digest','',unixepoch()),
  ('cv_access_version','0',unixepoch()),
  ('cep_available','false',unixepoch()),
  ('cep_public','false',unixepoch()),
  ('cep_protected','false',unixepoch())
ON CONFLICT(key) DO NOTHING;
