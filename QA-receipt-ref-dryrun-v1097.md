# AREA Ledger v1097 — reversible receipt reference dry-run (no live migration)

## Purpose
The private 2026-10-22 export contains image Data URLs embedded in accounting transactions, which may inflate Safari localStorage usage. A separate encrypted/private offline archive already preserves all original bytes; this release **only** simulates replacing transaction `photo` content with references in memory, then reversing the transformation and checking that `JSON.stringify(state)` is byte-identical.

## Run locally (private file, no upload)
```bash
node scripts/backup-audit.cjs /private/AREA-Ledger-backup.json
node scripts/receipt-ref-dryrun.cjs /private/AREA-Ledger-backup.json
node tests/receipt-ref-dryrun.cjs
```
The script refuses a backup that fails the existing format-2 structural/checksum audit. Report includes counts, approximate UTF-16 string size and reversible saving estimate, **not** names, record values, images or account details. 4–5 MiB is not an authoritative browser quota. Re-run locally with the latest private backup before any future migration.

## Strict limits
- `simulation:sha256` references are **not valid R2/IndexedDB keys** and **must not be imported**. They exist only in memory for a reversible size estimate.
- Does not change `site-ledger-v1`, `site-ledger-db`, app JavaScript, storage schema, financial numbers, R2, Cloudflare, Google OAuth, or production.
- Existing `photoRef` entries are not overwritten. No customer files are uploaded or emitted to GitHub Actions; synthetic test data only.
- Actual quota remediation **requires** guarded IndexedDB write/read/hash, cloud consent, durable portable export, rollback and physical iPhone validation before removing original photo Data URLs.
- Cloudflare direct Git-triggered Worker Builds may fail independently of official GitHub Actions staging. Investigate externally rather than bypass release gating.

Acceptance: synthetic tests pass, Release QA + iPhone layout + exact-head PR staging; no production authorization. Issue #229 tracks full P1–P5 completion.
