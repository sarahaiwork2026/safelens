CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  credential_version TEXT NOT NULL
);
CREATE INDEX idx_admin_session_expiry ON admin_sessions(expires_at);
CREATE TABLE official_sources (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL
);
CREATE INDEX idx_official_sources_incident ON official_sources(incident_id, published_at DESC);
