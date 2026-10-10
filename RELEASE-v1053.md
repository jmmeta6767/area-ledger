# v1053 candidate — retention register follow-up and export

## Changes

- The existing guarantee register keeps its project-scoped ledger records and now keeps search and CSV export visible beside the register. Export follows the active project, status, and text filters and guards text cells against spreadsheet formula execution.
- The mobile row shows the guarantee deposit date, the selected two-year follow-up basis date, the amount, and the refund due date/status.
- Retention drafts can use work-income receipt, handover, or guarantee deposit as the two-year date basis. The suggested due date remains editable and updates from the selected basis while it still matches the previous suggestion. Saving remains explicit.
- The five provided historical retention rows can be reviewed, matched to existing projects, corrected, and imported together into the existing register. Dates are stored as Gregorian ISO dates while the UI formats them for Thai users. A duplicate match blocks the whole import. Imported records are marked tracking-only, so saving them does not recreate historical ledger expenses or change BOQ/project cost totals; refund receipt can still be recorded when it actually arrives.
- The one-time import action now shows only the number of remaining source rows and disappears after all five have been imported. Each imported row keeps its source ID, preventing the same historical row from being offered again; the add action remains compact beside it on small screens.
- The supplied first row said 180,000 baht although the source table shows 5% of 360,000 baht, or 18,000 baht. The review starts at 18,000 and displays the source discrepancy for confirmation.
- Cleanup removes an unused older guarantee-search stylesheet and a shadowed duplicate BOQ OCR scoring function; the active scorer's result is covered by regression.
- Existing payment, refund, BOQ, and project accounting behavior is unchanged. The existing storage keys remain site-ledger-v1 and site-ledger-db; this adds optional follow-up/tracking metadata only and does not require a migration or a new storage key.
- PWA source/cache identity advances to v1053; accounting release remains 800.

## Validation

- `node tests/qa.cjs`: 589 QA groups passed.
- `node tests/reliability-v1048.cjs`: 12 reliability groups passed.
- `node tests/guarantee-mobile.cjs`: passed at 320, 375, 390, 430 CSS px and 844×390 landscape; focused-field/keyboard layout, touch targets, amount wrapping, import review/edit preservation, and no-write-before-confirmation checks passed.
- `node tests/project-mobile-budget.cjs`, `node tests/mobile-store-contract.cjs`, and `node tests/reliability-mobile.cjs`: passed.
- Visual evidence from the Chromium simulation is saved locally in `layout-evidence/cleanup-2026-10-10/retention-register-after-390x844.png` and `layout-evidence/cleanup-2026-10-10/retention-edit-keyboard-simulated-390x844.png`, alongside the earlier import review and last-field keyboard captures in `layout-evidence/v1053-run/` (390×844 CSS px; simulated keyboard uses a 360 px visual viewport).
- These are desktop Chromium viewport and safe-area/keyboard simulations, not physical iPhone Safari or installed-PWA tests. Staging and production acceptance are still pending; production cutover gate remains closed.
