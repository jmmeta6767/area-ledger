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
