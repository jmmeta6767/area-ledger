CREATE TABLE IF NOT EXISTS ledger_files (
  object_key TEXT PRIMARY KEY,
  ledger_hash TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'attachment',
  entity_id TEXT,
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ledger_files_ledger
  ON ledger_files (ledger_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_ledger_files_entity
  ON ledger_files (ledger_hash, entity_type, entity_id);
