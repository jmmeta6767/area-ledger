# Google Sheets presentation

Base: main 92a940e640be263bc83e3e9897ee80203c1ce1a3. Branch: codex/google-sheet-presentation-v1086.

Scope: exporter presentation only, adding a ninth overview tab to financial exports. The original financial payload/version and accounting calculations remain unchanged. Old BOQ-only clients still update four tabs and leave finances intact. Existing spreadsheet/folder IDs and URLs are reused. New and existing workbook titles use AREA Ledger - project name.

Transaction presentation reorders the 15 existing fields without dropping any values. Existing columns are moved once before rewriting the snapshot so native references can follow the moved columns. ISO dates are exported as real sortable spreadsheet dates only after strict date validation. Formula-like source text and codes retain their string types. Tax/payment detail, notes and IDs form an expandable group. Existing group expansion state and user conditional rules are preserved; only owned status/negative-value rules are replaced. Legacy basic-filter column references are migrated once using sheet developer metadata. Extra custom tabs and columns are outside the managed writes/styles.

Verification commands:

- node tests/google-sheet-presentation.cjs
- node tests/google-project-finance.cjs
- node tests/google-oauth-recovery.cjs
- node tests/gateway-runtime.cjs
- node tests/qa.cjs
- Repository QA workflow regression scripts and browser tests.

Synthetic coverage includes all overview values, blank versus zero profit, Thai timezone rollover, field mapping, real dates versus invalid dates, literal formula-like strings, filter migration, idempotent tabs/banding/groups/rules/metadata, preservation of custom rules/tabs, empty tables and 10,000 transaction rows. Existing financial regressions cover VAT/withholding, partial payments, guarantee deduplication, sequential active-project sync, partial failures/retry, duplicate-click locking and failed-write sync metadata.

Evidence and limitations: local sample rendering uses synthetic snapshots and the same generated formatting requests. It is a preview, not a screenshot of a real Google workbook. No real account data or Google API writes are used in QA; native Google Sheets acceptance and physical iPhone viewing must be verified after deployment. Production deployment is now requested by the user, using the existing one-time release gate. Real project synchronization still requires the original browser data/connection or an explicitly identified existing Google workbook.

Chart coverage: three native charts reference managed snapshot cells. Category charts exclude booked totals and guarantee reference rows. Re-sync updates owned chart IDs, removes only stale owned category charts, preserves native positions and custom charts, and marks waiting-for-revenue profit without inventing a zero. Generated chart requests pass the official Sheets discovery schema.
