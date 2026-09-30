# AREA Ledger V1 — Master v237

Accounting Production Hardening, based on GitHub `main` v236
(`3050c49d9f773047835ce34e1ab3c8096995f662`).

Standalone/PWA accounting and construction project control. This repository remains
separate from AREA Maibab Public Website and AREA SEO AI.

## Data safety

- localStorage: `site-ledger-v1` (unchanged); recovery: `site-ledger-v1-recovery`.
- IndexedDB: `site-ledger-db`, version 1, object store `kv` (unchanged).
- localStorage is the synchronous commit point. A rejected write is never mirrored
  to IndexedDB; committed mirrors run in order. A mirror failure is reported.
- Migration works on a copy, retains duplicate IDs/orphan references for Data Health,
  and rejects malformed collections rather than replacing them with empty arrays.
- Startup waits for bounded IndexedDB reads. Unreadable data does not trigger a
  seed overwrite. Intentional empty states remain empty.
- Existing Tha Sala expense/BOQ data is never automatically overwritten or
  re-imported on startup. The historical baseline is tested in isolation.
- No destructive repair, storage-key changes, rebuild, or force push.

## v237 Accounting production hardening

- Added Accounting Excel export covering Trial Balance, General Ledger, management statements, project cost and Audit Trail.
- Expanded Data Health for required system accounts and duplicate accounting-period states.
- Period-close snapshots now include transaction and journal counts for later audit comparison.
- Added mobile accounting layout guards for small iPhone-width screens and scroll containment.
- Added end-to-end accounting, backup/migration, export, close-snapshot and navigation regression tests.
- Physical iPhone/Safari behavior is still a separate device gate and is not claimed by Node/CI tests.

## v236 Project cost / controls / reporting

- Added project cost accounting for contract, BOQ budget, actual cost, commitments, billing, receipts, AR/AP, linked/unlinked BOQ cost, forecast profit and a clearly-labeled management WIP proxy.
- Added Accounting Control Center 2.0 with Trial Balance, Bank, Billing/Receipt, tax/document, AP due-date, BOQ-link and exact-duplicate checks.
- Added 30-day AR/AP cash forecast and Executive Accounting Report across projects.
- Home dashboard now surfaces accounting exceptions rather than only totals.

## v235 Statements / tax / close hardening

- Added management Profit & Loss, Balance Sheet and cash-flow summary from the balanced journal engine.
- Added tax/document reconciliation across transaction VAT/WHT metadata, bills, receipts and real payment links.
- Added Audit Trail viewer.
- Hardened period close: Data Health, Trial Balance, document reconciliation and any recorded bank-reconciliation difference must pass before close.
- Period close stores a read-only accounting snapshot for later review.

## v234 Double-entry foundation

- Added a system Chart of Accounts without replacing legacy transaction categories.
- Derived balanced Debit/Credit journals from existing transactions, VAT and WHT metadata.
- Added manual adjusting journals with period lock and balance validation.
- Added General Ledger and Trial Balance views.
- Fixed Data Health so accounting-control records without project IDs are not falsely reported as orphans.

## v233 CI correction

- GitHub Actions reached the new accounting tests and exposed a Node VM cross-realm `deepStrictEqual` assertion on empty arrays. The migration output was structurally correct; the test now checks array type/length without realm identity assumptions.

## v232 Accounting Core

- Canonical derived accounting ledger for transaction base/VAT/WHT/net references.
- Bank book balance and persisted bank reconciliation records.
- AR aging from billing balances and AP aging from unpaid expenses.
- Tax ledger separates VAT input/output and WHT credit/payable from recorded transaction flags/rates.
- Audit trail for core transaction/document/payment/accounting-control mutations.
- Accounting periods with close/reopen workflow; closed periods block direct transaction/document/payment writes.
- Project accounting separates approved contract value, billed amount, cash received, actual cost, AP, forecast profit and cash margin.
- Accounting Control Center surfaces AR/AP/bank/data-health status.
- Data Health validates accounting period and bank reconciliation records.
- Regression suite expanded for the accounting core.

