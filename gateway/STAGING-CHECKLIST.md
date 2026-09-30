# Cloudflare staging readiness gate

- [ ] GitHub main QA passes.
- [ ] Wrangler authenticated to correct Cloudflare account.
- [ ] Staging Worker only; no production route/custom domain.
- [ ] Exact staging AREA Ledger Origin configured; no wildcard CORS.
- [ ] OCR upstream URL configured outside Git.
- [ ] OCR_API_KEY stored as Worker secret.
- [ ] Durable Object GatewayState is SQLite-backed.
- [ ] /health: protocol=1, providerConfigured=true, durableState=true.
- [ ] Smoke test uses non-sensitive sample first.
- [ ] Local OCR fallback verified.
- [ ] No OCR image/text/amount/partner data in audit.
- [ ] Rollback to local mode tested.
