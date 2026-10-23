# v1095 — Read-only storage headroom triage (P0, issue #219)

## Why

AREA Ledger's iPhone Safari reported `local-storage quota recovery exhausted` during multi-row receipt review. A source backup can contain embedded Base64 receipt image data, which can inflate the serialized state. This is a **diagnostic** step, not a user-data migration or a fix that claims to remove quota limits.

## Command (local/private, never in GitHub CI on customer bytes)

```sh
node scripts/storage-headroom-audit.cjs /private/path/AREA-Ledger-backup.json
```

The command loads one `backupFormat: 2` file read-only. It reports **only** aggregate state string sizes (UTF-8 bytes, a UTF-16 byte estimate), Base64 media counts/size estimates per fixed collection and advisory flags. It prints no project names, people, transaction descriptions, images, opaque IDs, local paths or raw Base64. Exit 0 means the file is parseable, **not** that the backup checksum or ledger restore has passed. Run `scripts/backup-audit.cjs` from v1094 separately for checksum/record-integrity preflight.

The **4 MiB reference** is only an early-warning baseline. The browser's actual `localStorage` quota, string storage model, Safari space constraints and total origin usage vary. The output is **not** a precise free-space reading and must never be treated as permission to delete data.

## User-device acceptance and recovery safety

1. Protect original 2026-10-22 private Google Drive backup and current iPhone local-state snapshot. Confirm restore-preview checksum, original six-project totals and any later transactions before any merge/restoration.
2. Retain original OCR receipt photos and the reviewed-but-unsaved draft until individually backed up. Never clear Safari website data, caches, service workers, localStorage/IndexedDB or photos to make space without a verified independent recovery path.
3. Inspect actual device build, quota failure path, IndexedDB availability, receipt size and PWA mode on the physical device. Do not assume a synthetic browser test proves native iPhone correctness.
4. Future remediation candidate: write-through attachment blobs to IndexedDB (offline) with optional R2 sync only after consent; commit references only after both storage layers and full recovery checks pass. Keep original data URL until explicit, separately gated migration verifies attachment identity, export/import portability and rollback, otherwise fail closed. This is **not implemented** in this diagnostic PR.
5. Never alter `site-ledger-v1` or `site-ledger-db` keys or live Google/Cloudflare records from this tool; no Production authorization.

## Synthetic CI

`node tests/storage-headroom-audit.cjs` covers eight cases: empty backup, media decoding, redacted collection labels, large image early warning, Thai Unicode, bad JSON/format, bounded input, no mutation. Run full Release QA, PR exact-head staging and iPhone layout before merge; do not claim production rollout or device acceptance.
