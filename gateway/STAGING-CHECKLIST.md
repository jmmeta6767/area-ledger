# Cloudflare-only staging readiness gate

- [ ] GitHub `main` QA passes.
- [ ] `gateway/public/index.html` is the active AREA Ledger runtime.
- [ ] Repository-root `index.html` is Legacy Recovery only, not an accounting app.
- [ ] `node tests/cloudflare-only.cjs` passes.
- [ ] Wrangler authenticated to correct Cloudflare account.
- [ ] Cloudflare staging Worker only; no Render release acceptance.
- [ ] Exact staging AREA Ledger Origin configured; no wildcard CORS.
- [ ] OCR upstream configuration is outside Git.
- [ ] OCR_API_KEY stored as Worker secret.
- [ ] Durable Object GatewayState is SQLite-backed.
- [ ] /health: protocol=1, providerConfigured=true and durableState=true.
- [ ] Smoke test uses non-sensitive sample first.
- [ ] Local OCR fallback verified.
- [ ] No OCR image/text/amount/partner data in audit.
- [ ] Fresh Cloudflare origin does not synthesize partial accounting data.
- [ ] Legacy recovery export, when needed, is explicitly restored and validated on Cloudflare.
- [ ] Rollback stays within Cloudflare/runtime settings; do not resume Render as an active app.

- [ ] /v1/platform/status: productionReady=true before production cutover.
- [ ] D1 staging binding exists and all migrations are applied.
- [ ] /v1/ledger/reconcile returns matched=true after explicit migration.
- [ ] Private R2 staging binding exists; upload/read/delete smoke test passes.
- [ ] /v1/files/list returns only this ledger capability's indexed files.
- [ ] Staging and production D1/R2 resources are separate.
