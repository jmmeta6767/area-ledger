# v1091 supplied menu artwork

Base: main 22742c16d501c08809fe2c16b00158b6e7adb6c1 (v1090 accounting safety). The focused presentation changes from PR 190 are integrated onto this base; its old app/service-worker source and deployment workflow edits are not copied.

Uses the existing 240x144 WebP 5x3 sprite (7,674 bytes), with 48px source cells rendered at 29–38px. All 15 assets map to labelled navigation/optional shortcuts; shortcuts route to existing projects, BOQ and expense filters. The current foreman menu filtering and accessible dialog semantics are retained. Master logo files are untouched.

Icons are decorative/aria-hidden; labels remain accessible names. Original SVG remains underneath the bitmap if CSS or the image fails. CSS is referenced without a query string so the precached key matches the first offline navigation; CSS and WebP are included in the existing service worker CORE. App/cache version advances to 1091, preserving payroll precache and ledger storage keys.

Tests include real CSS/WebP at 320, 375, 390, 430 and 768px, drawer bounds, every asset mapping, expense routing, a deliberately failed bitmap request with working SVG navigation, and the full existing all-view/iPhone/accounting suites. Browser screenshots are published in the standard layout-evidence artifact. Physical iPhone and human visual acceptance remain pending.

The six optional shortcuts are collapsed by default. They do not add inventory or scheduling modules. Accounting data/schema, OCR extraction, Google and production authorization are unchanged. No real customer writes occur in tests. Merge requires exact SHA QA/iPhone/staging success.
