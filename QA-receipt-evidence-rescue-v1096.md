# AREA Ledger v1096 — private lossless receipt evidence rescue (Issue #219)

## Scope

A **read-only backup packaging** utility: `scripts/receipt-evidence-archive.py`. It creates an independent ZIP containing the original `backupFormat: 2` JSON bytes (unaltered), separately extracted evidence images, and a manifest with per-image SHA-256, MIME, byte length and original `state` JSON path. It verifies the exact source SHA-256, Ledger FNV-1a internal checksum (UTF-16 JS code units), ZIP integrity, image signatures, manifest and byte-for-byte reversibility, deduplicating only byte-identical images.

## Run privately (never CI on real data)

```shell
python3 scripts/receipt-evidence-archive.py create /private/AREA-Ledger-backup.json /private/receipt-evidence.zip
python3 scripts/receipt-evidence-archive.py verify /private/receipt-evidence.zip
```

The script never updates the source JSON, browser localStorage/IndexedDB, Cloudflare D1/R2, Google Drive or ledger totals. Existing destination ZIPs are never overwritten. JSON must be checksum-valid format 2; malformed, overlarge, unverifiable or unsupported images fail closed, with an error rather than a partially trusted archive. ZIP contains real customer and receipt data: **keep private and never upload it to GitHub or GitHub Actions**.

CI uses only synthetic inputs: `python3 tests/receipt_evidence_archive_test.py` (10 unit cases). No new permissions, secrets, schema, production marker or app cache/source change is included.

## What this does NOT fix

The app continues storing existing embedded photos in `site-ledger-v1`; no migration, deletion, compression of source, automatic cloud sync or live quota change has occurred. The archive is a redundant recovery resource before future, explicitly gated IndexedDB/R2 receipt offload. Native iPhone Safari acceptance and safe export/import of references are still mandatory before offloading any live receipt.

## Private user-data acceptance (off-repo)

The user's previously authorized 2026-10-22 backup was passed only to the **local** tool. Original JSON SHA-256 and its internal Ledger checksum matched; all 12 embedded receipts extracted and round-tripped exactly. The private ZIP is stored in the user's private Drive backup folder, not this repository. The repository contains only the utility, synthetic tests and this non-sensitive operational guide.