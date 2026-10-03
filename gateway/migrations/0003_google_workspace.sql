CREATE TABLE IF NOT EXISTS google_connections (
  ledger_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  refresh_token_enc TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '',
  root_drive_folder_id TEXT,
  connected_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS google_oauth_states (
  state_hash TEXT PRIMARY KEY,
  ledger_hash TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  return_url TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_google_oauth_expiry
  ON google_oauth_states (expires_at);

CREATE TABLE IF NOT EXISTS google_project_links (
  ledger_hash TEXT NOT NULL,
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL DEFAULT '',
  drive_folder_id TEXT,
  spreadsheet_id TEXT,
  drive_url TEXT,
  sheet_url TEXT,
  last_sync_hash TEXT,
  last_sync_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (ledger_hash, project_id)
);

CREATE INDEX IF NOT EXISTS idx_google_project_links_ledger
  ON google_project_links (ledger_hash, updated_at);
