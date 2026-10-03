Warning: truncated output (original token count: 33931)
Total output lines: 1504

# AREA Ledger V2 — Master v800

Business Stable 1.0 Source Candidate / live-staging acceptance layered over v701, based on GitHub `main` v701
(`270f7de5b61dcd2a72a1f263a646158c884157ee`).

Standalone/PWA accounting and construction project control.

## v1040 iPhone Business Document Actions

- Moves Quote, Billing Note and Receipt actions outside the A4 document surface so they remain reachable on narrow iPhone screens.
- Reflows document detail rows into labeled, readable cards on iPhone while retaining the A4 layout for print and PDF export.
- Pins a two-column action bar above the Safari browser controls, with safe-area spacing and touch-sized buttons; the bar is excluded from print/PDF output.
- Presentation and navigation markup only: accounting amounts, VAT/WHT calculations, document lineage, storage keys, D1/R2 and Cloud Sync contracts are unchanged.
- Physical iPhone/Safari acceptance remains a device check; automated CSS/source regression does not claim device-level verification.


## v1039 Local OCR Page Provenance

- Local OCR now preserves `sourcePage`, `sourceFile`, and `sourceKind` for every BOQ row from multi-image and scanned-PDF imports.
- Identical-value rows on different source pages are no longer collapsed as parser duplicates; same-page duplicate evidence is still deduplicated.
- Multi-image and scanned-PDF Local OCR assemble rows per source page before merging, so page geometry and subtotal checks are retained through fallback.
- Local page totals use conservative scope detection: explicit page totals reconcile per page; explicit document totals reconcile globally; ambiguous totals are only treated as page totals when they already reconcile locally.
- Preview shows source page/file provenance, and final BOQ save persists that provenance for later audit and troubleshooting.
- Existing AI row arithmetic checks, page/document total reconciliation, memory cleanup and human Preview/final confirmation remain unchanged.


## v1039 full-app UX/UI audit

- Adds explicit `data-view`, `data-sheet-kind` and `sheet-open` runtime scopes so every primary screen and every bottom sheet can receive deterministic responsive styling without leaking rules into unrelated views.
- Audits all primary views: Dashboard, Transactions, Add Transaction, Projects, Project Detail, BOQ, AR/AP, Guarantees, Reports, Print, Business Documents, Procurement, Document Register, Business Document output and Company Profile.
- Normalizes mobile grids, long-number wrapping, card minimum widths, filter/tab horizontal scrolling, touch targets, safe-area padding and document/report overflow behavior across 600 / 430 / 380 px breakpoints.
- Normalizes all bottom sheets and editors, including Accounting, Project, Profile, OCR/BOQ preview, business documents, bill payment, Settings and manual journal controls.
- Keeps document/print fidelity by using explicit horizontal scroll containers instead of squeezing A4/report layouts into unreadable columns.
- Adds a full-app static regression that verifies every renderable view has UX scope, every major page family has responsive coverage and storage/BOQ arithmetic contracts remain unchanged.
- Presentation only: no accounting formulas, BOQ/OCR extraction or page-total reconciliation, document values, tax, storage, D1/R2, Cloud Sync or profile publishing logic changes.


## v1038 BOQ Per-Page Total Reconciliation

- AI Vision distinguishes a page subtotal from the final document total using `declaredTotalScope` (`page` / `document`) instead of treating the largest visible total as the whole-BOQ total.
- Page-scoped totals reconcile only against rows extracted from that page; a wrong page subtotal forces Local OCR / human cross-check.
- Document-scoped totals reconcile against the complete multi-page BOQ; conflicting document totals reported on different pages fail closed.
- Unknown totals are treated conservatively: on a multi-page BOQ they are inferred as page totals only when they already reconcile to that page, while a one-page BOQ may treat an unknown visible total as document scope.
- The four real Tha Sala page totals (48,884.85 / 79,147.88 / 274,129.38 / 10,650.72) are now regression-tested separately from the 412,812.83 grand total.
- Existing row-level quantity × unit-price verification, human Preview, memory cleanup and Safari long-session guards remain unchanged.


