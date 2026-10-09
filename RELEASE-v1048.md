# v1048 — OCR payment review and pilot reliability

## User-facing changes (priorities 1–7)

1. OCR rows preserve explicit paid/unpaid evidence. Unknown status, missing date,
   or a paid row without a user-selected payment channel blocks the entire batch.
   Unpaid rows use the existing accounting representation (`paid: false`, empty
   payment channel and due date); no formula or migration changes. Single-image
   OCR also requires status/channel confirmation and never invents a date.
2. Settings shows the running identity and offers a no-store version check and
   guarded reload. Reload waits while edits, OCR, saves, photo uploads or sync are
   active. Wrangler rejects unstamped source, preventing direct Workers Git builds
   from replacing the GitHub pipeline's stamped staging artifact. External build
   integration may report failure until it is disabled by the account owner.
3. OCR review uses the shared visual-viewport focus/scroll controller. Tests cover
   browser and standalone simulation, all target widths and landscape, including
   the last editable row. Physical iPhone/Safari/VoiceOver acceptance is pending.
4. Owners can inspect an OCR review queue without mutating saved records, back up,
   open evidence and use the existing explicit editor/audit trail. Shared-image
   rows link to the record holding their source photo. Legacy payment review stays
   flagged until a status is explicitly selected; no automatic data repair.
5. Project cards explain cost / BOQ budget, including outstanding expenses, and
   distinguish absent BOQ. Existing uncapped utilization arithmetic is retained.
6. Settings provides a short first-use/pilot guide, backup and existing feedback
   entry. Feedback stays user-shared and includes existing build/device context;
   no automatic telemetry or financial payload sharing is added.
7. Pure expense review helpers have one maintained module, embedded into the
   standalone HTML with a synchronization check. This is the first bounded
   extraction, not a claim that the whole monolith has been modularized.

## Validation

- Existing 570 QA groups and 11 new runtime reliability groups.
- Actual batch handler: 6,000 paid + 17,000 and 54,600 unpaid = 77,600 total,
  6,000 paid and 71,600 outstanding; blank dates/status/channel fail closed.
- Existing gateway, D1/R2, sync, backup, closed period, rollback, BOQ provenance,
  native boundary and production gate contracts.
- Chromium responsive browser/safe-area checks: 320, 375, 390, 430 and 844×390;
  1/11/60 OCR rows, selection/edit retention, scroll restoration and keyboard
  simulation. New tests also bound the sheet rectangle to the visible viewport.
- Screenshots uploaded by release QA in `layout-evidence` artifacts.
- No physical iPhone, native keyboard, VoiceOver or live OCR-provider accuracy
  certification. The fixture verifies normalization and saving, not vision quality.

## Deployment and data invariants

`site-ledger-v1`, `site-ledger-db`, explicit review/save, existing formulae and
production marker gate stay in place. No new migration and no old ledger rewrite.
The production gate remains closed until staging and release checks pass.

Maintain helpers: `node tests/sync-client-modules.cjs --write` after editing
`gateway/client/expense-review.js`; QA checks embedded equality.
