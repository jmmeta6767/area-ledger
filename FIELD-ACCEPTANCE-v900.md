# AREA Ledger — v900 Field Acceptance Checklist

Use this checklist on the production URL with an actual iPhone/Safari session and non-sensitive test data before marking Field Acceptance complete.

## 1. Refresh continuity
- Open a project and a nested screen.
- Refresh Safari.
- Confirm the app returns without corrupting or duplicating data.
- Confirm the current project/context remains understandable.

## 2. Offline → Online
- Open AREA Ledger while online.
- Disable network temporarily.
- Re-open a previously cached screen and confirm the PWA shell remains usable.
- Re-enable network.
- Confirm the app resumes without duplicate writes or stale overwrite.

## 3. Receipt photo → storage
- Create a test expense and attach a non-sensitive receipt photo.
- Save, close, reopen.
- Confirm the photo is still available through the configured storage path.
- Delete only the test record after verification.

## 4. Receipt OCR review
- Scan at least one ordinary Thai cash receipt from a small shop.
- Confirm AI/OCR may populate suggested amount/shop/category/date.
- Confirm the system does not save the expense automatically.
- Compare every populated field against the image before saving.

## 5. Edit round-trip
- Create a test transaction.
- Edit amount/note/date.
- Close and reopen the app.
- Confirm the latest value is retained exactly once and older values do not reappear.

## 6. Wi‑Fi / cellular switch
- With the app open, switch between Wi‑Fi and cellular data.
- Confirm navigation remains usable.
- Confirm no duplicate transaction is created from a single save.

## 7. BOQ real device test
- Import one Excel BOQ, one text PDF BOQ and one upright BOQ image.
- Confirm image OCR is upright-only.
- Confirm progress moves from 1–100% without going backward.
- Confirm Preview is shown before import.
- Check a sample of quantities, units, material/labor classification and totals against the source.

## 8. Accounting / document flow
- Use a test bill with a partial receipt.
- Confirm remaining AR matches the bill balance.
- Confirm Receipt → Payment → Bill lineage is intact.
- Run Integrity Gate and Data Health.

## 9. Backup / recovery drill
- Create a fresh backup.
- Verify backup freshness.
- Restore only in a safe test/recovery scenario.
- Confirm Projects, Transactions, BOQ, Documents, Guarantees and Accounting counts/digest are consistent.

## 10. Final Stable gate
- Run Final Check in Business Stable Control.
- Confirm automated Cloud/D1/R2/Recovery gates pass.
- Manually mark the six iPhone Field Acceptance items only after they were physically tested.
- Confirm Accounting Freeze only after the current accounting baseline is intentionally accepted.

## Important
Do not mark a physical-device item PASS based only on CI, source inspection, screenshots, or simulator output. The final Stable gate is intentionally fail-closed until manual evidence is present.