## v1037 Safari long-session hardening

- Adds ephemeral runtime diagnostics for session age, render count/duration, action count, duplicate-action blocks and Safari BFCache restores; diagnostics are visible under Advanced / System Diagnostics and are never persisted to accounting or Cloud storage.
- Adds a 750 ms duplicate-action shield only for write-heavy actions such as transaction/document/payment/journal/bank-reconciliation/period-close saves, reducing accidental double taps on iPhone without affecting normal navigation, filters or explicit confirmation flows.
- Coalesces expense OCR progress-only full renders to at most one render per animation frame while keeping state transitions and completed review renders intact.
- Tracks foreground/background lifecycle through `visibilitychange`, `pageshow` and `pagehide`; navigation state is saved on background/unload and transient OCR/PDF/R2 resources are released only on non-BFCache page exit.
- Instruments `render()` timing without changing its output, navigation contract or data calculations.
- Runtime stability only: no accounting formulas, BOQ/OCR extraction or arithmetic-verification rules, storage keys, Cloud Sync/D1/R2 contracts, tax, document values or profile data contracts change.


## v1036 BOQ Image Arithmetic Verification

- AI Vision BOQ rows now return the visible per-category row amount in addition to quantity and unit price; the browser recomputes quantity × unit price against that visible amount instead of trusting provider-side verification.
- A row-level equation mismatch forces Local OCR / human cross-check even when page coverage and the document grand total otherwise look acceptable.
- Image Preview carries the visible source amount and shows whether the row equation passed or failed before save.
- Construction-unit canonicalization now normalizes OCR spacing variants such as `ตร . ม .`, `ลบ . ม .`, `ลบ . ฟ .` and `กก` before parser merging/review.
- The independent 32-row Tha Sala PR4 fixture is used as an end-to-end arithmetic acceptance set: all 32 visible row amounts must pass, while a deliberately corrupted row must trigger fallback.
- No auto-save behavior changes: scanned/AI BOQ still requires human Preview and final confirmation.


## v1036 runtime memory stability

- Adds explicit canvas, Image, object-URL and PDF.js release helpers for long-running iPhone/Safari sessions instead of relying only on garbage collection.
- BOQ AI/local image OCR now revokes object URLs, shrinks canvases and clears Image handlers/src on every success, timeout, failure and cancellation path.
- Scanned-PDF OCR tracks the active PDF.js document and destroys it on completion or cancel; text-layer PDF import also destroys its PDF.js document in a `finally` path before preview/fallback continues.
- Expense single-image and multi-image OCR release decode Images and OCR canvases immediately after recognition while retaining the compressed receipt photo string used by the review flow.
- Profile avatar/cover/post image resize and R2 receipt-thumbnail generation release temporary canvases and decode Images immediately after encoding.
- Cloud R2 photo preview now centralizes object-URL revocation both before replacement and when the sheet closes.
- Runtime stability only: no OCR extraction rules, accounting formulas, BOQ values, storage keys, Cloud Sync/D1/R2 contracts, tax or document behavior changes.


## v1035 runtime performance polish

- Dashboard transaction aggregation now computes paid income, paid expenses, outstanding AR/AP and transaction type counts in a single pass instead of repeatedly filtering and reducing the same transaction array.
- Transaction List tokenizes the active search query once per render and caches each transaction's searchable text for reuse across audit filtering, visible filtering and row markup.
- BOQ summary totals, material/labor totals, section totals and row indexes are built in one pass; row numbering now uses a `Map` lookup instead of repeated `rows.indexOf(x)` calls while rendering.
- Adds progressive off-screen paint containment with `content-visibility:auto` for long list/BOQ rows and major card groups; unsupported browsers ignore it safely.
- Existing incremental render ceilings remain unchanged (120 transaction rows / 200 BOQ rows per batch), preserving the current mobile interaction and load-more behavior.
- Runtime/performance only: no accounting formulas, BOQ values, OCR acceptance/accuracy, storage, Cloud Sync, D1/R2, tax, document or profile data contracts change.


