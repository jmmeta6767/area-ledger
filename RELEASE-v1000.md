# AREA Ledger — v1000 Business Stable Candidate

Date: 2026-10-03

This candidate implements the v910–v1000 hardening plan while preserving the proven runtime/storage baseline.

## v910 — Physical iPhone Field Acceptance
- Field Acceptance remains manual.
- A PASS may only be stamped from actual iPhone Safari over a secure origin.
- CI, desktop browsers, simulators and source inspection cannot create v910 physical-device evidence.
- The legacy v800 evidence format remains readable, while v1000 uses the stricter v910 device-stamped evidence.

## v920 — BOQ Acceptance Pack
- BOQ preview exposes row count, material/labor split, OCR review count and invalid-row count.
- Upright-only OCR and monotonic 1–100% progress remain unchanged.
- Scanned/image BOQ is always considered manual-review-required.
- Synthetic regression fixtures supplement, but do not replace, checks against real project documents.

## v930 — Receipt OCR Accuracy / Human Review
- OCR confidence remains fail-closed below the existing acceptance threshold.
- Review diagnostics identify uncertain amount, partner, detail, date and category fields.
- OCR never saves an expense automatically.
- Real small-shop receipts still require visual comparison before save.

## v940 — Accounting Freeze / Month-End
- Period close now consumes the full Month-End Checklist.
- Data Health, Trial Balance, Statements, Bank Reconciliation, Tax/Document, AR, AP and a current backup must be acceptable before close.
- Closed-period protections and audit history remain unchanged.

## v950 — Project Profit Control
- Project view surfaces forecast profit, cash margin, EAC, profit at completion and AR/AP together.
- Contract value remains distinct from cash received.
- Forecast profit remains contract value minus actual cost; cash margin remains actual receipts minus paid cost.

## v960 — Contract / EOT Workflow
- Submitted EOT requests and draft EOT requests now enter the Contract Action Queue.
- Variation, correspondence, timeline, EOT and deadline alerts remain project-scoped.
- EOT requests do not silently rewrite the contractual end date.

## v970 — Large Data
- Target acceptance envelope: 25,000 transactions and 5,000 BOQ rows.
- UI rendering remains bounded to 120 transaction rows and 200 BOQ rows per render batch with explicit load-more controls.
- A dataset above the target is warned rather than silently assumed safe.

## v980 — Backup / Disaster Recovery
- Static DR evidence now checks checksum/tamper rejection, frozen storage keys, stale-write conflict protection, previous-snapshot recovery guard and PWA reload guard.
- Existing Cloud/D1/R2 live recovery evidence remains separate from static source checks.

## v990 — Security / Production Hardening
- Gate checks secure origin, frozen storage contract, no-referrer/no-store credential-omitting OCR transport, gateway environment consistency, closed-period protections, audit trail and stale-write conflict guard.
- Browser source remains secret-free; remote OCR still requires explicit consent.

## v1000 — Stable Candidate Gate
- v1000 readiness combines Production Stable automation, Business Stable automation, Security Hardening, strict physical iPhone evidence, Accounting Freeze and Production runtime.
- v1000 remains fail-closed until both human gates are genuinely satisfied.
- CI must never auto-stamp iPhone Field Acceptance or Accounting Freeze.

## Compatibility freeze
This candidate does not migrate runtime storage and does not rename accounting/storage contracts:

- APP_RELEASE = 800
- APP_CHANNEL = stable
- localStorage = site-ledger-v1
- recovery key = site-ledger-v1-recovery
- IndexedDB = site-ledger-db
- Service worker registration = sw.js?v=800
- Accounting policy = 1.0

The label v1000 is a business-stability milestone/candidate label. It does not change the proven runtime data contract until the physical field gate and Accounting Freeze are completed.

## Production acceptance
The exact source SHA promoted to production must pass:
1. Release QA, including v900 and v1000 source contracts.
2. Staging deploy.
3. D1 migrations and staging redeploy.
4. Live staging acceptance.
5. One-time production authorization.
6. Production preflight and full QA.
7. Production deploy, migration/redeploy and live acceptance.
8. Removal of the one-time production marker after success.
