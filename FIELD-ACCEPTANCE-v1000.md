# AREA Ledger — v910 / v1000 Physical Field Acceptance

Run these checks on the production URL from an actual iPhone using Safari. Do not mark a check PASS from desktop, CI, simulator, screenshots or source inspection.

## Required six device checks
1. Refresh stays coherent on the current workflow.
2. Offline → Online transition does not corrupt or duplicate data.
3. Receipt photo persists through the configured attachment/storage path.
4. Receipt OCR is compared against the actual image before save.
5. Create → edit → close → reopen preserves the final value exactly once.
6. Switch Wi‑Fi ↔ cellular while the app is open and verify a single save creates a single transaction.

AREA Ledger v1000 accepts Field Acceptance evidence only when these items are stamped from iPhone Safari on a secure origin.

## BOQ real-device checks
- Import one real Excel BOQ.
- Import one text PDF BOQ.
- Import one upright image/scanned BOQ.
- Confirm image OCR does not rotate/sweep orientations.
- Confirm progress never moves backward and reaches 100%.
- Confirm Preview appears before import.
- Compare quantities, units, material/labor classification, unit prices and totals to the source.
- Investigate every row marked “ต้องตรวจภาพ”.

## Accounting / Month-End checks
- Use a safe test bill and partial receipt.
- Confirm AR balance and receipt lineage.
- Run Data Health and Integrity Gate.
- Run Month-End Checklist.
- Create a current backup before attempting close.
- Do not confirm Accounting Freeze until the actual accounting baseline is intentionally accepted.

## Recovery check
- Create a fresh backup.
- Verify the backup corresponds to the current revision.
- Perform restore only in a controlled test/recovery scenario.
- Compare Project, Transaction, BOQ, Document, Guarantee and Accounting counts/digest.

## Final v1000 rule
Automated Production/Cloud/D1/R2/Recovery checks may be green while v1000 remains MANUAL/CHECK. That is expected until both:
- strict iPhone Field Acceptance is present; and
- Accounting Freeze evidence is present and current.