## v1033 BOQ Real Accuracy

- Adds an independent 32-row real PR4 fixture from the Tha Sala M.7 multipurpose-building BOQ, including four page totals and the reconciled 412,812.83 grand total.
- Expands local Thai PR4 unit recognition for real construction units including cubic foot (ลบ.ฟ.), box, block, sack, roll, can, tank, door/panel, piece, pair, litre and related site units.
- Local OCR regression now covers labor-only rows, material+labor pairs, cubic-foot formwork, roofing screws sold by box, and circled handwritten price-reference numbers.
- OCR-result merging no longer collapses rows merely because description/category/quantity/unit match; materially different unit prices or different source sections remain separate, while near-identical duplicate parser evidence is still deduplicated.
- The seeded Tha Sala 32-row BOQ is cross-checked against the independent fixture so quantities, units, prices and source sections cannot silently drift.


## v1034 CSS QA polish

- Repairs a real CSS syntax defect in the manual-journal/accounting block where the `.manual-journal-lines` margin declaration ran into the `.mj-line` selector, which caused that rule group to parse incorrectly.
- Consolidates the adjacent v1030–v1034 UX override layers into one style block without changing their cascade order, reducing style-fragment overhead while preserving the existing UI behavior.
- Adds shared finishing tokens for control radius, section spacing, stronger high-contrast borders and muted text.
- Normalizes selected-state weight, disabled-control behavior, summary text selection, scroll margins and desktop hover feedback across project, documents, AR/AP, profile and settings surfaces.
- Adds `prefers-contrast: more` support and retains the existing forced-colors/focus-visible accessibility behavior.
- Adds a static CSS audit that checks style-tag balance, brace balance, known property/selector collision patterns and verifies the consolidated UX layer remains in one style block.
- Presentation/QA only: no accounting, BOQ/OCR, storage, Cloud Sync, D1/R2, document lifecycle, tax or profile data contract changes.


## v1033 documents, due control, settings and accessibility

- Adds view-scoped document and AR/AP presentation classes without changing document, payment or accounting data contracts.
- Reflows Business Documents summary cards on narrow iPhones so the primary outstanding amount gets full width and monetary values no longer ellipsize.
- Keeps recent-document customer/project text readable and moves amount/status into a dedicated second row on mobile.
- Reflows AR/AP summary from three cramped columns into a 2+1 hierarchy, with single-column fallback on extra-narrow devices and clearer urgent-item amounts.
- Normalizes Settings touch targets, section summaries, text fields and system-action grids; extra-narrow screens switch system actions to one column.
- Adds keyboard/focus-visible treatment to document, due and settings controls plus forced-colors support.
- Toast status messages now expose `role=status`, `aria-live=polite` and `aria-atomic=true` for VoiceOver/screen-reader feedback.
- Presentation/accessibility only: no accounting calculations, BOQ/OCR, storage, D1/R2, Cloud Sync, tax, document lifecycle or profile-publishing contract changes.


## v1031 BOQ Field Acceptance Hardening

- AI-only BOQ extraction must pass a page-coverage gate before Preview: no missing page, enough verified rows for the number of pages, at least 65% quality-row retention, and declared-total reconciliation when a document total is available.
- One-page AI with only one extracted row is accepted only when that row reconciles to a visible declared total; otherwise local OCR is used as a completeness cross-check.
- Multi-image and scanned-PDF paths record per-page AI row counts so a blank/failed page cannot be hidden by successful rows from other pages.
- PDFs with a text layer that does not yield a sufficiently complete BOQ table automatically fall back to full-page OCR instead of stopping with a manual Excel workaround.
- Existing human Preview, paged review, section provenance, duplicate guards, and cancel/timeout protections remain unchanged.


## v1032 mobile command hierarchy

