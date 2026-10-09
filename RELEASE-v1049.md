# v1049 candidate — OCR evidence review and field readiness

Base: GitHub `main` at `c74de3937bc5c43390d2e69d2a135dee48e1855b` (v1048).

## Changes

- Each OCR review row can expand the original image inline, including shared-image table rows. The confidence value is labeled as an AI estimate and the review prompt reminds users to compare against the source. Explicit review and save remain required.
- The displayed app build and service-worker cache identity advance to v1049 so installed PWA clients can discover and fetch this candidate through the existing guarded update flow.
- Added an anonymized OCR acceptance baseline for the three screenshot rows: 6,000 paid, 17,000 unpaid, 54,600 unpaid; total 77,600. The two blank dates remain unresolved. Screenshot images and project/payee details are not stored in the repository.
- Added a physical-device and small-pilot protocol, a release operations runbook, and corrected the store-readiness source SHA and current deployment facts.

## Preserved behavior

`site-ledger-v1`, `site-ledger-db`, data schema, BOQ/accounting formulas, selected-row calculations, explicit review-before-save, and no-auto-save behavior remain unchanged. No migration or ledger rewrite is added.

## Acceptance boundary

- Automated OCR review/save regressions use synthetic, text-only evidence and do not certify live Vision accuracy.
- Chromium mobile viewport tests simulate browser/standalone layouts. No physical iPhone, iOS keyboard, VoiceOver, Android device, or participant pilot has been run in this environment.
- The duplicate Cloudflare Git build integration is account-level configuration; the staging identity guard continues to reject unstamped builds until an account administrator disables that integration.
- Native Capacitor projects have not been generated or signed. Apple Developer and Google Play Console accounts are still required before store distribution.

## Deployment

Candidate only. Staging and production SHAs are pending CI. The production cutover marker remains absent and production deployment stays closed until release acceptance.
