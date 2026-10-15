# v1073 — Recover expense drafts and reclaim local quota safely

The add page can retain a three-row OCR draft after a failed save. This release addresses two reproducible storage defects; the screenshot alone does not identify the actual failure on the user device.

- Serialize draft writes and deletion, invalidate pending callbacks and cancel the autosave timer after successful commit. An in-flight draft write cannot recreate a saved batch.
- On batch quota failure, first archive the redundant localStorage recovery copy to IndexedDB and verify exact readback before releasing it. Keep the primary ledger and all receipt images intact. Retry only while the reviewed draft is unchanged. Retain cross-tab write protection.
- If local space remains insufficient, retain the draft and use the existing R2 fallback only when Cloud Sync is already enabled. Never enable Cloud Sync implicitly.
- Build and service worker v1073; storage keys unchanged.

Validation: 612 QA groups, 12 expense storage regressions, 12 reliability groups. Regression flow reloads a three-row draft, restores it, saves exactly 6430 and removes the draft. Includes delayed draft writes, archive failure, concurrent ledger writes, R2 failure/retry and ledger isolation.
