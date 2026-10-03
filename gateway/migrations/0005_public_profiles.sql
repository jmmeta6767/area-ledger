PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS public_profiles (
  public_id TEXT PRIMARY KEY,
  ledger_hash TEXT NOT NULL UNIQUE,
  snapshot_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_profiles_ledger
  ON public_profiles (ledger_hash);

CREATE INDEX IF NOT EXISTS idx_public_profiles_active
  ON public_profiles (active, updated_at);
