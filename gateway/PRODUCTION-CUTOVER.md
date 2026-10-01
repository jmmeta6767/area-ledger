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
