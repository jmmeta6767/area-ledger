# Cloudflare staging runbook — AREA Ledger gateway

Status: Cloudflare is the sole active AREA Ledger runtime. This runbook covers the current Cloudflare staging hostname; Render is legacy recovery only and must not receive product development.

## Required staging configuration

1. Treat `gateway/public` as the only deployable AREA Ledger app runtime. Repository root `index.html` is Legacy Recovery only.
2. Authenticate Wrangler to the intended Cloudflare account.
3. Configure the staging Worker exact origin allowlist and OCR upstream URL as environment-specific non-secret configuration.
4. Configure `OCR_API_KEY` as a Cloudflare Worker secret. Never place its value in Git, Wrangler vars, screenshots, chat, or logs.
5. Keep the active app on its Cloudflare `workers.dev` hostname until a deliberate Cloudflare custom-domain cutover is approved.
6. Run the repository QA gate before upload. The gate must include `node tests/cloudflare-only.cjs`.

## Pre-deploy commands

From the repository root:

```sh
node --check gateway/public/sw.js
node --check sw.js
node tests/cloudflare-only.cjs
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


## Legacy Render recovery boundary

The former Render origin `https://area-ledger.onrender.com` is not an active AREA Ledger runtime. Its repository-root page exists only to read the browser-local legacy snapshots and export them as JSON for explicit restore into Cloudflare.

- Do not add accounting, BOQ, document, OCR or UI product features to repository-root `index.html`.
- Do not use Render as a release acceptance target.
- Do not enter new accounting data on the legacy Render origin.
- A legacy recovery export must be restored and validated on Cloudflare before work continues.


## D1 / R2 staging reconciliation

After real staging resources are created and bound:

```sh
cd gateway
npx wrangler d1 migrations apply area-ledger-staging --remote --env staging
npx wrangler deploy --env staging
```

Then verify `/health` and `/v1/platform/status`. Both must report D1 + R2 configured before production acceptance. With the Cloud recovery key, run `GET /v1/ledger/reconcile`; if it is unmatched, use the explicit POST repair once and read back again. Do not cut over production while reconciliation is unmatched.