- Adds view-scoped presentation classes for Add and Project pages so mobile UX overrides do not leak across modules.
- Promotes “Open BOQ” as the primary Project Detail command while keeping daily project actions in a consistent two-column touch grid.
- Improves Project Detail workflow headings, contract KPI wrapping and fold touch targets on narrow iPhones.
- Reworks Add/Edit transaction visual hierarchy: amount entry is visually dominant, quick chips remain horizontally reachable instead of being clipped, and photo-expense upload becomes a full-width mobile action.
- Moves the transaction Save bar above the fixed Bottom Navigation on portrait iPhone, while falling back to normal document flow in short landscape viewports.
- Adds sheet scroll padding/focus feedback so focused fields and action buttons remain usable around the iOS keyboard.
- Normalizes four dashboard finance KPIs to a readable 2×2 mobile grid, collapsing to one-row-per-KPI on extra-narrow screens.
- Presentation-only: no accounting, BOQ/OCR, storage, Cloud Sync, D1/R2, document or profile-publishing contract changes.


## v1031 iPhone task-flow refinements

- Reflows transaction-list summary cards on narrow iPhones so item count gets a full row while received/paid totals retain readable digits.
- Transaction rows move amount/status to a second line on small screens instead of compressing description, project and audit chips.
- Project directory status filters become a 2×2 touch grid; each project card gives budget its own row with received/paid values below, removing ellipsis from financial totals.
- BOQ rows keep long item descriptions readable by moving the row amount onto a dedicated second line under the description on narrow screens.
- Company Profile places Share/Edit in a full-width action row, keeps all pinned work reachable with a swipe carousel, and changes four post actions into a 2×2 mobile grid.
- Adds narrow-landscape nav compaction, horizontal scroll snapping for dashboard/profile filters, and manual dark-theme parity for the new task-flow surfaces.
- No accounting, storage, OCR, BOQ calculation, Cloud Sync, D1/R2 or profile-publishing data contract changes.


## v1030 BOQ Hardening

- Preserves BOQ work-section metadata through final import and records section provenance.
- Reconciles OCR totals after reviewer edits are synced and binds final confirmation to the full import fingerprint.
- Reviews large BOQs in 60-row pages and requires every page to be checked before save.
- Adds bounded scanned-PDF open/page/render/local-OCR timeouts with shared cancel controls.
- Distinguishes duplicate rows by work section and material/labor category.



## v1030 UX/UI normalization

- Adds a presentation-only UX normalization layer over the current production-candidate UI without changing accounting, BOQ, OCR, storage, Cloud Sync or profile data contracts.
- Bottom navigation keeps the five primary destinations in the current order (Overview, BOQ, Add, Projects, Profile) with clearer active state, safe-area spacing and larger thumb targets.
- iPhone form controls use 48px-class touch targets and 16px mobile input text to avoid Safari focus zoom; bottom sheets use dynamic viewport limits and contained scrolling.
- Dashboard/list numeric values are no longer visually ellipsized by the normalization layer, while rows and primary actions get consistent tap feedback and spacing.
- Company Profile and worksite feed gain mobile layout cleanup plus manual/system dark-mode parity.
- Adds static UX regression coverage to Release QA. Physical iPhone/Safari remains the final device-level visual gate.


## v1024 Company Profile + Worksite Feed

- Adds a first-class Company Profile view for business identity, contact details, service bio, LINE, website, Facebook, Instagram and TikTok references.
- Adds a mobile-first worksite feed inspired by portfolio/social apps: worksite updates, portfolio posts, delivery/handover posts and announcements.
- Posts can link to a project, carry a Buddhist-date display, include up to four photos, and support edit/delete/share-copy actions.
- Images are resized on-device for iPhone stability. When Cloud Sync/R2 is available, post images are offloaded to R2 while compact thumbnails remain in the ledger; if R2 is unavailable, the compressed image stays with the post so data is not lost.
- External social networks are not auto-posted or granted account access. Share uses the device Share sheet/copy workflow so the owner stays in control of publication.
- Existing accounting, BOQ, guarantee, transaction and storage keys are unchanged.
- Release-pipeline cleanup removes the stale empty one-time production authorization marker before staging validation.

## v1023 Complete Expense Amounts on iPhone

