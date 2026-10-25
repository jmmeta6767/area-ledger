# v1098 — fail-closed R2 receipt offload safety

## Behavior
The existing opt-in (two-tap) **Cloudflare R2 receipt migration** no longer deletes embedded receipt images from the ledger on a successful upload response alone.

The production app now requires:
1. Existing Cloud Sync enabled and R2 configured.
2. Write **original data URL** to IndexedDB `site-ledger-db/kv` under `receipt-original-v1:<tx-id>` and verify exact readback.
3. Upload using the existing R2 endpoint, retrieve the resulting object with the same ledger identity and compare **all decoded image bytes** to the original (JPEG/PNG/WebP; capped at 16 MiB).
4. Recheck Cloud ledger identity, `S` state snapshot and localStorage committed state before switching the receipt to `photoRef`.
5. When the R2 object is unreachable, opening an offloaded receipt first tries the local IndexedDB original and rejects missing/modified evidence via the recorded fingerprint. This is an offline read fallback, not a replacement for portable export.\n6. If any check fails, **keep original embedded receipt** and keep the IDB copy. Existing optimistic localStorage `persist()` rollback applies when commit fails. Concurrent attempts to migrate all receipts are blocked.

## Validation
- `node tests/r2-receipt-readback.cjs` exercises actual app function in isolated Node VM with 15 synthetic acceptance cases and failures: IDB write/read, R2 upload/object mismatch/404, cloud-identity change, another-tab update, same-tab edits, storage quota, concurrent invocation, successful readback.
- All other Release QA + simulated iPhone layout + exact-head PR Staging acceptance required.
- **No real customer records/images used in CI.**

## Scope and remaining risks
This is an **extra guard on existing opt-in R2 offload**, not automatic migration, an OAuth connection, or a guarantee that full Safari storage is freed. Safari may not have IDB capacity, in which case offload fails without deleting images. **Portable JSON backup and clipboard copy now re-embed IDB originals** for every R2-referenced transaction, verify recorded image fingerprints, and recompute the format-2 state checksum; when even one original is missing or altered, the export fails closed without marking it as a completed backup. This allows normal format-2 restore with embedded receipt images. Earlier reference-only backups are **not retroactively repaired**. Remote-only images without a verified IDB original require separate recovery; physical iPhone behavior has not been tested. For that reason the user's 2026-10-22 offline backup and all current drafts still need independent verification. Do not clear website storage or automatically offload photos. No D1/R2 schema changes, Google account writes, production secrets or release authorization.

## Portable backup regression
- `node tests/portable-receipt-backup.cjs` exercises the actual backup action and serializer in 12 synthetic scenarios: format-2 checksum/restore, complete original re-embedding, multi-receipt completeness, missing or tampered evidence, concurrent tab/current edit, failure without a backup-success flag, successful file and clipboard path, and duplicate-action guard.
- Existing `backupJson()` remains unchanged for disaster-recovery diagnostics; the **user-facing** backup download and copy controls use the new verified asynchronous serializer. When R2 references exist, the static preview explicitly warns the user to generate a full copy via the controls.
- The real customer device must still be tested, and its fresh portable JSON saved and restored on an isolated device before any bulk receipt offload or Production release. Never replace a newer current-device ledger with the Oct 22 copy.
