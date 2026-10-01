PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ledger_meta (
  ledger_hash TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  checksum TEXT NOT NULL,
  semantic_checksum TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0,
  saved_at TEXT NOT NULL,
  state_meta_json TEXT NOT NULL DEFAULT '{}',
  entity_count INTEGER NOT NULL DEFAULT 0,
  schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ledger_entities (
  ledger_hash TEXT NOT NULL,
  kind TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  pid TEXT,
  data_json TEXT NOT NULL,
  ord INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ledger_hash, kind, entity_id),
  FOREIGN KEY (ledger_hash) REFERENCES ledger_meta(ledger_hash) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ledger_entities_kind
  ON ledger_entities (ledger_hash, kind, ord);

CREATE INDEX IF NOT EXISTS idx_ledger_entities_pid
  ON ledger_entities (ledger_hash, pid, kind);

CREATE INDEX IF NOT EXISTS idx_ledger_meta_saved
  ON ledger_meta (saved_at);
