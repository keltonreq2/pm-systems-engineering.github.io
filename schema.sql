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