- Mobile expense status cards use one full-width row per status, so paid and outstanding amounts retain all digits and two decimal places.
- Long totals can wrap without ellipsis; the status header total moves to a new line when needed.
- Desktop retains two columns. Keyboard focus and dark-mode amount contrast are improved.
- Presentation-only change; existing amount calculations, click filters and stored accounting data are unchanged.

## v1022 All-Project Guarantee Receivable

- หน้า `รวมทุกโครงการ` แสดงการ์ด `เงินประกันค้างรับ` แยกจากต้นทุนอย่างชัดเจน โดยรวมยอดจากทุกโครงการที่เลือกอยู่ใน Dashboard.
- การ์ดแสดงยอดรวม จำนวนรายการ จำนวนโครงการ และสถานะครบกำหนด/ใกล้ครบกำหนด พร้อมกดเข้า Guarantee Control ได้ทันที.
- ตารางและสรุปกำไรรายโครงการเพิ่ม `เงินประกันค้างรับ` เพื่อให้ตรวจยอดเทียบแต่ละโครงการได้ง่าย.
- ต้นทุนยังรวมเงินประกันรอคืนตามกฎ v1021 และป้องกันการนับซ้ำกับรายจ่ายที่บันทึกแล้ว.
- วันที่รับคืนสำหรับรายการที่ไม่มีวันกำหนดเองใช้อ้างอิง วันส่งมอบ + 2 ปี ใน Guarantee Control และ cash forecast.

## v1021 Guarantee-Inclusive Project Cost

- ต้นทุนเพื่อบริหารโครงการรวมเงินประกัน/เงินหั…23931 tokens truncated…n secret configuration is performed by this version.

## v268 gateway resilience / durable-ready state

- Added provider timeout and at-most-one retry for transient 408/429/5xx/network failures; non-retryable provider errors are not replayed.
- Rate limiting and idempotency now use an optional `GATEWAY_STATE` durable binding when present, with the bounded in-memory implementation retained for undeployed/local scaffolding.
- Added optional privacy-safe `GATEWAY_AUDIT` metadata sink containing only request ID, exact origin, status, provider label, duration and timestamp—never image payload, OCR text, amounts, partner names or accounting records.
- Health reports whether durable state/audit bindings exist without exposing secrets.
- Production bindings remain intentionally unconfigured; no DNS or live gateway activation.

## v267 gateway protocol / idempotency boundary

- Added protocol version negotiation and request IDs end-to-end between the PWA gateway client and edge worker.
- OCR requests require protocol v1; responses expose protocol/request IDs for support and audit correlation without sending accounting records.
- Added a bounded in-memory one-minute idempotency cache keyed by exact origin + request ID to avoid duplicate upstream OCR calls during short retries.
- Added a provider adapter boundary (`OCR_PROVIDER=generic`) so future Gemini/OpenAI adapters can be added server-side without changing accounting core.
- Health now reports protocol and whether provider configuration exists, but never returns provider secrets.

## v266 Worker contract / server boundary

- Added an isolated `gateway/` edge-worker contract; it is not enabled or called unless the browser is explicitly configured for consented remote OCR.
- Health endpoint, exact-origin CORS allowlist, expense-OCR route allowlist, body-size guard and a conservative per-IP in-memory rate hook are included.
- Provider API key is read only from server environment/secret storage; no secret value is committed or added to PWA state.
- Added gateway contract QA to the release workflow to reject wildcard CORS, missing route/size/rate guards or committed provider secrets.
- This is deployment-ready scaffolding only: no DNS, production endpoint or provider secret has been configured.

## v265 gateway contract / OCR privacy guard

- Remote OCR now requires explicit `remoteOcrConsent=true`; configuring an endpoint alone cannot transmit document images.
- Gateway is allowlisted to the expense OCR contract, validates image data URLs, rejects payloads over 4 MiB and validates/sanitizes response fields.
- Requests omit credentials/referrer, bypass browser cache and use an abort timeout bounded to 3–30 seconds.
- Remote OCR failure falls back to local Tesseract instead of blocking expense entry.
- No provider secret is stored in browser state; accounting entries still require user review/save.

