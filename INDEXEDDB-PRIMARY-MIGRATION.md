# Primary storage migration status

Candidate PR: https://github.com/jmmeta6767/area-ledger/pull/258

The candidate is not loaded by index.html. Existing production storage and user data are unchanged.

## Implemented and verified

- Isolated IndexedDB primary database; legacy localStorage and legacy IndexedDB are not removed or modified.
- Staged snapshots with separate image records addressed by SHA-256, readback verification and fully hydrated export.
- Atomic active-snapshot pointer replacement with previous snapshot retained and expected-head concurrency check.
- Busy/cancel/source-change guards and transaction-abort handling.
- 11 synthetic scenarios, including an approximately 8MB fixture containing 6 projects, 112 transactions and 32 BOQ rows.
- Native Chromium IndexedDB tests passed in Actions run 41190946634: interrupted staging, restore/reload/export equality, cross-tab CAS, aborted activation.

## Required before activation

1. Convert the 87 persist calls identified by `node tests/storage-callsite-audit.cjs` across the local HTML and business-register module to await durable completion. Re-run the inventory on the exact remote base before integration. Never treat a Promise as a successful boolean save. Audit all success messages, reset/close actions, failure rollbacks, timers and event handlers.
2. Boot must read the primary manifest before any legacy data. A corrupt/unreadable primary must block writes rather than silently open an older legacy ledger. Initial migration must be explicit and preserve the original data.
3. Restore must use existing backup envelope/checksum/business-digest checks, stage the complete payload, compare the source revision after awaits and commit once. Keep selected backup text/file until commit succeeds.
4. Cloud cache, exports, storage baseline comparisons, cross-tab notifications and profile/receipt consumers must use the same backend. Portable exports must include all original images.
5. Add progress, cancellation and actionable error UI; retain drafts on failure. Avoid deleting unreferenced staged media until a separate concurrent-safe retention design is tested.
6. Test actual backup and physical iPhone Safari before enabling production. Native Chromium tests are not physical Safari acceptance.

Do not merge or release this candidate as the completed fix for the user's Safari restore failure. The existing restore path still uses localStorage until integration above is complete.

