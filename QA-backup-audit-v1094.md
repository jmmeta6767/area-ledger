# AREA Ledger v1094 — read-only backup integrity preflight

## Scope and rationale

Adds a local-only, optional backup preflight for export `backupFormat: 2`. Before attempting an import, an operator can run:

```bash
node scripts/backup-audit.cjs /private/location/AREA-Ledger-backup.json
```

The script **reads** the backup and prints a privacy-minimized JSON report. It does not write to `site-ledger-v1`, `site-ledger-db`, any Cloudflare D1/R2 resource, Google Drive, or GitHub. It does not emit client/project names, OCR contents or embedded receipt images. No actual customer backup is committed or passed to CI.

Checks:
- Exact Ledger v2 internal FNV-1a state checksum, recomputed over `JSON.stringify(state)`
- SHA-256 of original file bytes for tamper-evident offline storage
- Envelope format/export metadata/revision consistency
- Required collections, record ID uniqueness, transaction amount validity, and nonempty project links
- Optional **review-only** 5% retention deviation (may be contractually valid; never auto-correct)
- Informational warning if no income transactions are recorded (not proof of missing income)

Exit code 0 indicates no structural/checksum errors, **not** proof that all accounting source documents are complete or a restoration will succeed. A mismatch is exit code 1; malformed/oversized or filesystem errors exit 1 or 2. Always use the existing built-in restore preview/confirmation for any import, and test restoration on isolated staging data first.

## Evidence

`node tests/backup-audit.cjs` exercises seven independent synthetic cases: valid six-project export, checksum tamper, duplicated project IDs, orphaned transactions, invalid amounts/revisions/JSON, retention advisory, and missing/oversized content. All tests execute without reading customer data. The dedicated `.github/workflows/backup-audit.yml` is read-only and requires no secrets; it does not authorize Production or run migrations.

The validation logic was additionally exercised against the **private** 2026-10-22 user backup in an isolated local environment, and verified that the envelope checksum matched. The private input and financial details **are not** included in this repository. Source-independent SHA-256 is intended to allow private offline re-verification.

## Release safety

No changes to app HTML/PWA, financial formulas, workers, secrets, OAuth, `wrangler.toml`, database schemas or production authorization. Run normal Release QA + iPhone layout + exact-head PR staging before merge; a green synthetic audit does not replace live acceptance or physical iPhone/Google account verification. No Production deployment is included.