## v264 AI/OCR gateway abstraction

- Added provider-neutral AI gateway configuration with local OCR as the backward-compatible default.
- Expense OCR can route through a configured HTTPS gateway or localhost development endpoint; no API key, bearer token or provider secret is stored or sent by the browser.
- Gateway responses remain suggestions only: existing draft identity/change guards still prevent OCR from silently overwriting user edits or auto-posting accounting entries.
- Existing Tesseract local OCR remains available and offline accounting/storage behavior is unchanged.
- This creates a stable seam for a future Render endpoint or Cloudflare Worker without coupling accounting core to either host.

## v263 portable recovery / PWA update integrity

- Backup sheet can now save a portable `.json` state file through the existing iPhone share/download path, while retaining copy/paste backup compatibility.
- Service-worker controller changes reload immediately only when no draft, sheet, save, OCR or BOQ import is active; otherwise the update is deferred until the current work is closed.
- Added regression assertions for portable backup and guarded PWA update hooks.
- Storage identifiers and IndexedDB schema remain unchanged; no production host or DNS switch.

## v262 host-neutral PWA / deployment readiness

- Fixed Release QA so the dependency-free repository no longer asks `setup-node` for a nonexistent npm lockfile cache.
- Added portable static-host headers for service-worker revalidation and security defaults; compatible with Cloudflare Pages while remaining harmless to the current host.
- Added SPA/PWA navigation fallback for static edge hosting without changing the relative manifest scope or local/offline storage model.
- No production-host switch, DNS change, storage-key change or destructive migration.

## v261 CI / host-neutral release gate

- Added GitHub Actions release QA for every push/PR to `main`: Node syntax checks for the service worker plus the full `tests/qa.cjs` regression suite.
- Release QA is hosting-neutral: no Render-specific runtime URL is required, preserving a safe future path to Cloudflare Pages/Workers.
- Storage identifiers and IndexedDB schema remain unchanged; this release adds no destructive migration.

## v260 production accounting gate

- Added one deterministic Production Gate spanning Data Health, tax/document reconciliation, AR/AP, bank reconciliation, journals, Trial Balance, financial statements, closed-period integrity, document lineage, audit history and project accounting.
- Period close now requires the Production Gate to pass; warnings such as a missing bank reconciliation remain visible without inventing accounting data.
- Added deterministic scale regression with 500 accounting rows plus storage/recovery compatibility assertions.

## v259 performance / scale hardening
- Production Gate is deterministic on large in-memory accounting sets and does not mutate source records during validation.

## v258 iPhone / Safari release safeguards
- Existing VisualViewport, safe touch/click path and PWA cache safeguards remain release invariants; physical-device verification remains a separate gate.

## v257 backup / recovery integrity
- Production release tests pin localStorage `site-ledger-v1`, recovery `site-ledger-v1-recovery`, IndexedDB `site-ledger-db` v1 and retain non-destructive migration behavior.

## v256 Data Health 3.0
- Production Gate consumes Data Health as a blocking invariant rather than duplicating or silently repairing corrupted records.

## v255 document control integrity
- Duplicate document IDs and broken Quote → Bill → Receipt lineage are blocking production issues.

## v254 tax reconciliation hardening
- Tax/document reconciliation is a blocking production invariant; WHT rates outside valid numeric bounds are reported rather than guessed.

## v253 construction WIP integrity
- Project accounting validates finite contract/cost/commitment/billing/receipt/AR/AP values and rejects negative WIP proxy anomalies.

## v252 project accounting reconciliation
- Every project is evaluated through the canonical project accounting calculation before period close.

## v251 accounting statements integrity
- Management financial statements and the accounting equation must reconcile with the Trial Balance.

## v250 double-entry hardening
- Every derived and manual journal included in the target period must balance; Trial Balance remains a separate blocking check.

## v249 cash / bank control
- Latest bank reconciliation difference is blocking when a reconciliation exists; absence is surfaced as a warning instead of fabricating a statement balance.

## v248 AP control 2.0
- AP Aging is reconciled against canonical outstanding settlement balances.

