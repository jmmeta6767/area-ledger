# AREA Ledger — Cloudflare Production Cutover

This repository is Cloudflare-only. Render remains Legacy Recovery and must not be reactivated.

## Runtime architecture

- Worker + Static Assets: active AREA Ledger PWA and API
- Durable Object (SQLite-backed): authoritative conflict-safe Cloud Ledger + one-step rollback
- D1: normalized ledger mirror and integrity/readback path
- R2: private attachment vault; never public
- AI Gateway / Gemini endpoint: OCR suggestion path only; user review remains required
- localStorage / IndexedDB: offline cache and device recovery, not a cross-device source of truth once Cloud Sync is enabled

## Production gate

Production is accepted only when all of these are true on the target Worker:

1. `GET /health` returns `productionReady: true`.
2. `GET /v1/platform/status` with protocol v1 returns `productionReady: true`.
3. Durable Cloud Ledger push/pull/history/restore tests pass.
4. D1 migration is applied and `GET /v1/ledger/reconcile` returns `matched: true`.
5. R2 file status is configured and a private upload/read/delete smoke test passes.
6. Unknown origins are rejected and no wildcard CORS is present.
7. OCR secret is stored only as a Worker secret.
8. GitHub QA is green for the exact commit being deployed.
9. iPhone/Safari smoke test covers reload, offline open, BOQ, add expense, cloud sync, attachment and recovery.
10. A portable JSON backup is captured before cutover.

## Resource activation

Create real Cloudflare resources first. Then add their real IDs/names to the staging environment according to `D1-SETUP.md` and `R2-SETUP.md`. Never invent IDs in Git.

After staging reconciliation is green, repeat with separate production resources. Do not share staging D1/R2 with production.

## Cutover rule

Do not switch a production custom domain or declare the cloud database primary while `productionReady` is false or D1 reconciliation is not matched. Rollback stays inside Cloudflare using Worker version rollback plus Cloud Ledger previous-revision recovery.

## v600 final 1–8 acceptance

The source candidate is complete only when GitHub QA is green. Live Stable 1.0 requires all eight checks below on real Cloudflare resources and the user's real accounting dataset:

1. Staging `/health` and `/v1/platform/status` report `productionReady=true`.
2. A real ledger backup is captured, Cloud Sync is explicitly enabled, and no partial fallback dataset is promoted automatically.
3. `GET /v1/ledger/reconcile` returns `matched=true` for the real Durable Cloud Ledger and D1 mirror.
4. iPhone/Safari refresh returns to the same primary page and offline cache opens without data loss.
5. Gemini OCR is secret-backed and a non-sensitive sample follows confidence/fallback rules.
6. Cloud history and previous-revision recovery are verified without losing the displaced device recovery snapshot.
7. Private R2 probe passes write/read/delete and unknown origins remain denied.
8. Production uses separate D1/R2 resources, the exact deployed commit has green QA, and the in-app `ตรวจ Cloudflare เต็มระบบ` action returns PASS.

Do not mark a live migration complete from source-code evidence alone.

## v700 Business Stable acceptance

After v600 source acceptance, v700 is the final business-stable gate. Run it on the real target runtime with the real ledger recovery key.

- Run the in-app `Business Stable v700` control center.
- Cloudflare Full Acceptance must be fresh, same-origin and created by release 700.
- Accounting Baseline must have no blocking Accounting Production Gate, bank, document-flow, schema or exact-duplicate issue.
- Disaster Recovery evidence must be fresh within 24 hours.
- PWA/Secure runtime must pass and Cloud Sync must have no unresolved conflict.
- Cross-origin restored data requires a valid Migration Acceptance Certificate.
- Operational alerts remain business work items; the automation queue never silently mutates accounting data.

Only after the live v700 gate returns PASS should the deployment be described as Business Stable.

## v800 Business Stable 1.0 acceptance

v800 separates automated staging evidence from the user's real production evidence.

1. A staging deploy must finish with `tests/live-cloudflare-acceptance.mjs` PASS: platform ready, Durable CAS, D1 reconcile, R2 write/list/read/delete/index, history and restore.
2. Real ledger migration must be initiated from the user's current device after a fresh portable backup; synthetic live-acceptance data is never substituted for user data.
3. Reconcile diagnostics must show `mismatchCount=0` for the real capability before production cutover.
4. The six iPhone field checks must be manually confirmed after testing on the current release and expire after seven days/release change.
5. Accounting Freeze policy 1.0 may be stamped only when Accounting Baseline has no blockers.
6. Disaster Recovery evidence must be fresh and Cloud Sync conflict-free.
7. Production resources and GitHub Environment remain separate from staging.
8. Production deploy must pass its own platform checks before real data is considered cut over.
9. Operational alerts remain non-mutating and are not a substitute for month-end/accounting review.
10. `stable1Readiness()` must return PASS on production. It is intentionally impossible for staging to claim Stable 1.0.


## v806 credential-gate pause / safe resume

The first v805 production cutover attempt reached the production Environment but stopped before deployment because all three production Environment secrets were absent. No production Worker mutation, D1/R2 provisioning, migration, or live acceptance occurred.

The repository is intentionally returned to a dormant production state:

1. Keep `.github/production-cutover-v805` absent while production credentials are incomplete.
2. Configure the GitHub Environment named `production` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `OCR_API_KEY`.
3. Re-arm production only with a fresh one-time marker commit after the production Environment is ready.
4. Let staging auto-deploy and live acceptance pass for that exact re-armed SHA.
5. The cutover workflow then enters production, writes `production-preflight.json` with present/missing booleans only, runs full QA, deploys, captures isolated production D1/R2 bindings, applies migrations, redeploys, and runs live acceptance.
6. Remove the authorization marker again immediately after successful cutover, then pin the captured production resource identifiers in source.
7. Real ledger migration remains a separate device-side action after a fresh portable backup.

Never copy staging D1/R2 bindings into production, and never weaken the production Environment gate to work around missing secrets.

## v805 automated first production cutover

The first production deployment is authorized by the one-time file `.github/production-cutover-v805` containing exactly `DEPLOY_PRODUCTION`.

- The dedicated workflow waits for **AREA Ledger Staging Auto Deploy** to finish successfully on `main`.
- It checks out the exact staging-tested SHA; a newer untested `main` commit is never substituted.
- A lightweight authorization job runs without the production Environment. Only an authorized SHA may enter the `production` Environment and access production deployment secrets.
- The first Wrangler deploy may auto-provision isolated production D1/R2 resources. The workflow captures the real production database name/UUID and R2 bucket name from Wrangler's updated runner config and fails closed if either is absent or points at staging.
- After binding capture, the workflow installs the production OCR secret, applies D1 migrations, redeploys, runs synthetic live acceptance, and uploads privacy-safe evidence.
- Remove the authorization marker immediately after a successful cutover. The workflow may remain as a dormant audit-safe guard; without the marker it skips production.
- Pin the captured real production D1/R2 resource identifiers in `gateway/wrangler.toml` in the next source hardening commit.
- Real accounting data migration remains a separate explicit device-side step after a fresh portable backup.
