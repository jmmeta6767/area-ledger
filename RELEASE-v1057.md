# AREA Ledger v1057 — voice entry, OCR review, and mobile reliability

This release strengthens construction-expense photo entry before any production rollout.

- Table OCR may return a document grand total when the image clearly labels one. The app compares it with the sum of the extracted rows and blocks batch saving when they differ until the user confirms they checked the original image. The OCR prompt excludes category subtotals and unclear totals.
- A multi-photo scan or a multi-row table review is stored as a recoverable local IndexedDB draft, including row edits and evidence images. The draft uses a separate key and does not alter or migrate the accounting record, account, BOQ, or backup keys. It is offered for explicit recovery; saving a batch clears that draft.
- Duplicate-image checks and atomic save rollback remain in place. A failed account write keeps the review batch available.
- The OCR review sheet now has a direct feedback entry with a prefilled report outline. Feedback sharing includes only what the user types, app build, device type, and screen; it does not attach ledger amounts, BOQ, or receipt images.
- Expense entry now offers Thai voice dictation for amount, merchant, item, category, and relative date. Recognized values are placed in the editable form as a draft; the app never saves a transaction automatically. Browsers without Speech Recognition keep the standard form available, and microphone errors give a retry or permission hint.
- The PWA source cache identity is refreshed to 1057 so installed browsers can fetch the updated source without changing the stable business release 800 or account data keys.

Validation: QA includes Thai-numeral parsing, explicit-field draft fill, no-auto-save, and unsupported-browser behavior. The v1056 OCR, reliability v1049, UI v1034, Cloudflare-only and deploy-contract checks remain required. Chromium mobile layout at 320, 375, 390, 430, and 844 px widths and real installed-device microphone behavior still need verification. No production deployment, App Store, or Google Play action is part of this release.
