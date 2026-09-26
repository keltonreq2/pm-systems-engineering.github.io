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