## v247 AR control 2.0
- AR Aging is reconciled against Billing open balance after partial settlements.

## v246 audit integrity
- Malformed audit rows are detected by the Production Gate so accounting history cannot silently become unverifiable.

## v245 period close 2.0
- Period close is now guarded by the shared Production Gate and closed-period snapshot integrity.

## v244 VAT / WHT integrity
- WHT validation rejects non-positive or over-100% recorded rates without substituting an assumed rate.
- Existing recorded rates such as 1/2/3/5% remain preserved; VAT/WHT calculations continue from recorded transaction data.

## v243 billing settlement lock hardening

- A billing document becomes accounting-locked as soon as any AR settlement exists, including a partial receipt while the receivable source still has `paid=false`.
- Both the edit entry point and save path enforce the settlement lock so UI navigation cannot bypass accounting history protection.
- Legacy fully-paid billing remains covered through the same `txPaidNet` settlement primitive.
- Added regression coverage for a partial receipt that must lock the billing document before full settlement.
- Service worker/cache registration advanced to v243 without storage-key or migration changes.

## v242 AR reconciliation integrity hardening

- Data Health billing reconciliation now understands nested partial AR settlements instead of treating the full receivable as still unpaid.
- Settlement receipt links and amounts are validated per nested payment row, while legacy fully-paid receipt links remain compatible.
- Project statistics now count partial AR cash received and outstanding receivables through the same settlement primitives used by billing, cash flow and journals.
- Added regression coverage spanning Data Health, Billing Reconciliation and project received/outstanding totals for the same partial receipt.
- Service worker/cache registration advanced to v242 without storage-key or migration changes.

## v241 AR settlement Data Health hardening

- Data Health now accepts valid nested AR settlements on income receivables introduced in v240.
- Invalid transaction types carrying AR/AP settlements are still rejected.
- Added regression coverage so AR settlement support and Data Health cannot drift apart.
- Service worker/cache registration advanced to v241 without changing storage keys or migration behavior.

## v240 AR accrual / partial-settlement hardening

- Billing receivables now preserve the original invoice/billing date and full accrual value when later payments are received.
- Partial AR receipts are stored as dated settlement rows on the receivable instead of mutating the original receivable transaction.
- Double-entry posts the billing source to Accounts Receivable once, then each receipt as Debit Cash/Bank and Credit Accounts Receivable.
- Bank book, cash split, cash flow, billing reconciliation and receipt reconciliation understand nested AR settlements while remaining compatible with legacy paid rows.
- This prevents a later receipt from silently moving previously accrued revenue out of a closed accounting period.

## v239 AP partial-payment hardening

- Outgoing payables support multiple partial settlements with payment date and cash/bank method.
- Expense recognition stays on the original transaction; partial settlements reduce AP through separate dated payment journals.
- Cash/Bank, AP Aging, 30-day cash forecast, project commitments, due lists and cash-flow reporting use actual settlement amounts.
- Existing legacy fully-paid outgoing transactions remain compatible without destructive migration.
- Data Health validates nested AP payment IDs, dates, methods, positive amounts and overpayment.
- A payable from a closed expense period can still be settled in a later open period; only the settlement affects that later period.

## v238 Closed-period integrity hardening

- Closed accounting periods now block direct mark-paid, due-date edits, transaction edits/deletes, guarantee accounting changes and new bank reconciliation writes.
- Safe Data Health repair skips transactions in closed periods instead of silently changing them.
- Closed-period snapshot integrity compares Trial Balance, bank book, profit and record counts against the stored close snapshot; Control Center 2.0 raises a critical exception on drift.
- Transaction sheets hide mutating actions while their period is closed.
- Regression tests cover closed-period payment, due-date, delete, editor, safe-repair and snapshot-drift paths.

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

Service-worker cache: `site-ledger-v321-rc2-production-candidate`.
Registration: `sw.js?v=321`, `updateViaCache: 'none'`.

The tracked legacy `area-ledger-package.zip` is not the current deployment source;
use the current `main` tree. It was not used or rebuilt for this release.
