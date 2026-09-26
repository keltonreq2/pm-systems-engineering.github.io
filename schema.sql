CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  rate_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_window ON login_attempts(window_started);

INSERT INTO settings (key, value, updated_at) VALUES
  ('site_public', 'false', unixepoch()),
  ('linkedin_url', '', unixepoch()),
  ('cv_available', 'false', unixepoch()),
  ('cv_en_available', 'false', unixepoch())
ON CONFLICT(key) DO NOTHING;
-- V6 -> V7: additive and safe to run more than once.
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX IF NOT EXISTS contact_messages_newest ON contact_messages(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS contact_messages_unread ON contact_messages(read_at);

CREATE TABLE IF NOT EXISTS content_overrides (
  language TEXT NOT NULL CHECK (language IN ('fr', 'en')),
  content_key TEXT NOT NULL,
  value TEXT NOT NULL CHECK (length(trim(value)) > 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (language, content_key)
);

CREATE TABLE IF NOT EXISTS contact_rate_limits (
  rate_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS contact_rate_limits_expiry ON contact_rate_limits(window_started);
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
