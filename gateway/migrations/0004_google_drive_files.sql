CREATE TABLE IF NOT EXISTS google_drive_files (
  ledger_hash TEXT NOT NULL,
  project_id TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  web_view_link TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  PRIMARY KEY (ledger_hash, project_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS idx_google_drive_files_project
  ON google_drive_files (ledger_hash, project_id, created_at);
