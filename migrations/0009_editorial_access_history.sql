-- V8 -> V9. Additive and repeatable: no existing rows are removed.
CREATE TABLE IF NOT EXISTS skills_overrides (
  language TEXT NOT NULL CHECK(language IN ('fr','en')),
  skill_key TEXT NOT NULL,
  proofs_json TEXT NOT NULL,
  visible INTEGER NOT NULL CHECK(visible IN (0,1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(language,skill_key)
);
CREATE TABLE IF NOT EXISTS access_grants (
  token_hash TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  allow_fr INTEGER NOT NULL CHECK(allow_fr IN (0,1)),
  allow_en INTEGER NOT NULL CHECK(allow_en IN (0,1)),
  allow_cep INTEGER NOT NULL CHECK(allow_cep IN (0,1)),
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS access_grants_expiry ON access_grants(expires_at);
CREATE TABLE IF NOT EXISTS admin_audit (
  id TEXT PRIMARY KEY,
  at INTEGER NOT NULL,
  type TEXT NOT NULL,
  item_key TEXT NOT NULL,
  language TEXT,
  action TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT
);
CREATE INDEX IF NOT EXISTS admin_audit_recent ON admin_audit(at DESC,id DESC);
INSERT INTO settings(key,value,updated_at) VALUES ('site_last_updated',CAST(unixepoch() AS TEXT),unixepoch())
ON CONFLICT(key) DO NOTHING;
