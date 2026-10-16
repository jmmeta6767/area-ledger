# Google OAuth return recovery

A failed OAuth callback was intercepted by the PWA service worker and replaced with the cached Ledger shell. The user returned to the app without seeing the token/state/storage error and remained disconnected.

## Changes

- Bypass service-worker caching and offline fallback for /v1/, /health and /ready, preserving ordinary app-shell offline behavior.
- Return no-store OAuth responses with allowlisted token errors and safe stage-specific storage/network errors; never echo provider error descriptions, codes, state, credentials or tokens.
- Stop treating connection read failures as disconnected, and report HTTP 503 instead.
- Verify server connection status after OAuth return and reopen the selected project panel. A URL marker alone cannot trigger a success message; a missing browser ledger identity cannot silently create a replacement identity during resume.
- Include OAuth regression in PR, staging and production QA. Re-arm the existing production gate for this repair; remove the authorization marker after successful acceptance.

## Validation

- Reproduced the service-worker bug on main: synthetic callback navigation was intercepted and the assertion failed before the fix.
- New synthetic regression passes: API/auth bypass, ordinary offline fallback, failed database read, invalid callback no-store, invalid_client without secret leakage, encrypted successful persistence, status verification, and missing browser identity.
- 612 app QA groups and 8 OCR/voice groups pass.
- All non-browser Node suites listed in Release QA pass (34 suites including gateway, D1, R2, legacy proxy and release gates).
- GitHub iPhone browser QA, staging live acceptance and production live acceptance remain to be verified by the release pipeline.

## Limits

This fixes hidden failures and false UI status, not the unseen Google credential/storage error itself. A real account must authorize again after the new service worker activates; use the resulting safe error code for any remaining configuration repair. No accounting records, local storage identities, Google secrets or tokens were read or changed in this patch.
