CREATE TABLE incidents (
  id TEXT PRIMARY KEY,                               -- uuid
  ref INTEGER NOT NULL,                              -- display number, INC-0012
  dataset TEXT NOT NULL DEFAULT 'live',              -- 'live' or 'test:<runId>'
  type TEXT NOT NULL,
  family TEXT NOT NULL CHECK (family IN ('property','violence','fire','accident','hazard')),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','escalated','monitoring','resolved')),
  area_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  summary TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 0,
  claim_counts TEXT NOT NULL DEFAULT '{}',          -- JSON { claimKey: count }
  languages TEXT NOT NULL DEFAULT '[]',             -- JSON array of languages seen
  first_seen INTEGER NOT NULL,                       -- epoch ms, earliest occurred_at
  last_seen INTEGER NOT NULL,                        -- epoch ms, latest occurred_at
  escalated_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (dataset, ref)
);
CREATE INDEX idx_incidents_match ON incidents (dataset, family, last_seen);
CREATE INDEX idx_incidents_list ON incidents (dataset, status, updated_at DESC);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,                               -- uuid
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  dataset TEXT NOT NULL,
  text TEXT NOT NULL,                                -- sanitized and redacted
  text_hidden INTEGER NOT NULL DEFAULT 0,            -- 1 when flagged identifying_details
  text_hash TEXT NOT NULL,                           -- sha-256 of the match copy, for duplicate suppression
  language TEXT NOT NULL CHECK (language IN ('English','Urdu','Roman Urdu','Mixed')),
  type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  severity_reason TEXT NOT NULL,
  area_id TEXT NOT NULL,
  location_text TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  occurred_at INTEGER NOT NULL,
  time_text TEXT,
  summary TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  claims TEXT NOT NULL DEFAULT '[]',
  confidence TEXT NOT NULL,                          -- JSON { type, location, time }
  flags TEXT NOT NULL DEFAULT '[]',
  engine TEXT NOT NULL CHECK (engine IN ('groq','gemini','rules')),
  model TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_reports_incident ON reports (incident_id, occurred_at);
CREATE INDEX idx_reports_dedupe ON reports (dataset, text_hash, created_at);
CREATE INDEX idx_reports_recent ON reports (dataset, created_at);

CREATE TABLE timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  at INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('opened','report_added','escalated','status_changed','reopened')),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3), -- incident severity after the event
  report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
  from_type TEXT, to_type TEXT,
  from_severity INTEGER, to_severity INTEGER,
  from_status TEXT, to_status TEXT
);
CREATE INDEX idx_timeline_incident ON timeline_events (incident_id, at, id);

CREATE TABLE geocode_cache (
  query TEXT PRIMARY KEY, lat REAL, lng REAL, label TEXT, created_at INTEGER NOT NULL  -- null lat = known miss
);

CREATE TABLE usage_counters (
  day TEXT NOT NULL,                                 -- 'YYYY-MM-DD' (UTC) or 'global'
  key TEXT NOT NULL,                                 -- 'llm:groq', 'llm:gemini', 'testrun:ai', 'nominatim:last'
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
);

CREATE TABLE test_runs (
  id TEXT PRIMARY KEY,
  engine TEXT NOT NULL CHECK (engine IN ('rules','ai')),
  base_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  results TEXT NOT NULL DEFAULT '{}'                 -- JSON { reportId: TestStepResult }
);
