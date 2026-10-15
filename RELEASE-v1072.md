# v1072 — expense batch storage failure recovery

The multi-receipt save handler overwrote every persistence failure with a generic toast. It also required receipt image payloads to fit in localStorage before they could reach R2, so a full Safari quota could prevent a reviewed batch from being saved.

- Retain the actual quota, cross-tab conflict, read-block or write failure in the review and keep the draft available.
- When an actual QuotaExceededError occurs and Cloud Sync is enabled, upload the selected evidence images to the same ledger's R2 vault, then retry the complete batch with verified image references instead of embedded image bytes.
- Revalidate all amounts, projects, dates, categories, payment state, closed periods, duplicates and storage baseline before committing; unchanged storage keys and accounting logic.
- Block duplicate taps during upload; never auto-commit if the review or cloud ledger changes. Failed uploads preserve all rows/photos and reuse already uploaded evidence on retry.
- No automatic quota fallback for stale tabs, blocked reads or other write failures. Existing primary/recovery data and unrelated media are never deleted to make room.

Validation: 612 core QA groups plus six storage regressions covering the 3-row / 6430 total, local quota, stale-tab preservation, failed upload/retry, double tap, changed draft, and a competing write during upload. Existing release QA and mobile layout gates apply. Real device storage state cannot be inferred from a screenshot; the revised UI reports the actual cause.
