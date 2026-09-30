# Cloudflare staging runbook — AREA Ledger gateway

Status: staging-ready source. This document does not authorize production DNS or a production cutover.

## Required staging configuration

1. Authenticate Wrangler to the intended Cloudflare account.
2. Configure the staging Worker exact origin allowlist and OCR upstream URL as environment-specific non-secret configuration.
3. Configure `OCR_API_KEY` as a Cloudflare Worker secret. Never place its value in Git, Wrangler vars, screenshots, chat, or logs.
4. Keep the Worker on its `workers.dev` staging hostname for the first verification cycle.
5. Run the repository QA gate before upload.

## Pre-deploy commands

From the repository root:

```sh
node --check sw.js
node tests/qa.cjs
node tests/gateway-contract.cjs
node tests/gateway-runtime.cjs
node tests/gateway-preflight.cjs
cd gateway
npx wrangler secret put OCR_API_KEY --env staging
npx wrangler deploy --env staging --dry-run
```

Do not deploy if any command above fails.

## Staging deploy

```sh
cd gateway
npx wrangler deploy --env staging
```

After deployment, call `/health` and confirm protocol `1`, providerConfigured=true and durableState=true. Then configure the AREA Ledger browser gateway endpoint to the staging Worker only, explicitly enable remote OCR consent, and test with a non-sensitive sample receipt before any real document.

## Smoke acceptance

- Unknown Origin -> 403.
- Missing/wrong protocol -> 426.
- Valid staging Origin + protocol -> OCR response with X-AREA-Request-ID.
- Repeating the same request ID does not repeat upstream work within the idempotency window.
- Rate limit returns 429 after the configured threshold.
- Browser falls back to local OCR when staging gateway is unavailable.
- Audit metadata, if later enabled, contains no image/text/amount/partner/accounting record.

## Rollback

If staging is unhealthy, set AREA Ledger AI mode back to local or clear remote OCR consent. This immediately removes the gateway from the browser OCR path; accounting/local storage remain unchanged. Do not point production DNS/custom domains at the Worker until a separate production review is approved.