## v231 fixes

- Executive Project Control is now a deadline alert: projects appear only when the effective contract deadline is within 30 days or overdue.
- Added a 44px touch-friendly × button to dismiss an individual project alert.
- Dismissal is persisted non-destructively in `ui.executiveDismissed`; it does not change project, contract, EOT, BOQ, or accounting records.
- Added regression tests for the 30-day boundary and persisted dismissal.

## v230 fixes

- Distinguish explicit startup recovery from normal user writes: stale normal writes remain blocked, while a selected newer valid recovery snapshot may replace a corrupt/older primary.
- Existing boot recovery regression now exercises this conflict-safe recovery path in CI.

## v229 fixes

- Fix the QA service-worker version assertion so CI follows the current Master version.
- Keep automated QA as a required development gate for future pushes.

## v228 fixes

- Treat cross-tab deletion/clearing of the primary key as a conflict; a stale tab cannot silently recreate old state.
- Reset conflict state explicitly in regression fixtures and add deletion-conflict coverage.

## v227 fixes

- Reject stale writes when another tab has committed a different `site-ledger-v1` snapshot.
- Listen for cross-tab storage changes and put the stale tab into conflict-safe mode without mutating records.
- Preserve the newer localStorage snapshot; the stale tab must reload before it can save again.
- Add regression coverage for stale-write rejection and storage-event conflict detection.
- Add GitHub Actions QA so the repository can execute `node tests/qa.cjs` on every main push/PR.

## v226 fixes

- Fix `go` variable shadowing that broke click-handler navigation after saves.
- Preserve transaction metadata, document links and WHT rate during transaction edits.
- Prevent failed writes from reappearing through IndexedDB recovery; restore prior
  state and retain forms on failure. UI mutations check persistence before success.
- Detect duplicate/orphan IDs across modules, cross-project BOQ/document links,
  billing/receipt mismatches, guarantee accounting mismatches and inconsistent
  Timeline/Variation/EOT states without modifying records.
- Exclude cross-project and ambiguous BOQ links from actual-cost totals.
- Use approved signed Variation amounts in project/report/BOQ profit forecasts;
  pending reductions remain in the action queue even when their net value is zero.
- Suppress contract deadline/missing-date warnings for delivered/closed projects.
  Outstanding correspondence and accounting work can still be displayed.
- Validate Timeline status, letter number, send/reply chronology and reply content.
- Validate EOT as positive whole days; approval requires an order/reference.
  EOT remains a request register: saving a request, including approved status, does
  not silently rewrite the stored contractual end date. Approved days are shown
  separately; the contract date is maintained explicitly in project details.
- Protect projects with contract/procurement references from deletion.
- Require explicit selection of batch OCR suggestions; invalid selected rows block
  the whole batch. Reject nonfinite amounts, orphan projects and invalid dates.
- Bound photo OCR results to the original unchanged draft; unreadable images release
  the scan lock. OCR never automatically persists an expense.
- Fix touch scrolling on sheets; use visual viewport height for keyboard/rotation,
  16px sheet inputs and non-sticky actions on short landscape screens.
- Scope SW cleanup to Ledger caches; offline reads use only the current cache;
  cache-write failure does not discard a successful network response.

## Financial conventions retained

Contract value is not cash revenue. Actual cost includes accrued expenses. Net
profit is actual revenue minus cost. Approved Variation changes forecast revenue;
pending/rejected amounts do not. No unapproved EOT changes the contract date.

## QA

Run `node tests/qa.cjs` and `node --check sw.js`. The suite executes the actual app
functions and action handlers in a Node VM with controlled storage/DOM/OCR doubles.
See `QA-v226.md` for coverage and device testing still required.

Service-worker cache: `site-ledger-v226-integrity-recovery-hardening`.
Registration: `sw.js?v=226`, `updateViaCache: 'none'`.

The tracked legacy `area-ledger-package.zip` is not the current deployment source;
use the current `main` tree. It was not used or rebuilt for this release.
