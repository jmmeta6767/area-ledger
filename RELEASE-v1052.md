# v1052 candidate — completed work and retention follow-up

Source of truth: GitHub `main` at `ba53a919be5efff12f061017e63b612c22524d1a` before this candidate.

## Changes

- Profile shows completed project work, company work statistics, and the owner's company-wide outstanding guarantee total, with links to the existing project and guarantee views. Customer-facing Portfolio data remains explicitly published and does not include accounting totals.
- The guarantee tracker offers closed/delivered projects that do not yet have a retention guarantee record. It suggests 5% of the approved contract value for review.
- When a completion date is unavailable, the suggestion uses the most recent actual work-income receipt date (including the latest dated partial receipt) as a clearly labeled estimate for the two-year follow-up. Unpaid receivables and guarantee refunds are excluded from this date lookup.
- Opening the suggestion creates an editable draft only. The user must check the amount and date, and save remains explicit; no accounting transaction is created by opening the draft or saving an unpaid guarantee record.
- The PWA source/cache identity advances to v1052. Accounting release 800 and storage keys `site-ledger-v1` and `site-ledger-db` remain unchanged. No migration or accounting formula changes.

## Validation

- `node tests/qa.cjs` — passed, 582 groups.
- `node tests/reliability-v1048.cjs` — passed, 12 groups.
- `node tests/public-profile.cjs`, `node tests/cloud-ledger-sync.cjs`, and `node tests/mobile-store-contract.cjs` — passed.
- Chromium browser simulation: 320×640, 375×812, 390×844, 430×932, and 844×390 CSS px; browser and safe-area simulation; dashboard/projects/BOQ/expense review; OCR batches 1/11/60; card and project create/edit keyboard tests; project budget and mobile reliability — passed. Selected before/after fixture captures and keyboard captures are in `layout-evidence/v1052/`. These are simulated browser results, not physical iPhone acceptance.
- Staging deployment and live acceptance — pending; production cutover remains closed.
- Physical iPhone Safari/PWA acceptance — pending owner device check.
