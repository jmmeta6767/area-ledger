# AREA Ledger: operations and release closeout

This is an integrated successor to draft PR #271 (`f25e029319026d7f2d57c95a4ff4e61877c8a69b`), whose exact source tree already passed Release QA, PR Staging Acceptance, profit, backup and primary-store gates. Protected main was rechecked at `d07df1c146db7e477dc4f2ce4d5a0f39b131a52e`. Do not merge the overlapping predecessor drafts independently.

## Six-step execution

| Step | Reviewable result | Remaining acceptance |
| --- | --- | --- |
| 1. Real-data questions | Read-only integrity counts, retention-versus-5% advisory and potential duplicate review. Actions open original records; no financial adjustment or deduplication. Owner backup was privately audited outside this repository. | Compare questioned figures against original signed contract and bank records. A generated historical app is not contract evidence. |
| 2. iPhone | Synthetic browser coverage at 320, 375, 390, 430, 844 landscape and 1280; WCAG checks on home/project/review/receipt/readiness screens; existing native IndexedDB durability test retained. Fix urgent text contrast and installment-history target size found by this fixture. | Native iPhone Safari/PWA first open, offline save/reopen, OCR/file/print and payroll acceptance. Chromium viewport tests do not satisfy native acceptance. |
| 3. Receipt storage | Replace blanket UI migration with explicitly consented batches of at most three eligible images (each at most 2 MB). Require a current-revision backup within 24 hours, stable ledger identity, committed source, local original and byte-verified R2 readback before reference change. Stop on error/change/cancel; retain local originals and portable backups. | No owner receipt was uploaded or removed. Owner must verify the actual source origin/private destination and originals before an explicit batch. Local original copies continue to consume storage; no promise of immediate physical space reclaimed. |
| 4. Google | Readiness panel opens existing app Google status and existing native acceptance checklist. Cached status is explicitly stale evidence until checked again. Existing OAuth recovery and Sheets safety tests remain required. | Actual owner app OAuth and synthetic write/readback in Drive/Sheets, then owner-approved destination for real records. A separate connector session does not prove app OAuth. |
| 5. Release | Successor draft includes regression and browser checks in both Release QA and Staging workflows. Existing fail-closed Production Gate remains in force. | Exact-head CI/Staging, independent review, current backup, native and live Google acceptance, approved release/rollback plan. No Production marker is added. |
| 6. Daily queue | Read-only owner dashboard and project queue: receivables/payables, partial contractor installments, inspections/rework, guarantees, missing/problematic ETC, and review advisories. Filters and expansion retain source-record actions. | Operational owner review; no automatic payments, bank reconciliation, or accounting corrections. |

## Verification

- `tests/operations-workspace.cjs`: read-only state equality, original-record navigation, role guard, guarantee deduplication, contractor remaining balance, bounded consent, stale-source rejection, identity change during thumbnail await, verified readback, corrupt bytes, failed persistence, concurrent run, cancellation and lossless portable backup.
- `tests/operations-workspace-browser.cjs`: isolated synthetic fixtures, six viewports, all new screens plus project/home WCAG 2 A/AA and 2.1/2.2 AA checks, no horizontal overflow, no ledger mutation, owner-only UI.
- Existing `tests/r2-receipt-readback.cjs`: all integrity cases retained. The core now rechecks identity and source after the asynchronous thumbnail step and before upload.
- Regression and browser commands are defined in `.github/workflows/qa.yml`; the same new tests are required by `.github/workflows/pr-staging-acceptance.yml`.

Only synthetic records and generic implementation details belong in this repository. Private backup contents, customer/project names, monetary balances, photos and credentials are excluded.
