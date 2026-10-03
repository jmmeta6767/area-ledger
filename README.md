# AREA Ledger V2 — Master v800

Business Stable 1.0 Source Candidate / live-staging acceptance layered over v701, based on GitHub `main` v701
(`270f7de5b61dcd2a72a1f263a646158c884157ee`).

Standalone/PWA accounting and construction project control.


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

- ต้นทุนเพื่อบริหารโครงการรวมเงินประกัน/เงินหักที่ยังรอคืน เพื่อสะท้อนเงินทุนที่ยังถูกผูกไว้จนกว่าจะครบกำหนดรับคืน.
- ป้องกันการนับซ้ำ: ถ้าเงินประกันถูกบันทึกเป็นรายจ่ายบัญชีอยู่แล้ว ระบบแสดงว่าอยู่ในเงินประกันรอคืนแต่จะไม่บวกเข้าต้นทุนซ้ำ.
- เงินประกันรอคืนที่อยู่ในทะเบียนแต่ยังไม่มีรายจ่ายบัญชีจะถูกเพิ่มเข้าต้นทุนบริหารชั่วคราว.
- ต้นทุน Dashboard, Project Profit Control, Forecast, Project Cost Accounting และงบคงเหลือใช้ฐานต้นทุนใหม่นี้; รายจ่ายตามหมวดยังคงเป็นยอดบัญชีจริงเพื่อไม่ทำลายสมุดบัญชี/ภาษี.
- เงินประกันสัญญา/ประกันผลงาน/เงินหัก 10% ที่ยังไม่กำหนดวันรับคืน จะใช้อัตโนมัติเป็น วันส่งมอบ + 2 ปี เมื่อมีวันส่งมอบโครงการ (ยกเว้นหนังสือค้ำประกันธนาคาร).

## v1020 Expense Status Dashboard UX

- Removes the รับเงินแล้ว and ค้างรับ dashboard cards from the primary project finance view.
- Replaces the old three-card expense block with two large, direct status cards: 1. จ่ายแล้ว and 2. ค้างจ่าย.
- จ่ายแล้ว opens the expense list filtered to paid outgoing transactions; ค้างจ่าย opens outgoing transactions with an outstanding balance.
- Adds a compact สถานะรายจ่าย header with paid + outstanding total, clearer icons, larger figures, status-specific surfaces, and mobile-first spacing.
- Income data is not deleted or changed; only the primary dashboard presentation is simplified. Existing accounting, transaction, AR/AP, and project data remain intact.

## v1019 Transaction Recheck View

- รายการทั้งหมดแสดง ว/ด/ป แบบตัวเลข พ.ศ. บนทุกบรรทัด เช่น `25/9/2569` เพื่อเทียบกับชีตหน้างานได้ตรงบรรทัด.
- เพิ่มป้ายหมวด `ค่าของ`, `ค่าแรง`, และ `หมวดอื่น` พร้อมยอดรวม/จำนวนรายการแยกหมวดในหน้ารายการ.
- เพิ่มตัวกรองด่วน `ค่าของ / ค่าแรง / หมวดอื่น / ต้องตรวจ` เพื่อค้นหารายการที่จัดหมวดไม่ตรงได้ทันที.
- ระบบแนะนำหมวดจากชื่อรายการแบบ deterministic และแสดง `ควรเป็น ...` เมื่อหมวดที่บันทึกไว้ขัดกับหลักฐานคำสำคัญ โดยไม่แก้ข้อมูลบัญชีอัตโนมัติ.
- เพิ่มกฎสำหรับรายการงานจริง เช่น เหล็ก ปูน ทราย สี/ทินเนอร์ J-bolt/เพลท/ลวดเชื่อม = ค่าของ; งานโครงสร้าง/วิศวกรคุมงาน = ค่าแรง; เครน/เครื่องมือเช่า = ค่าเช่า; ตีตราสาร = ค่างานเอกสาร.

## v1018 Multi-row Expense Capture

- A single photo can now contain a full expense table. AI Vision returns structured `rows[]` instead of collapsing the sheet into one grand total.
- Each row is converted into an editable expense draft with its own date, amount, category, description, project, and payment method.
- The review sheet supports Select all / Select none and one-click save of all selected rows. Nothing is written to accounting before the human review step.
- Thai Buddhist-era dates are requested as ISO dates, summary rows are excluded, and common construction expenses are mapped into the existing five cost categories.
- One source image can safely support many saved transactions without duplicating the full image in every row: the first row keeps the evidence image while all rows keep a shared source-image hash and row index.
- Closed accounting periods remain fail-closed and duplicate source images are rejected on re-import.



## v1017 BOQ Work Section Recovery

- Restores BOQ work-section grouping without changing the existing material/labor split.
- AI Vision now returns and the Gateway preserves `sectionCode` / `sectionName` when a real BOQ section heading is visible; the prompt explicitly forbids inventing a section when the source heading is unclear.
- Existing or newly imported rows with blank sections receive a deterministic construction-work fallback from the item name, covering demolition/site prep, earth/bedding, concrete, reinforcing steel, formwork, structural steel, masonry/plaster, roofing, finishes, doors/windows, paint, plumbing, electrical and external works.
- Existing explicit section headings are never overwritten by the fallback.
- Current BOQ rows such as concrete demolition, excavation, sand bedding, concrete and RB/DB reinforcing steel no longer collapse into one `ไม่ระบุหมวดงาน` bucket.
- Storage keys, accounting data, BOQ quantities/prices, and review-before-save behavior remain unchanged.



## v1016 Gemini Flash-Lite Document Extraction

- Switches receipt and BOQ Vision extraction from `gemini-3.5-flash` to stable `gemini-3.5-flash-lite`.
- Flash-Lite keeps multimodal image input and structured JSON output while targeting document parsing and high-volume extraction workloads.
- Existing 40-second provider timeout, review-before-save rules, local OCR/Row-Band fallback, D1/R2 storage and accounting data contracts remain unchanged.
- Production stays gated behind successful staging live acceptance; no production authorization marker is included in this commit.

## v1015 BOQ Skew Row-Band Reconstruction

- Adds a quantity-anchored Row-Band parser for scanned Thai government BOQ/ปร.4 tables when OCR words on the same printed row drift vertically because of scan skew, perspective, or table lines.
- Each quantity anchor owns the vertical band halfway to neighboring quantity rows; price/amount pairs are accepted only when `qty × unitPrice ≈ amount`, so circled handwritten references such as 17/18/31/32 are ignored.
- Material and labor pairs are separated by detected table columns and the printed combined row total is cross-checked when available.
- Row-Band evidence participates in the existing v1014 strong-evidence recovery but remains marked for mandatory human review before save.
- Gemini Vision is given representative 48 ตร.ม. government-row examples matching this common form layout.
- Failure diagnostics now show AI, RowBand, equation, and OCR-word counts while preserving all selected images.


## v1014 BOQ Field-Image Recovery

- Adds a regression case for the supplied Thai ปร.4/BOQ layout with handwritten circled reference numbers beside printed material/labor prices.
- Rows with strong quantity × unit price ≈ amount or validated dynamic-column evidence are no longer discarded solely because Thai item text OCR is noisy; they enter Preview marked for mandatory human review.
- Zero-row results now expose whether AI Vision was disabled or which provider/image errors occurred, instead of only reporting a generic “จับ BOQ ไม่ได้”.
- No automatic accounting save is introduced; all recovered rows still stop at Preview for correction and approval.

## v1013 BOQ Multi-Image No-Hang

- Fixes the BOQ import progress UI so the bar and percentage repaint live instead of remaining visually stuck at 1%.
- When AI Vision is enabled, BOQ image batches now use AI first; local Tesseract runs only as a fallback/supplement when AI rows are insufficient.
- AI image decoding is bounded to 12 seconds and each AI request is bounded to 28 seconds. A failed image is skipped and the batch continues instead of hanging all selected images.
- Local OCR fallback is also bounded; a stalled Tesseract recognition is terminated instead of leaving iPhone Safari spinning indefinitely.
- The BOQ Cancel button now aborts the active Gateway request, terminates the local OCR worker, preserves the selected image queue, and prevents late async results from overwriting the UI.
- AI waiting status shows elapsed seconds per image so a live request is distinguishable from a frozen page.
- Storage contracts remain unchanged: `site-ledger-v1` and `site-ledger-db`.

## v1012 Scanned-PDF AI BOQ Path

- Scanned BOQ PDFs up to 8 pages now use the configured Gemini Vision gateway first, page by page, before falling back to the existing Thai/English local OCR path.
- AI rows remain review-gated and are quality-filtered before preview; no AI result is posted directly into project accounting.
- The scanned-PDF path now reports determinate BOQ progress through completion and retains upright-only rendering (0°), matching the field workflow.
- Larger scanned PDFs continue on the local OCR path to avoid long mobile AI request chains; this keeps iPhone memory/latency bounded.

## v1011 OCR Gateway Diagnostic Fidelity

- Browser OCR requests now parse structured gateway errors before falling back, preserving provider/gateway codes such as `PROVIDER_TIMEOUT`, `PROVIDER_HTTP_*`, `RATE_LIMITED`, or `ORIGIN_DENIED` in the existing OCR diagnostic record.
- Successful responses still require matching gateway protocol/request identity before their accounting or BOQ payload is accepted.
- Receipt and BOQ review-before-save behavior is unchanged; this release improves diagnosis without auto-saving AI output.

## v1010 Vision Staging Gate

- Live staging acceptance now exercises the real Gemini Vision provider before any production cutover is authorized.
- Provider canary evidence records attempt count and the last HTTP/provider response, while retaining bounded retry behavior for transient 429/5xx failures.
- Production cutover authorization was closed after the successful v1009 production acceptance; subsequent development remains staging-first until explicitly re-armed.
- No accounting storage keys, D1/R2 schema, review-before-save behavior, or production secrets are changed.


## v1009 Vision Provider Acceptance Retry

- Keeps the v1008 production provider configuration unchanged after a direct live Gateway probe returned HTTP 200 through Gemini 3.5 Flash.
- Production Vision acceptance now retries transient 429/5xx provider failures up to four times with bounded backoff instead of failing the whole cutover on one temporary upstream spike.
- Non-retryable failures still stop immediately and the cutover remains fail-closed.
- Acceptance evidence records how many Vision attempts were required.

## v1008 Gemini 3.5 Vision Provider Cutover

- Replaces `gemini-2.5-flash` with `gemini-3.5-flash` after the production API key returned a Google 404 for 2.5 while direct text and image probes succeeded on 3.5.
- Gemini image extraction uses JSON response mode with `thinkingLevel=minimal`; the old forced temperature setting is removed.
- Gateway provider timeout is raised to 40 seconds and the browser request budget to 45 seconds. Existing clients carrying the old 15-second default are migrated to 45 seconds.
- v1007 handwritten integer recovery remains active, so AI text containing 325 × 4 / TOTAL 1300 can recover 1,300 even if the provider amount field is zero.
- Production live acceptance now verifies a valid PNG image reaches Gemini successfully; receipt-specific extraction quality remains covered by deterministic parser regression tests and physical field validation.
- Review-before-save, storage keys, D1/R2 bindings, and the `g.areamaibab.workers.dev` user origin remain unchanged.

## v1007 Handwritten Integer Total Recovery

- Fixes the exact small-shop receipt gap where client fallback only recognized numbers with two decimal places; handwritten `1300` and `325` were ignored.
- Receipt recovery now accepts integer or decimal amounts, Thai digits, TOTAL/net-total labels, and repeated AMOUNT values while excluding slash-formatted dates from number tokens.
- If Gemini returns `amount: 0` but its recognized text contains `TOTAL 1300`, the client now recovers 1,300 and still requires human review before save.
- Production live acceptance now includes a synthetic, non-user receipt image with four 325 lines and TOTAL 1300 to verify the live Gemini Vision path can see an integer total.
- Zero-result UI now distinguishes AI Vision from local OCR and includes the stored diagnostic error code when present.

## v1006 Legacy g Service Binding Hotfix

- Replaces the legacy `g` Worker compatibility proxy's public network subrequest with a Cloudflare Service Binding to `area-ledger-ai-gateway`.
- This keeps `g.areamaibab.workers.dev` as the browser origin, preserves Safari localStorage, and gives stale cached clients a direct Worker-to-Worker path for `/health`, `/ready`, and `/v1/*`.
- The `g` Worker still stores no Gemini secret and has no D1/R2 accounting bindings; it only serves the tested app assets and forwards approved Gateway paths.
- Production live acceptance continues to verify the real `g` origin and must pass the compatibility `/ready` proxy before cutover is accepted.

## v1005 Legacy g App Shell Sync

- Keeps the user-facing origin `https://g.areamaibab.workers.dev` so iPhone/Safari localStorage and installed-PWA data stay on the same origin.
- Adds a dedicated static app-shell deployment named `g` using the exact `gateway/public` assets that passed release QA.
- The legacy worker proxies only `/health`, `/ready`, and `/v1/*` to the canonical production Gateway, so older cached clients can recover without an origin migration.
- Production live acceptance now verifies the real `g...` page, the browser Origin CORS path, the legacy readiness proxy, and a v1005 client-contract marker.
- The legacy app shell holds no Gemini secret, D1/R2 binding, or accounting state. Accounting data and AI remain on the canonical Gateway; review-before-save remains unchanged.

## v1004 Legacy Production Alias Readiness CORS Hotfix

- Fixes the iPhone/Safari failure where the legacy production app origin `https://g.areamaibab.workers.dev` could reach the canonical AI Gateway allowlist but still failed before OCR because `/ready` and `/health` returned before CORS headers were applied.
- `/ready` and `/health` now apply the same explicit-origin policy as protected API routes: known origins receive their exact `Access-Control-Allow-Origin`; unknown origins fail closed with `ORIGIN_DENIED`.
- No wildcard CORS is introduced. Gemini credentials, accounting data, storage keys, D1/R2 bindings, and review-before-save behavior are unchanged.
- Runtime regression tests cover allowed cross-origin health/readiness and denied unknown origins.



## v1003 Production AI Vision Route + Receipt Totals

- Fixes production app alias `g.areamaibab.workers.dev`: AI Vision now targets the canonical production Gateway.
- Production Gateway CORS explicitly allows the canonical Gateway and `g.areamaibab.workers.dev`; wildcard CORS remains forbidden.
- Legacy consent bound to the old `g...` endpoint is not silently reused; consent must bind to the canonical Gateway.
- Gemini receipt rules prioritize final payable/net totals for VAT invoices and handwritten cash-sale totals.
- Regression examples cover 325 × 4 → 1,300 and 4,240 + VAT 296.80 → 4,536.80 with Thai Buddhist-year date normalization.
- AI still only fills fields for review; it never auto-saves an expense.

## v1002 Receipt Review Hardening

- Receipt/expense image scanning now shows real monotonic phase progress from 1% to 100% for single images and multi-image batches.
- Multi-image import preserves a valid date returned by AI Vision instead of silently replacing it with today's date.
- Batch review exposes editable receipt date, project, and payment method per row before any accounting write.
- Failed OCR keeps the prepared receipt image when possible so the user can manually complete the row instead of losing the evidence.
- Batch saves now persist receipt photo fingerprints plus OCR source/confidence and a human-reviewed marker; no expense is auto-saved by AI.
- `site-ledger-v1`, `site-ledger-db`, `APP_RELEASE=800`, the proven PWA cache contract, Cloudflare production bindings, and accounting policy remain unchanged.
- Google Drive / Sheets code remains present but is not enabled by this release.


## v816 Safari Storage Production Gate Closed

- v815 passed Release QA, Staging deploy/live acceptance, and Production deploy/live acceptance for exact source `05d52fc51b5e104a8a5ef31087a0241ece202a3b`.
- The Safari first-save baseline fix is now live in Production.
- The one-time production authorization marker is removed again immediately after successful acceptance.
- Next real-device validation is to refresh the production page and create the first project; a legitimate first save must succeed while genuine cross-tab writes remain blocked.

## v815 Safari Canonical Storage Baseline

- Fixes a real iPhone/Safari first-save failure where `loadLS()` migrates a copy of the stored ledger, but optimistic concurrency compared that migrated JSON against the original raw localStorage bytes.
- When localStorage is the winning boot source, the app now keeps the exact raw bytes as the concurrency baseline; the first legitimate save after refresh no longer looks like an external-tab edit.
- Real external-tab edits are still fail-closed and continue to set the storage-conflict guard.
- No storage key, IndexedDB name, Cloud Ledger key, accounting policy, or production binding changes.

## v814 D1 Repair Production Gate Closed

- v813 passed Release QA, Staging deploy/live acceptance, and Production deploy/live acceptance for exact source `a0c200074680d9649b23bbe7aaaf394cc732d956`.
- Production now contains the Fresh Start D1 reconcile auto-repair path.
- The one-time production authorization marker is removed again so future main pushes cannot redeploy production automatically.
- The user can refresh the production app and re-run **ตรวจ Cloudflare เต็มระบบ**; the first unmatched D1 mirror will be repaired from the authoritative Durable Cloud Ledger and must checksum-match before acceptance proceeds.

## v813 D1 Reconcile Auto-Repair

- Fixes the Fresh Start / first Cloud Sync path where Durable Cloud Ledger can be valid while its D1 mirror has not been materialized yet.
- Cloud Full Acceptance now verifies D1 with `GET /v1/ledger/reconcile`; only when unmatched, it requests the server-side repair path with `POST /v1/ledger/reconcile`.
- The repair is one-way from the authoritative Durable Cloud Ledger to the D1 mirror; it does not replace browser state or mark any human acceptance gate.
- Acceptance remains fail-closed unless the repaired D1 semantic checksum matches the Durable state exactly.
- This directly addresses the user-visible `D1 ยังไม่ตรงกับ Cloud Ledger` result after a valid revision-0 Fresh Start.

## v812 Final Production Gate Closed

- v811 Final Stable 1.0 Control Center passed Release QA, Staging deploy/live acceptance, and Production deploy/live acceptance for exact source `6b3923889c2a57175e53ebeb64a0103ce1210ad3`.
- The one-time production authorization marker is removed again immediately after the successful production cutover.
- Future source work remains staging-first and cannot redeploy production unless a fresh explicit authorization is committed.
- All machine-verifiable infrastructure gates are complete; the application intentionally leaves real iPhone field evidence and Accounting Freeze as explicit user/business acceptance.

## v811 Final Stable 1.0 Control Center

- Adds a single **FINAL · Stable 1.0** summary inside the Business Stable control center, separating automated infrastructure checks from evidence that must come from real business use.
- Final Check re-runs Cloud/D1/R2 reconciliation and Disaster Recovery certification, but it deliberately cannot mark iPhone Field Acceptance or Accounting Freeze on the user's behalf.
- Final readiness remains fail-closed until production runtime, real-data migration evidence, Cloud/D1/R2 acceptance, recovery, six real-device field checks, and Accounting Freeze all pass.
- Keeps `APP_RELEASE=800`, frozen storage identifiers, accounting policy `1.0`, and pinned production/staging resources unchanged.

## v810 Production Cutover Closed

- Production cutover completed successfully for source `5693ba1ae3ae5c7bbb8756ebfc5fb9c9addcd1c2` after exact-SHA Release QA and Staging live acceptance.
- Production secret preflight, pinned D1/R2 binding capture, OCR secret installation, D1 migrations, production redeploy, and live production acceptance all passed.
- Production resources remain pinned to the isolated production D1/R2 bindings introduced in v809.
- The one-time production authorization marker is removed again so future main pushes cannot redeploy production automatically.
- This confirms infrastructure/runtime cutover only; migration of the user's real accounting dataset, real-device iPhone field acceptance, and Accounting Freeze remain separate explicit acceptance steps.

## v809 Production Resource Pin

- Pins the real production D1 database created by the first intentional production deployment: `area-ledger-ai-gateway-ledger-db` / `72fc4f7e-63ec-42ca-8a2e-7b1dc61bf72d`.
- Pins the real production R2 bucket `area-ledger-ai-gateway-ledger-files` so subsequent production deploys cannot auto-provision another bucket.
- Pins production `ALLOWED_ORIGINS` to the exact production Workers.dev origin.
- Keeps production and staging D1/R2 resources isolated; no staging identifier is reused in production.
- The first production deployment created resources successfully but stopped before OCR secret installation/migrations/live acceptance because the earlier capture step expected Wrangler to rewrite the checked-in config. This pin commit converts the discovered live resource identifiers into deterministic source configuration before resuming cutover.

## v807 Production Cutover Re-Arm

- Re-arms the one-time production cutover only after the `production` GitHub Environment has all three required secrets configured: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `OCR_API_KEY`.
- The exact re-armed SHA must pass Release QA and Staging Auto Deploy + live acceptance before the production workflow is allowed to proceed.
- Production remains fail-closed: missing credentials, failed QA, failed staging acceptance, failed D1/R2 capture, migration failure, or live acceptance failure stops the cutover.
- The authorization marker is temporary and must be removed after a successful production cutover.

## v806 Production Cutover Dormant Guard

- Records a privacy-safe production secret preflight artifact containing only present/missing booleans plus source/run provenance; secret values are never written.
- Production cutover now emits explicit missing-secret names before failing, so a blocked Environment can be repaired without weakening staging/production isolation.
- The one-time production authorization marker is intentionally removed after the credential-gate failure. Subsequent main pushes remain staging-only until production credentials are configured and cutover is explicitly re-armed.
- No production D1/R2 resource was created by the failed v805 attempt, and no real ledger migration occurred.

## v805 Staging-Gated Production Cutover

- Adds a one-time production authorization marker plus a dedicated cutover workflow that can run only after the **AREA Ledger Staging Auto Deploy** workflow succeeds for a `main` push.
- The production job checks out the exact staging-tested SHA, re-runs release QA, deploys production, captures auto-provisioned D1/R2 bindings, installs the OCR secret, applies D1 migrations, redeploys, and runs the live production acceptance drill.
- Production deployment is isolated behind the GitHub `production` Environment and does not run directly from an arbitrary push.
- The authorization marker is designed to be removed immediately after a successful cutover; future staging runs then leave production skipped.
- This cutover does not claim the user's real ledger migration, iPhone field acceptance, Accounting Freeze, or Stable 1.0 completion.

## v804 Live Acceptance Provenance

- Binds each automated live acceptance artifact to the declared target environment, exact GitHub source SHA, and workflow run ID.
- Staging and production workflows now inject explicit provenance into `live-acceptance.json`; a target/base mismatch fails closed before platform checks continue.
- Provenance is privacy-safe metadata only and does not add ledger values, OCR text, attachment contents, secrets, or recovery keys to artifacts.
- `APP_RELEASE=800`, the v800 PWA cache, frozen storage identifiers, accounting policy 1.0, and current Cloudflare resource bindings remain unchanged.

## v803 Business Stable Control Center Hotfix

- Fixes the Business Stable v800 sheet evaluating iPhone field evidence and Stable 1.0 status before those evidence objects were initialized.
- Adds a regression guard that requires field/stable evidence initialization to happen before the phase matrix is evaluated.
- This is a UI/runtime hotfix only: `APP_RELEASE=800`, the v800 service-worker cache, frozen storage identifiers, accounting policy 1.0, and Cloudflare resource bindings remain unchanged.

## v802 Staging Resource Pin + Production Guard

- Pins the already-provisioned staging R2 bucket `area-ledger-ai-gateway-staging-ledger-files` so repeated deploys are deterministic rather than relying on inherited auto-provision state.
- Pins staging `ALLOWED_ORIGINS` to the exact Workers.dev staging origin while retaining same-origin access.
- Production deploy now requires an explicit `DEPLOY_PRODUCTION` confirmation input before any production mutation.
- Production deploy performs the same synthetic live Durable/D1/R2/recovery acceptance drill after migration/redeploy and uploads privacy-safe evidence.
- Production D1/R2 remain intentionally unpinned until real production resources are created by an intentional production deploy.

## v800 Business Stable 1.0 Source Candidate

v800 executes the 1–10 stabilization plan while keeping real-user migration and production cutover fail-closed.

- **1 · Staging acceptance:** every staging deploy now runs a real public Worker acceptance drill after deployment.
- **2 · Real ledger migration:** the app still requires explicit Cloud Sync opt-in and migration evidence; no browser dataset is promoted automatically.
- **3 · Durable ↔ D1 reconciliation:** reconciliation now returns privacy-safe per-collection count/hash match diagnostics without exposing accounting values.
- **4 · iPhone field acceptance:** six explicit real-device checks are recorded separately from source QA and expire after seven days / release changes.
- **5 · Receipt/OCR/R2:** live acceptance verifies private R2 write/list/read/delete plus D1 file indexing; app field acceptance separately confirms receipt and OCR UX.
- **6 · Recovery:** live acceptance performs a two-revision Durable CAS write, history check, previous-revision restore and post-restore D1 reconcile.
- **7 · Monitoring / security:** action queue remains non-mutating; live acceptance uses synthetic isolated data and never uses the user's recovery key.
- **8 · Accounting freeze:** policy `1.0` can be stamped only after the current accounting baseline has no blockers; evidence is release/policy/freshness bound.
- **9 · UX / management:** v700 Owner Operations and mobile-first flows remain the stable operational baseline.
- **10 · Stable 1.0 gate:** `stable1Readiness()` additionally requires real iPhone evidence, accounting freeze and a production runtime. Staging can never claim Business Stable 1.0 PASS.
- New staging auto-deploy workflow deploys trusted `main` changes only to the `staging` GitHub Environment, applies D1 migrations and runs the live acceptance drill.
- PWA release: `APP_RELEASE=800`; cache: `site-ledger-v800-business-stable-1-source-candidate`.
- Production deployment and the user's real ledger migration remain explicit live operations; source/staging success does not claim they already happened.
## v700 Business Stable Source Candidate

This release executes the next 1–10 development sequence without claiming that account-level Cloudflare deployment or the user's real iPhone data migration has already occurred.

- **1 · Staging live cutover control:** stores privacy-safe full-acceptance evidence only after real platform readiness, D1 reconciliation, R2 probe and Cloud history all pass.
- **2 · Real data migration gate:** Cloud evidence is tied to current origin + release and expires after 24 hours; migration acceptance remains digest-based and explicit.
- **3 · iPhone field acceptance:** PWA secure runtime, refresh continuity, safe-area/VisualViewport and local recovery contracts remain under QA; real-device use is still a live acceptance requirement.
- **4 · Production cutover:** Business Stable cannot pass while Cloud full acceptance is missing/stale/from another origin or release, or while Cloud Sync has an unresolved conflict.
- **5 · Accounting lockdown:** `accountingBaselineCertificate()` aggregates Accounting Production Gate, Bank Reconciliation, storage schema, document flow and exact-duplicate checks.
- **6 · Backup / disaster recovery:** a fresh Disaster Recovery Certification is required; recovery success is never inferred from source code alone.
- **7 · Daily UX finalization:** v600 compact mobile BOQ/table and route persistence remain the stable baseline.
- **8 · Business operations:** Owner Operations, profitability, AR/AP, cash forecast, guarantee control, reports and exports stay active under regression QA.
- **9 · Automation action queue:** `businessAutomationQueue()` merges owner actions, month-end exceptions, stale Cloud acceptance and stale DR evidence without posting accounting entries automatically.
- **10 · Stable Business Gate:** in-app `Business Stable v700` Control Center runs the live Cloud + recovery acceptance sequence and shows phase-by-phase PASS/CHECK.
- PWA release: `APP_RELEASE=700`; cache: `site-ledger-v700-business-stable-source-candidate`.
- Live Business Stable still requires real Cloudflare deployment, real ledger migration/reconciliation and real iPhone/Safari evidence.
## v600 Stable Source Candidate

This completes the source-code side of the 1–8 Cloudflare plan. Live cutover is accepted only after real account deployment and real ledger reconciliation; the repository does not claim browser-local accounting data has been migrated when no portable backup or recovery-key session is available.

- **1 · Staging cutover:** secret-gated Cloudflare deploy pipeline, D1/R2 provisioning declarations, migrations and schema-aware readiness.
- **2 · Cloud data migration:** conflict-safe Durable Cloud Ledger, explicit D1 migration/readback/reconcile and semantic checksum; no silent fallback promotion.
- **3 · Accounting integrity:** full regression gate preserves AR/AP, VAT/WHT, bank reconciliation, month-end, document flow, BOQ and guarantees.
- **4 · iPhone final UX:** compact BOQ/table pass, safe-area/VisualViewport support and refresh continuity through session navigation state.
- **5 · Receipt/OCR production:** Gemini via Worker secret, confidence/fallback rules, private R2 receipt offload, stable duplicate hash and deferred R2 deletion after local save.
- **6 · Recovery:** previous Cloud revision rollback, portable JSON recovery, IndexedDB/local cache and conflict-safe sync.
- **7 · Security/RC:** exact-origin CORS, protocol pinning, capability-key isolation, Durable rate limiting, private/no-store R2 and no committed secrets.
- **8 · Stable acceptance:** the in-app full acceptance action requires platform readiness + Durable↔D1 match + private R2 write/read/delete probe + Cloud history before PASS.
- PWA release: `APP_RELEASE=600`; cache: `site-ledger-v600-stable-source-candidate`.
- Live Stable 1.0 still requires real staging/production evidence in `gateway/PRODUCTION-CUTOVER.md`.
## v531 Production OCR Secret Gate

- Production and staging now use the same Gemini 2.5 Flash provider contract, removing the unconfigured generic-provider gap on a fresh production deployment.
- The Cloudflare deployment workflow refuses to start unless account ID, API token and OCR API key are present in the selected GitHub Environment.
- After the first provisioning deploy, the workflow writes `OCR_API_KEY` through Wrangler secret storage, applies D1 migrations, then redeploys.
- Secrets remain outside Git and are never written to Wrangler vars or source files.
- PWA release remains v520; this release only closes the production deployment/configuration gate.

## v530 Cloudflare Auto-Provision + Deploy Pipeline

- Wrangler declares draft `LEDGER_DB` and `LEDGER_FILES` bindings for production and staging, with no fabricated IDs or bucket names. Current Wrangler can auto-provision D1/R2 resources at deploy time.
- Staging and production bindings are independent so their resources are isolated by environment.
- Added a manual GitHub Actions deployment pipeline for staging/production. It runs the complete release QA before any deploy.
- Deployment provisions resources through Wrangler, applies D1 migrations remotely, then redeploys after schema activation.
- `/v1/platform/status` validates the D1 ledger + file-index schema before reporting `productionReady: true`; a binding alone is not enough.
- Cloudflare API token/account ID stay in GitHub Environment secrets. No token, resource UUID, OCR key or private bucket URL is committed.
- PWA release remains v520 because this release hardens infrastructure/deployment only.

## v520 R2 Attachment Cutover

- Added PWA-side authenticated R2 upload/open helpers using the existing Cloud recovery capability; no public bucket URLs are introduced.
- Expense receipt photos can be moved from base64 ledger state into private R2 while retaining a small local thumbnail plus object reference/hash metadata.
- New saved expense photos automatically attempt R2 offload when Cloud Sync is enabled; failure is non-destructive and leaves the original photo in local ledger state.
- Backup / Cloudflare Sync now includes an explicit two-step bulk migration for existing receipt photos.
- Remote originals open through an authenticated Worker fetch and temporary browser object URL; the object URL is revoked when the sheet closes.
- Duplicate-photo protection retains a stable photo hash after full-resolution bytes leave ledger state.
- Release cache: `site-ledger-v520-r2-attachment-cutover`; registration `sw.js?v=520`.
- Local storage identifiers remain frozen.

## v510 Cloudflare Production Candidate

- Added `/v1/platform/status` with an explicit `productionReady` gate requiring OCR provider, Durable Object, D1 and R2 components.
- Added authenticated `/v1/ledger/reconcile` to compare Durable Cloud Ledger vs normalized D1 semantic checksums; POST explicitly repairs the D1 shadow from the authoritative Durable snapshot and rechecks it.
- Added authenticated `/v1/files/list` backed by the private D1 file index so R2 attachment inventory can be audited without exposing file bytes.
- Added a dedicated 60/minute ledger rate-limit setting and retained Durable Object-backed enforcement.
- Added `tests/cloudflare-production.cjs` to CI and a production cutover runbook. The gate deliberately fails readiness until real D1/R2 resources are bound.
- No fake Cloudflare resource IDs, bucket names, tokens or secrets are committed. Staging and production resources must remain separate.
- PWA runtime/cache stays v500 because v510 is backend production-readiness hardening; frozen local storage identifiers remain unchanged.

## v500 Cloudflare Recovery Hardening

- **Durable rollback:** each Cloud Ledger write keeps the immediately previous Durable Object snapshot instead of deleting it.
- **History API:** `GET /v1/ledger/history` reports current and previous revision metadata without exposing accounting payloads.
- **Explicit restore:** `POST /v1/ledger/restore-previous` recreates the prior snapshot as a new generation and increments `dataRevision`, so conflict protection never rewinds.
- **Two-step PWA control:** the Backup / Cloudflare Sync sheet can inspect cloud revisions and restore the previous revision only after explicit confirmation.
- **Recovery preservation:** replacing local state from Cloudflare still keeps the displaced device state in the frozen recovery snapshot and IndexedDB mirror.
- **Independent rate limit:** Durable ledger state/history/restore requests have a dedicated Durable Object-backed rate bucket.
- **D1/R2 retained:** v491 D1 shadow normalization and v492 private R2 attachment APIs remain intact. Durable Object stays authoritative until real staging D1/R2 bindings are provisioned and reconciliation passes.
- **Release cache:** `site-ledger-v500-cloudflare-recovery-hardening`; registration `sw.js?v=500`.
- **Frozen local contract:** `site-ledger-v1`, `site-ledger-v1-recovery`, and `site-ledger-db` are unchanged.

## v492 R2 Attachment Vault foundation

- Added authenticated R2 file endpoints for status, upload, private read and delete under the same Cloud recovery-key isolation used by Cloud Ledger.
- Retains the established 4 MiB/file safety limit and accepts only JPEG, PNG, WebP and PDF; active SVG/HTML content is rejected.
- R2 object keys are scoped to the SHA-256 ledger hash so another ledger capability cannot address the object.
- Downloads are private/no-store with `nosniff`; the bucket is designed to remain private.
- Added `0002_ledger_files.sql` so D1 can index R2 object metadata, entity linkage, MIME, size and SHA-256 without storing file bytes in SQL rows.
- D1 indexing is best-effort during this foundation phase; R2 remains independently retrievable by the ledger capability even when D1 is not yet bound.
- No R2 bucket name/binding is activated in `wrangler.toml` until the real staging resource exists. Safe activation is documented in `gateway/R2-SETUP.md`.
- PWA release/cache remain v490 because this phase adds backend infrastructure only.


## v491 D1 Shadow Migration foundation

- Added `gateway/migrations/0001_cloud_ledger.sql` with `ledger_meta` + `ledger_entities`, foreign-key cleanup and project/kind indexes.
- Added capability-key-isolated D1 shadow endpoints: `/v1/ledger/d1-status`, `/v1/ledger/d1-migrate` and `/v1/ledger/d1-read`.
- D1 readback validates a semantic SHA-256 checksum before a mirror is accepted.
- State collections are stored as entity rows while top-level settings/metadata remain lossless in `ledger_meta.state_meta_json`.
- Large collection writes are chunked for D1; excessive statement count fails closed instead of truncating data.
- The existing Durable Object remains authoritative during shadow migration. D1 does **not** become primary until real staging bindings exist and migration/readback reconciliation passes.
- No Cloudflare database ID, account token or secret is fabricated or committed. Safe binding order is documented in `gateway/D1-SETUP.md`.
- The PWA runtime remains release v490/cache v490 in this infrastructure-only phase; storage keys remain frozen.


## v490 Cloudflare Durable Ledger Sync foundation

- **Cloudflare-only persistence path added:** the existing SQLite-backed `GatewayState` Durable Object now exposes `/v1/ledger/status` and `/v1/ledger/state` for encrypted-in-transit cloud state transport without reactivating Render.
- **Capability isolation:** each ledger uses a locally generated 256-bit recovery key; the Worker hashes that key before selecting a Durable Object. No ledger key or accounting payload is committed to Git.
- **Conflict-safe writes:** cloud replacement requires both the last known revision and SHA-256 checksum. Unknown or stale cloud state returns HTTP 409 instead of being overwritten.
- **Large-state safety:** the Worker validates the ledger shape, caps the cloud payload at 12 MiB and stores it in 64 KiB Durable Object chunks behind a manifest.
- **Opt-in migration:** Cloud Sync is disabled by default. The backup/recovery sheet is the only activation point so a partial/fallback browser dataset cannot silently become the cloud source of truth.
- **Offline cache retained:** localStorage `site-ledger-v1` and IndexedDB `site-ledger-db` remain as the local/offline cache and recovery layer during this transition. Successful local writes enqueue a cloud mirror only after the user has enabled Cloud Sync.
- **Cross-device recovery:** the backup sheet can copy/import the Cloud recovery key, pull the durable Cloudflare state, or explicitly push the current device state. Pulls preserve the prior local dataset in the existing recovery snapshot.
- **No silent conflict resolution:** divergent local/cloud data requires an explicit user choice; neither side wins automatically.
- **Release cache:** `site-ledger-v490-cloudflare-ledger-sync`; registration `sw.js?v=490`.
- **Next migration boundary:** D1 normalization and R2 attachment migration remain separate later phases; v490 deliberately uses the already-bound Durable Object so staging can harden cloud persistence before provisioning new Cloudflare resources.


## v481 Dashboard Expense Cleanup

- **One outgoing card:** “จ่ายเงินแล้ว” and “ค้างจ่าย” are combined inside one **รายจ่าย** card instead of appearing as duplicate outgoing concepts.
- **Income stays readable:** **รับเงินแล้ว** and **ค้างรับ** remain separate because they answer different collection questions.
- **Correct drill-down:** the expense card opens all outgoing transactions for the selected project; pending receivables open only incoming items that still have an outstanding balance.
- **Partial recovery banner removed:** the large “ข้อมูล Cloudflare ชุดนี้เป็นข้อมูลกู้คืนบางส่วน” dashboard card and its two dashboard buttons are no longer rendered.
- **Recovery capability retained:** Backup / Restore logic remains available outside the dashboard and Legacy Recovery remains read-only.
- **Guarantee rule preserved:** **เงินประกันรอคืน** still appears only on the all-project dashboard.
- **Storage frozen:** localStorage `site-ledger-v1` and IndexedDB `site-ledger-db` remain unchanged.
- **Service worker:** Cloudflare cache `site-ledger-v481-dashboard-expense-cleanup`; registration `sw.js?v=481`.

## v471–v480 Accounting Control Mobile Focus

- **v471 Dedicated accounting sheet:** Accounting Control uses a compact Cloudflare mobile sheet instead of one long stack of controls.
- **v472 First-scan accounting summary:** AR, AP, estimated net VAT and WHT payable stay visible before advanced tools.
- **v473 Bank reconciliation first:** accounting period, ledger bank balance, statement balance and reconciliation action remain on the first screen.
- **v474 Action First:** month-end, bank and data-health issues surface before advanced accounting tools.
- **v475 Primary monthly controls:** Month-End Checklist, Data Health and period open/close remain one-tap actions.
- **v476 Compact AR/AP aging:** receivable and payable aging move behind one readable disclosure instead of consuming the first screen.
- **v477 Books and statements fold:** Journal, Chart of Accounts, GL, Trial Balance and management statements remain available as one tool group.
- **v478 Tax and document fold:** Tax reconciliation/register, document-flow integrity and Audit Trail remain fully available.
- **v479 Project and management fold:** Project Cost, Control Center 2.0, Executive Accounting Report and Excel export remain available.
- **v480 Hardening:** Bank Reconciliation and period-close/reopen logic remain unchanged; Cloudflare is the sole product runtime and frozen storage identifiers remain unchanged. Cloudflare cache: `site-ledger-v480-accounting-control-mobile-focus`; registration: `sw.js?v=480`.

## v461–v470 Document Editor Mobile Focus

- **v461 Dedicated document sheets:** quotation and bill/receipt editors use compact Cloudflare mobile sheets instead of generic tall forms.
- **v462 Primary fields first:** document number/date and customer/project remain visible before secondary details.
- **v463 Progressive customer/tax details:** address, tax ID, branch, VAT flag, delivery location and seller move behind compact disclosure without changing field IDs.
- **v464 Compact item entry:** quotation and business-document item cards are shorter while preserving quantity, unit, price and line-discount inputs.
- **v465 Calculation contract preserved:** quotation subtotal, discount, VAT and grand-total outputs keep the existing calculation path.
- **v466 Optional note/signature/attachment fold:** secondary quotation details no longer occupy the first screen but remain fully available.
- **v467 Bill/receipt editor parity:** customer, tax, item, discount, WHT, due-date and note fields keep the existing save contract.
- **v468 Compact receive-payment sheet:** billing-note settlement shows total / received / remaining first while retaining amount, date, payment method and receipt generation.
- **v469 iPhone ergonomics:** document inputs remain 16px and primary save actions stay reachable in a compact sticky 44px action bar.
- **v470 Hardening:** Cloudflare remains the sole product runtime, document/accounting formulas are unchanged, Legacy Recovery stays separate and frozen storage identifiers remain unchanged. Cloudflare cache: `site-ledger-v470-document-editor-mobile-focus`; registration: `sw.js?v=470`.

## v451–v460 Business Documents Mobile Focus

- **v451 Billing command summary:** the document hub shows open billing-note receivables, overdue amount and cash already received through linked billing documents.
- **v452 Action First:** overdue and next-7-day billing notes appear before document history.
- **v453 Quick create:** quotation, billing note and receipt creation stay one tap from the document hub.
- **v454 Recent documents:** quotation / billing note / receipt activity is merged into one latest-document timeline.
- **v455 Project scope:** document registers gain a compact project selector without modifying document records.
- **v456 Billing status tabs:** billing notes can be filtered by All / Open / Overdue / Paid.
- **v457 Direct receive-money flow:** an open billing note can launch Receive money / issue receipt directly from the register.
- **v458 Multi-token search:** document number, customer, project, date and note support in-place AND search.
- **v459 Refresh continuity:** document kind, project scope, billing status and search query persist per Safari tab through `sessionStorage` only.
- **v460 Hardening:** Cloudflare remains the sole product runtime, Legacy Recovery stays separate, and the frozen accounting storage contract is unchanged. Cloudflare cache: `site-ledger-v460-business-docs-mobile-focus`; registration: `sw.js?v=460`.

## v442–v450 Cloudflare Project Form Mobile Focus

- **v442 Compact sheet:** project add/edit uses a dedicated compact Cloudflare mobile sheet instead of the generic oversized form spacing.
- **v443 Primary first:** project name, status, owner, location, contract value and budget stay visible before secondary details.
- **v444 Contract fold:** contract number/date/start/end move into one progressive disclosure section while preserving the existing field IDs and save logic.
- **v445 Guarantee fold:** guarantee amount, paid date, delivery date and calculated return date move into one compact fold.
- **v446 Sticky save bar:** the editor keeps only Cancel + Save in a small bottom action bar so the primary actions stay reachable without covering fields.
- **v447 Safer delete:** destructive project deletion moves into a separate collapsed “จัดการโครงการ” section and retains two-step confirmation.
- **v448 iPhone sizing:** inputs remain 16px to avoid Safari focus zoom while field height drops to 42px and action height to 44px.
- **v449 Existing accounting logic preserved:** project save, guarantee expense syncing and delivery +2 year return-date calculation continue using the prior logic.
- **v450 Dashboard scope + hardening:** “เงินประกันรอคืน” appears only on the all-project dashboard; project-scoped dashboards keep only received / paid / AR-AP cards. Product runtime remains `gateway/public/index.html`; the root app stays retired as Legacy Recovery only. Storage keys remain frozen. Cloudflare cache: `site-ledger-v450-project-form-mobile-focus`; registration: `sw.js?v=450`.

## v441 Cloudflare-only Runtime + Recovery Gate

- **Cloudflare is the sole active AREA Ledger runtime:** GitHub `main` remains Source of Truth and the deployable app is `gateway/public/index.html` served by Wrangler/Cloudflare.
- **Root runtime retired:** repository root `index.html` is now a read-only Legacy Recovery portal for the former Render origin; it is not an accounting app and must not receive product features.
- **Render is legacy recovery only:** no new AREA Ledger features, accounting logic, UI, OCR or deployment work may target Render.
- **Explicit fresh-origin recovery:** a new Cloudflare origin no longer calls `restoreThaSalaKnown()` automatically. Empty storage stays empty until the user explicitly restores a backup or starts fresh.
- **Partial-recovery detection:** the historical Tha Sala fallback marker remains detectable for diagnostics; its large dashboard warning was retired in v481.
- **Legacy snapshot exporter:** the recovery portal reads `site-ledger-v1`, `site-ledger-v1-recovery`, and IndexedDB `site-ledger-db` current/backup snapshots without overwriting them, then exports a checksum-wrapped JSON backup.
- **Cloudflare-first QA:** regression loads `gateway/public/index.html` and `gateway/public/sw.js`; CI enforces the Cloudflare-only deployment contract on every PR/main push.
- **Storage contract remains frozen:** Cloudflare continues using localStorage `site-ledger-v1`, recovery key `site-ledger-v1-recovery`, IndexedDB `site-ledger-db` v1 / `kv`.
- **Service worker:** Cloudflare cache `site-ledger-v441-cloudflare-only-recovery-gate`; registration `sw.js?v=441`.

## v431–v440 Report Mobile Focus

- **v431 Cash truth:** monthly cash-in/out uses actual settlement dates for both AR and AP, including partial payments.
- **v432 First-scan command:** actual cash in, cash out and net cash flow appear before secondary analytics.
- **v433 Action First:** billing-link issues, open monthly bills and estimated tax obligations surface as concise monthly actions.
- **v434 Progressive disclosure:** six-month chart, expense categories, billing health, tax, project results and export tools move into foldable sections.
- **v435 Billing health:** the billing fold auto-opens when reconciliation finds linkage issues and keeps safe-repair access.
- **v436 Clear labels:** booked income/expense difference is separated from actual cash-flow net instead of presenting mixed concepts as one profit figure.
- **v437 Full capability retained:** tax detail, project performance table and Excel/PDF/CSV export remain available behind folds.
- **v438 iPhone layout:** report controls keep compact month navigation and 16px mobile inputs.
- **v439 Refresh continuity:** report fold state persists per Safari tab through `sessionStorage` only.
- **v440 Hardening:** root/gateway runtime parity, prior mobile-focus contracts and frozen accounting storage remain protected. Service-worker cache: `site-ledger-v440-report-mobile-focus`; registration: `sw.js?v=440`.

## v421–v430 Guarantee Mobile Focus

- **v421 Action buckets:** guarantee rows are classified into ≤30-day action, 31–90-day near-term, wait, missing-date and returned states.
- **v422 Action First:** guarantees due/overdue within 30 days appear above the register so return follow-up is visible before history.
- **v423 Project scope:** the guarantee page gains a compact project selector when several projects exist.
- **v424 Simpler filters:** the first-screen status strip is reduced to All / ≤30 / 31–90 / Wait / Returned; missing-date items remain a dedicated warning action.
- **v425 Compact register:** guarantee rows show type, project, holder, amount, countdown and return date without repeating full metadata in the list.
- **v426 Exact countdown:** overdue, today and future return timing use direct day-based language.
- **v427 Quick search:** longer guarantee registers support multi-token search across project, type, holder, method, location and note.
- **v428 Refresh continuity:** guarantee project scope, filter and search query persist per Safari tab through `sessionStorage` only.
- **v429 Missing-date control:** guarantees without a return date surface as an explicit action instead of disappearing inside the register.
- **v430 Hardening:** root/gateway runtime parity, prior mobile-focus contracts and frozen accounting storage remain protected. Service-worker cache: `site-ledger-v430-guarantee-mobile-focus`; registration: `sw.js?v=430`.

## v411–v420 Transaction List Mobile Focus

- **v411 Command summary first:** the full transaction register starts with compact count / receive / pay totals before the rows.
- **v412 Canonical payment status:** paid vs pending filters use true outstanding balance after settlement rows instead of the legacy `paid` flag.
- **v413 Primary filters:** transaction type and payment status remain visible as the high-frequency controls.
- **v414 Quick search:** multi-token search matches item detail, partner, category, project, note, date and amount; filtering happens in place to preserve iPhone keyboard focus.
- **v415 Progressive filters:** project, category and detail filters move under one “ตัวกรองเพิ่มเติม” disclosure that opens automatically when a secondary filter is active.
- **v416 Month grouping:** the full register is grouped by month with a safe undated bucket for faster scanning.
- **v417 True pending amounts:** pending rows and summary totals show the remaining balance after partial settlements, not the original face amount.
- **v418 One-tap reset:** an active register can clear all type/status/search/advanced filters from one action.
- **v419 Refresh continuity:** quick-search text and filter disclosure state persist per Safari tab through `sessionStorage` only.
- **v420 Hardening:** root/gateway runtime parity, prior mobile-focus contracts and frozen accounting storage remain protected. Service-worker cache: `site-ledger-v420-transaction-list-mobile-focus`; registration: `sw.js?v=420`.

## v401–v410 Project List Mobile Focus

- **v401 Status-first directory:** the project list groups work into กำลังทำ / ส่งมอบ / ปิด / ทั้งหมด, with active + waiting projects as the normal first view.
- **v402 Compact first scan:** each project card keeps only budget use, received cash and paid cash in the primary scan; the former four-column KPI grid is removed from the list view.
- **v403 Current-work default:** when current projects exist, the directory opens on active/waiting work instead of filling the screen with delivered/closed history.
- **v404 Work-order sorting:** active projects sort before waiting, delivered and closed work; active work with nearer contract end dates rises earlier.
- **v405 Attention chips:** near/overdue contract dates and outstanding AR/AP surface as short action-oriented chips without expanding the card.
- **v406 Quick project search:** multi-token search matches project name, location, client and contract number for longer project lists.
- **v407 Refresh continuity:** project status filter and search query persist per Safari tab through `sessionStorage` only.
- **v408 Three quick actions:** project cards keep exactly BOQ / + รายการ / แก้ไข, and the action grid is corrected to three equal columns.
- **v409 iPhone search:** project search filters in place to preserve keyboard focus and uses 16px mobile input sizing to prevent Safari focus zoom.
- **v410 Hardening:** root/gateway runtime parity, prior BOQ/Due/Dashboard/Add mobile-focus contracts and the frozen accounting storage contract remain protected. Service-worker cache: `site-ledger-v410-project-list-mobile-focus`; registration: `sw.js?v=410`.

## v391–v400 Add Transaction Mobile Focus

- **v391 Context project:** the center “เพิ่มรายการ” button defaults to the project currently being viewed on Dashboard, Project, BOQ or Due screens before falling back to the last project.
- **v392 Safe project switching:** changing the project clears any BOQ link that belongs to another project.
- **v393 Relevant BOQ only:** the BOQ selector appears only when the selected project actually has BOQ rows.
- **v394 Progressive details:** tax, receipt-photo attachment and note fields move under “รายละเอียดเพิ่มเติม”; the section opens automatically when optional data already exists.
- **v395 Fast due dates:** unpaid entries get one-tap +7 / +15 / +30 day choices while retaining direct date input.
- **v396 Workflow return:** after saving, users return to Home, Project, BOQ or Due when that screen launched the entry flow instead of always being sent to the full transaction list.
- **v397 iPhone keyboard:** primary add-form inputs use 16px mobile text sizing to prevent Safari focus zoom.
- **v398 Repeat entry:** “บันทึกและเพิ่มอีก” continues the same type, project, category and date.
- **v399 Non-destructive UI:** the streamlined form does not mutate accounting state until save and keeps the frozen storage contract.
- **v400 Hardening:** BOQ, Due and Dashboard mobile-focus contracts remain covered. Service-worker cache: `site-ledger-v400-add-mobile-focus`; registration: `sw.js?v=400`.

## v381–v390 Dashboard Mobile Focus

- **v381 Cash truth:** received/paid dashboard totals include partial AR/AP settlements through the canonical payment rows; outstanding cards show remaining balances.
- **v382 Action before analytics:** urgent payment/project alerts move above secondary charts so the first mobile scan prioritizes action.
- **v383 Primary finance fold:** the financial bar visualization remains available but folds below the primary KPI cards.
- **v384 Payment-date charts:** six-month cashflow follows actual settlement dates and the expense donut includes partial AP payments.
- **v385 Portfolio fold:** per-project profit cards remain available behind a compact aggregate disclosure instead of filling the dashboard.
- **v386 Recent activity:** the dashboard shows at most 8 recent rows with a direct “ดูทั้งหมด” path; full history remains in รายการทั้งหมด.
- **v387 Canonical pending filter:** the dashboard “ค้าง” view uses outstanding balance after settlements instead of legacy paid flags.
- **v388 Canonical urgent alerts:** fully settled legacy rows no longer trigger deadline warnings; alerts display the true remaining balance.
- **v389 Refresh continuity:** dashboard fold state is stored per Safari tab in `sessionStorage` only.
- **v390 Hardening:** root/gateway runtime parity, BOQ/due navigation and frozen accounting storage are regression-tested. Service-worker cache: `site-ledger-v390-dashboard-mobile-focus`; registration: `sw.js?v=390`.

## v371–v380 AR/AP Mobile Focus

- **v371 Command summary first:** the due screen starts with AR, AP and guarantee totals/counts instead of three long registers.
- **v372 Project scope:** a compact project selector scopes receivables, payables and guarantees together.
- **v373 Action First:** overdue and near-term AR/AP plus guarantees nearing return are surfaced in one short priority list above the registers.
- **v374 Progressive disclosure:** AR, AP and guarantee registers are foldable; urgent/small groups can open automatically while large routine lists stay compact.
- **v375 Missing-date visibility:** items without a due/return date are counted prominently instead of silently blending into the register.
- **v376 Partial settlements:** due rows show partial AR/AP settlement state while keeping the displayed amount equal to the true outstanding balance.
- **v377 Guarantee integration:** the current guarantee register participates in due filtering and urgent badges; legacy project retention remains supported without double counting.
- **v378 Refresh continuity:** due project scope and fold state persist per Safari tab through `sessionStorage` only.
- **v379 Canonical outstanding state:** pending lists, due status and urgent counting use outstanding balance after payments, avoiding fully settled rows that still have legacy flags.
- **v380 Hardening:** root/gateway runtime parity, frozen accounting storage contract and regression coverage preserved. Service-worker cache: `site-ledger-v380-due-mobile-focus`; registration: `sw.js?v=380`.

## v361–v370 Project Mobile Focus

- **v361 High-frequency actions first:** project top card now keeps BOQ, add transaction and edit project together; duplicate bottom actions are removed.
- **v362 Contract detail fold:** Contract Control Center remains visible, while detailed contract fields fold below it. Non-normal contract risk opens details automatically.
- **v363 Risk-aware government guidance:** government-contract AI guidance folds during normal operation and opens automatically near/past contract deadlines.
- **v364 Timeline progressive disclosure:** contract timeline shows a compact event/follow-up summary and auto-opens when letters or follow-ups need attention.
- **v365 Variation/EOT fold:** contract changes and time extensions move into a compact panel that auto-opens while a decision is pending.
- **v366 Guarantee detail fold:** guarantee register amount/count remains visible; detailed retention flow expands automatically when return is within 30 days or due.
- **v367 Cost-category fold:** detailed category/donut analytics move below a compact summary instead of occupying the primary project scan.
- **v368 Transaction-list fold:** short project lists remain open; long lists collapse behind a count/pending summary.
- **v369 Project tools fold:** Excel/PDF/business documents stay available in a dedicated compact panel instead of crowding the main project flow.
- **v370 Hardening:** risk-aware open rules are regression-tested; BOQ direct flow and frozen accounting storage are preserved. Service-worker cache: `site-ledger-v370-project-mobile-focus`; registration: `sw.js?v=370`.

## v353–v360 BOQ Mobile Productivity

- **v353 Multi-token Quick Find:** BOQ search accepts several words and matches them with AND logic across item, section/code, category, unit and note.
- **v354 Quick Clear:** a compact “ล้าง” action appears only when a BOQ query exists; clearing happens in place without adding dashboard-style clutter.
- **v355 Section summaries:** long BOQs show compact row-count and BOQ-value summaries inside section headings.
- **v356 Collapsible sections:** BOQs with 12+ rows and 2+ sections can collapse/expand sections. Collapse state is per browser tab only; active search temporarily reveals matching rows.
- **v357 Edit return anchor:** opening/editing a BOQ row remembers the row and returns the user near that item after save/close.
- **v358 Scroll continuity:** BOQ scroll/collapse/anchor state survives refresh in the same tab via `sessionStorage`; accounting storage is untouched.
- **v359 Project chooser priority:** BOQ project chooser lists dashboard-pinned projects first, then active/waiting projects, then delivered/closed projects.
- **v360 Hardening:** root/gateway runtime parity, frozen storage contract, regression coverage and service-worker bump to `site-ledger-v360-boq-mobile-productivity` / `sw.js?v=360`.
- Dedicated BOQ remains BOQ-only; Contract Control, AI contract guidance, cost analytics and reports stay out of the BOQ list.

## v352 BOQ Quick Find

- BOQ Quick Find appears only when the selected project has 12 or more BOQ rows, so small BOQs stay uncluttered.
- Search matches BOQ item name, section code, section name, category, unit and note.
- Filtering happens in-place without rebuilding the page, preserving iPhone keyboard focus and scroll position while typing.
- Section headings with no matching BOQ rows hide automatically, and a compact result count is updated live.
- The query is stored only in per-tab `sessionStorage` navigation state for refresh continuity; it never touches accounting storage.
- Search resets when switching to another BOQ project or returning to the project chooser.
- Release advanced to v352 / stable; service-worker cache `site-ledger-v352-boq-quick-find`; registration `sw.js?v=352`.
- Accounting storage identifiers remain unchanged.

## v351 Compact BOQ mobile header

- When a BOQ project is selected, the large BOQ summary area is replaced by one compact mobile header.
- The compact header shows project name, BOQ row count and BOQ total on one summary line.
- High-frequency actions are directly available: **+ รายการ**, **นำเข้าไฟล์**, and **เปลี่ยนโครงการ**.
- The project chooser retains the original add/import entry points when no project is selected.
- Removed duplicate selected-project labels such as separate “รายการ BOQ” and “มูลค่า BOQ รวม” rows to expose BOQ items sooner.
- Release advanced to v351 / stable; service-worker cache `site-ledger-v351-boq-compact-header`; registration `sw.js?v=351`.
- Accounting storage identifiers remain unchanged.

## v350 Context-aware BOQ

- The bottom BOQ tab now opens the BOQ for the project the user is currently working with.
- Priority: current project detail → selected dashboard project → last remembered BOQ project → project chooser.
- This prevents a tap on BOQ from unexpectedly opening a previously viewed project while the user is looking at another project.
- The side-drawer BOQ entry still opens the project chooser intentionally for cross-project navigation.
- Release advanced to v350 / stable; service-worker cache `site-ledger-v350-context-boq`; registration `sw.js?v=350`.
- Accounting storage identifiers remain unchanged.

## v349 Bottom navigation prioritizes BOQ

- Replaced the bottom navigation **รายการ** tab with **BOQ** because BOQ is a higher-frequency mobile workflow.
- The BOQ tab opens the dedicated BOQ screen directly and preserves the last selected BOQ project through the existing per-tab navigation state.
- **รายการทั้งหมด** remains available in the side drawer; no transaction functionality was removed.
- Bottom navigation is now: ภาพรวม / BOQ / เพิ่มรายการ / โครงการ / ค้างรับ/จ่าย.
- Release advanced to v349 / stable; service-worker cache `site-ledger-v349-bottom-nav-boq`; registration `sw.js?v=349`.
- Accounting storage identifiers remain unchanged.

## v348 BOQ direct flow

- Project list now has a direct **BOQ** action; checking BOQ no longer requires opening the full project/contract screen first.
- Project detail shows one compact BOQ shortcut at the top, before Contract Control Center, and removes the duplicate BOQ card farther down the page.
- The BOQ action always routes explicitly to the dedicated BOQ screen with the selected project preserved.
- Project list quick actions were reduced to BOQ / add transaction / edit; Excel and PDF remain in project tools instead of crowding the project list.
- Dedicated BOQ remains BOQ-only and does not render Contract Control, government-work AI guidance, contract timeline, expense analytics, or project reports.
- Release advanced to v348 / stable; service-worker cache `site-ledger-v348-boq-direct-flow`; registration `sw.js?v=348`.

## v347 Refresh stays on current page

- Stable navigation is persisted per browser tab with `sessionStorage` only; refreshing no longer sends the user back to the dashboard.
- Restores the active screen and relevant UI context: project, selected BOQ project, document list/document preview, report month, guarantee filter/project and list filter.
- Project/document references are validated after accounting data loads. If a referenced project or document was deleted, navigation falls back safely instead of rendering a broken screen.
- Transient edit/add sheets are not written into accounting storage; the accounting data contract remains unchanged.
- Release advanced to v347 / stable; service-worker cache `site-ledger-v347-refresh-route`; registration `sw.js?v=347`.

## v346 Clean BOQ

- BOQ is now a dedicated list screen: project → BOQ rows → quantity/unit → unit price → BOQ amount.
- Removed actual-cost, variance, linked-cost, forecast, early-warning and import-history analytics from the BOQ list screen.
- Project pages now show only a compact BOQ summary (row count + BOQ total) with a single “เปิดรายการ BOQ” action.
- BOQ import/add/edit remains available, while project/accounting/Owner Operations retain financial analysis responsibilities.
- Menu/title wording simplified from “BOQ / ต้นทุน” to “BOQ”.
- Release advanced to v346 / stable; service-worker cache `site-ledger-v346-clean-boq`; storage identifiers remain unchanged.

## v343–v345 iPhone dashboard / due-balance bugfix

- Dashboard pinning is now a metadata-only write and can safely reconcile a stale-tab conflict against the latest stored state without overwriting newer accounting/project data.
- A dashboard pin is reported as successful only after the pin is verified in persisted `site-ledger-v1` state; the selected project tab then opens immediately.
- Due / AR / AP rows display the positive outstanding balance instead of a debit-style minus sign. Group totals now use outstanding balances for both receivables and payables, including partial settlements.
- Release advanced to v345 / stable with service-worker cache `site-ledger-v345-mobile-bugfix` and registration `sw.js?v=345`.
- Storage keys/schema remain frozen and the main dashboard remains free of Owner Operations / diagnostics cards.

## v333–v342 Owner Operations 1.1

- Added a read-only owner action queue covering AR due/overdue, AP due/overdue, guarantees nearing return, critical/urgent project forecast risk, Bank Reconciliation, backup freshness, and Accounting Production Gate blockers.
- Added 30/60/90-day Cash Buffer with the earliest negative horizon and a read-only Daily Close status for current-day movements, Data Health, storage state, backup freshness, bank reconciliation, and accounting blockers.
- Added one Owner Operations entry in normal Settings while keeping deployment/release/host diagnostics consolidated under the v332 Advanced / System Diagnostics screen.
- Main dashboard remains clean: Owner Operations does not add a new dashboard card.
- Release advanced to v342 / stable; root and Cloudflare runtime assets are synchronized with service-worker cache `site-ledger-v342-owner-operations` and registration `sw.js?v=342`.
- Storage identifiers remain unchanged: localStorage `site-ledger-v1`, recovery `site-ledger-v1-recovery`, IndexedDB `site-ledger-db` v1 / object store `kv`.
- Added v333–v342 regression coverage while preserving the v332 mobile Settings cleanup and all prior accounting/recovery/dashboard/iPhone safeguards.

## v332 Settings cleanup / mobile operations

- Simplified the everyday Settings screen for iPhone use; deployment, host migration, release gates and origin/debug tools moved to one Advanced / System Diagnostics screen.
- Keeps OCR Local/Cloudflare choice, consent, business/accounting fields, Data Health, backup and restore in the normal Settings flow.
- Preserves v323 iPhone storage-pressure transaction-edit fix and v322 dashboard cleanup/persistence behavior.
- Storage identifiers and accounting data contracts remain unchanged. This repository remains
separate from AREA Maibab Public Website and AREA SEO AI.

## v322 Dashboard cleanup / persistence

- Removed Owner System Health, Project Forecast Control and Accounting Control Center 2.0 cards from the main dashboard; their underlying controls remain available in dedicated screens.
- Adding a project dashboard now persists the pin, verifies it after persistence, closes the manager and opens the new project tab immediately.
- Added regression coverage for dashboard cleanup and pin survival through migration/reload normalization.

## v323 iPhone edit / storage hotfix

- Audit before/after snapshots no longer duplicate receipt/photo data URLs.
- Legacy audit snapshots are compacted during migration; original transaction receipt photos remain unchanged.
- Safari quota failures are reported explicitly while fail-closed rollback preserves the previous committed state.
- Service-worker cache: `site-ledger-v323-ios-edit-storage`; registration: `sw.js?v=323`.

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

## v321 RC2 Production Candidate

- Added a frozen storage-schema contract for localStorage `site-ledger-v1`, recovery `site-ledger-v1-recovery`, IndexedDB `site-ledger-db` v1 and object store `kv`.
- RC2 Production Candidate Gate combines cutover, Disaster Recovery evidence, Document Flow Integrity, migration acceptance and production Gateway environment safety.

## v320 Disaster Recovery Certification

- Added a non-destructive certification for backup roundtrip, checksum tamper rejection, localStorage, IndexedDB, PWA update guard and stale-write protection.
- Temporary IndexedDB probes are removed immediately and no accounting data is modified by the test itself.

## v319 Cash / AR / AP / Guarantee forecast

- Executive Accounting Report now calculates cumulative 30/60/90-day cash forecasts.
- Forecasts combine current bank/cash, due AR, due AP and cash/transfer guarantees due for return.

## v318 Construction Forecast 2.0

- Project Cost now exposes BAC, Actual Cost, outstanding commitment exposure, ETC, EAC, Profit-at-Completion, completion margin, cost variance and budget utilization.
- Project export columns were upgraded to the same forecast model.

## v317 Document Flow Integrity 2.0

- Added Quote → Bill → Receipt → Payment lineage checks for missing sources, cross-project links, impossible date order, payment linkage and receipt-vs-paid reconciliation.
- Blocking document-flow issues are part of Accounting Production Gate; non-destructive source amount differences are warnings.

## v316 actionable Month-End

- Month-End Checklist items now open the relevant Data Health, Trial Balance, Statements, Bank, Tax/Document, Control Center or Backup surface directly.

## v315 OCR production control

- OCR result auto-fill now requires a confidence threshold based on detected amount, total label, merchant/category detail and text evidence.
- Single and batch expense entry reject duplicate receipt-image fingerprints before creating new transactions.

## v314 Migration Acceptance Certificate

- Completed cross-origin restore now records source revision, summary and source/target business-data digests.
- A certificate surface verifies the current target digest and collection counts after migration.

## v313 Staging / Production Gateway safety

- Gateway endpoints are classified as local, staging, production or external.
- A production Workers app cannot activate Remote OCR consent against a staging Gateway; switching environments always revokes consent.

## v312 Deployment Control Center

- Added one runtime status surface for app version, Service Worker availability, `/health`, `/ready`, Gateway identity/components, endpoint and live-evidence timestamp.

## v311 RC1 cutover gate

- Release Readiness is now RC1 / v311 and a separate Cutover Gate requires fresh Reliability evidence plus fresh Cloudflare live acceptance when running on Workers or using the Gateway.
- Cross-origin restores must carry a matched migration receipt before production cutover is considered ready.

## v310 Reliability self-check

- Added non-destructive localStorage, IndexedDB, PWA update-guard and stale-write-guard checks.
- Reliability evidence is timestamped and valid for 24 hours; the temporary IndexedDB probe is deleted immediately.

## v309 Guarantee / Retention 30/60/90 control

- Guarantee register now groups open exposure into due/overdue, 1–30, 31–60 and 61–90 day buckets with counts and amounts.

## v308 Project Forecast control

- Project Cost now exposes ETC/EAC/profit-at-completion in the UI.
- Dashboard flags BOQ overrun, negative/low completion margin, high BOQ usage and materially unlinked cost.

## v307 Tax / Document Register

- Added internal sales/purchase tax-document registers and an Accounting Excel sheet.
- The register is explicitly management support, not an automatic statutory filing.

## v306 Month-End Close Checklist

- Period close now has a visible checklist for Data Health, Trial Balance, Financial Statements, Bank, Tax/Documents, AR, AP and backup freshness.
- A failed close opens the checklist instead of only showing a generic blocker count.

## v305 Bank Reconciliation fingerprint

- Reconciliation freshness now uses a deterministic bank-book fingerprint for the selected period.
- Future-period transactions no longer make a prior period stale when its bank-book inputs are unchanged.

## v304 privacy-safe OCR diagnostics

- Remote OCR stores request ID, duration, status and endpoint evidence only.
- It never stores receipt images, OCR text, amounts or partner names in diagnostics.

## v303 Migration Drill

- Restore screen can validate backup integrity, state health, collection counts and a deterministic business-data digest without changing current data.
- Completed restores save a source/target digest receipt for cutover verification.

## v302 Cloudflare live acceptance evidence

- Cloudflare smoke checks now save non-document live evidence for `/health` and `/ready`.
- Evidence is bound to the exact Gateway base and expires after 24 hours for cutover purposes.

## v301 Release readiness gate

- Added a versioned Release Readiness gate combining storage safety, backup freshness, accounting production checks, document-number integrity and Gateway mode.
- Owner Settings and dashboard expose the gate without changing accounting records.

## v300 Owner system health

- Added an Owner System Health dashboard for Storage, Backup, Accounting and Gateway status.
- The card summarizes blockers without silently repairing or mutating data.

## v299 document-number integrity

- Document numbering now scans existing monthly numbers before generating the next number and skips collisions.
- Quote/bill/receipt saves reject duplicate document numbers; Accounting Production Gate reports duplicate-number groups.

## v298 project cost-to-complete

- Project Cost Accounting now exposes ETC proxy, EAC proxy, profit/margin at completion and budget overrun.
- These are management proxies based on the current BOQ budget and recorded actual cost, not automatic statutory WIP recognition.

## v297 Bank Reconciliation revision checkpoint

- Bank reconciliations carry a post-save data revision and transaction-count checkpoint.
- A reconciliation becomes stale when accounting data changes afterward; duplicate reconciliation signatures are rejected.

## v296 period-close bank gate

- A period with bank activity cannot pass Accounting Production Gate without Bank Reconciliation.
- Period close remains blocked until the bank gate and the existing accounting invariants pass.

## v295 Remote OCR response binding

- Remote OCR responses must echo gateway protocol v1 and the exact AREA request ID before extracted data is accepted.
- Header mismatch fails closed into the existing Local OCR fallback path.

## v294 restore replay / origin guard

- Restore records a non-sensitive fingerprint, source origin and restore timestamp.
- Repeating the same restore requires explicit confirmation and cross-origin migration is shown before replacement.

## v293 backup integrity checksum

- Backup envelope advanced to format 2 with a deterministic integrity checksum over the exported state.
- Restore remains backward-compatible with raw/format-1 backups; format-2 corruption or alteration is rejected before migration.

## v292 Cloudflare live smoke check

- Settings can run a non-document Cloudflare smoke test against both `/health` and `/ready`.
- The check requires the same Gateway base and never sends receipt images.

## v291 Gateway readiness identity pin

- Remote OCR readiness now accepts only the expected `area-ledger-ai-gateway` service on protocol v1.
- `/ready` must explicitly report both `providerConfigured:true` and `durableState:true` in addition to `ok:true`; a generic or spoofed `{ok:true}` endpoint no longer enables document upload.
- Settings now distinguishes identity/protocol mismatch from missing provider secret or Durable Object readiness.
- Service-worker cache advanced to v291 and Worker deployment assets remain byte-synchronized with the root runtime.

## v290 Remote OCR consent binding

- Remote OCR consent is now bound to the exact normalized Gateway base that passed `/ready`; changing the endpoint invalidates consent before any image can be sent.
- Switching back to Local OCR revokes remote consent, and selecting a different staging/current-host Gateway requires readiness + consent again.
- Legacy v289 consent without a bound Gateway base migrates fail-closed and must be re-confirmed once; existing accounting/storage data is untouched.
- Gateway endpoint validation now happens before Settings state is mutated, and readiness completion is rejected if the Gateway changed while the check was in flight.
- Service-worker cache advanced to v290 and Worker deployment assets stay synchronized with root runtime assets.

## v289 Remote OCR readiness gate

- Enabling Remote OCR is now fail-closed: the app performs a non-document `GET /ready` check before consent can become active.
- Missing Gemini secret, Durable Object readiness failure or network/readiness errors keep Remote OCR disabled; no receipt image is transmitted during the readiness check.
- Disabling Remote OCR remains immediate and falls back to local OCR.
- Service-worker cache advanced to v289 and Worker deployment assets stay synchronized with root runtime assets.

## v288 Cloudflare first-run cutover UX

- Fresh `*.workers.dev` installs with no projects/transactions/BOQ now show an explicit migration notice before normal use.
- The notice offers direct `.json` restore or an explicit “start new on Cloudflare” dismissal; it never copies, deletes or rewrites old-host data automatically.
- Dismissing the notice is metadata-only and does not advance the backup revision gate.
- Service-worker cache advanced to v288 and Worker deployment assets are synchronized to the same root blobs.

## v287 migration gate QA fixture correction

- Corrected the v286 regression fixture: `reset()` intentionally contains sample projects, so a missing backup must be treated as stale/not-ready rather than as an empty-state exception.
- Runtime migration safety behavior is unchanged; the Cloudflare v286 deployment already passed Workers Build.

## v286 host migration safety gate

- Added monotonic `dataRevision` metadata: normal successful writes advance the revision while backup-status metadata writes use `persist({metaOnly:true})` and do not.
- Successful file/copy backups record `lastBackupRevision`; any subsequent data write makes the backup visibly stale until a new backup is created.
- Backup files now use versioned `{backupFormat:1, exportedAt, sourceOrigin, dataRevision, state}` envelopes while restore stays compatible with legacy raw-state JSON.
- Added Host Migration Safety in Settings: Data Health, storage conflict/mirror/read state, backup revision freshness and an explicit ready/not-ready gate.
- A restored backup becomes a fresh migration checkpoint on the destination origin; no old-host data is deleted automatically.
- Service-worker cache advanced to v286; deployment snapshot remains synchronized with root runtime assets.

## v285 host migration backup / restore

- Added direct `.json` restore from iPhone Files/iCloud with a 20 MiB guard, schema/migration validation and a preview of project/transaction/BOQ counts before replacement.
- Existing paste-based restore remains supported, and future `{backupFormat:1,state:...}` envelopes are accepted without breaking legacy raw-state backups.
- Restore remains non-destructive until validation passes and still requires a second confirmation when current project/transaction data exists.
- `lastBackup` is now updated only after the share/download flow reports success; cancelling the iOS Share Sheet no longer falsely records a successful backup.
- Backup/restore sheets now show source/destination origins to make host migration explicit.
- Service-worker cache advanced to v285; deployment snapshot stays byte-identical to root assets.

## v284 gateway fail-closed provider hardening

- Staging and default Worker configs now require Durable Object rate state; a missing binding returns `DURABLE_STATE_REQUIRED` / HTTP 503 instead of silently falling back to per-isolate memory.
- Generic provider URLs are HTTPS-only and reject credentials, query strings and fragments to reduce SSRF/misconfiguration risk.
- Provider JSON responses are capped at 256 KiB before parsing; oversized or malformed responses are rejected with stable gateway errors.
- Added runtime/contract coverage for the fail-closed state requirement and response/URL guards.

## v283 gateway QA state isolation

- Fixed the v282 readiness regression so it validates the immutable `emptyState()` consent default instead of inheriting mutable `S.ai` state from an earlier endpoint-safety test.
- Runtime behavior is unchanged; Cloudflare v282 deployment already passed Workers Build.

## v282 same-origin gateway readiness

- Same-host AREA Ledger requests are accepted by the gateway without requiring an `ALLOWED_ORIGINS` dashboard variable; external origins still require the exact allowlist.
- `/ready` now treats provider + Durable Object as the runtime readiness gate and reports `sameOriginAllowed` plus the count of explicitly configured external origins.
- Gateway Control Center now selects the current Workers host automatically, can test `/ready` in-app, and explains the remaining setup condition without exposing secrets.
- Remote OCR consent remains explicit and off by default; readiness checks never transmit document images.
- Service-worker cache advanced to v282 and the Worker deployment snapshot is synchronized to the same root asset blobs.

## v281 deterministic Worker static asset bundle

- Moved Worker Static Assets to `gateway/public/`, avoiding parent-directory asset resolution in Git-connected Workers Builds.
- Deployment assets are pinned to the exact same Git blobs as root `index.html`, service worker, manifest, icons, logo and `_headers`.
- Gateway contract QA now compares deployment assets byte-for-byte against root runtime assets, preventing drift while keeping the repository root as the source of truth.
- Legacy `_redirects` remains outside the Worker bundle because SPA fallback is handled by Workers Static Assets.

## v280 Cloudflare static asset redirect compatibility

- Excluded the legacy root `_redirects` file from Worker Static Assets because SPA fallback is already provided by `assets.not_found_handling = "single-page-application"`.
- This avoids duplicate `/* -> /index.html 200` rewrite processing and Wrangler redirect-loop validation while retaining `_redirects` in the repository for other static hosts.
- No accounting logic, storage keys, API routes or browser state changed.

## v279 unified Cloudflare app + API staging

- Added Workers Static Assets to the existing staging Worker so the same `workers.dev` host serves the full AREA Ledger PWA at `/` while `/health`, `/ready` and `/v1/*` execute the API Worker first.
- Added SPA fallback so navigation routes resolve to `index.html` while API routes remain isolated.
- Added `.assetsignore` protection so GitHub workflows, tests, gateway source, QA docs, README and legacy ZIP are not published as browser assets.
- Added `/ready`: returns HTTP 200 only when provider, Durable Object and at least one exact allowed origin are configured; otherwise 503 with non-secret readiness metadata.
- Fixed Node QA browser emulation to expose the standard `URL` API used by the hardened v278 endpoint parser.

## v278 Gateway Control Center

- Added owner Settings controls for Local/Cloudflare OCR mode, gateway endpoint, bounded timeout and explicit Remote OCR consent.
- Added one-tap staging endpoint setup, current `location.origin` display/copy and a direct `/health` opener so Cloudflare `ALLOWED_ORIGINS` can be configured without guessing the browser origin.
- Hardened browser gateway URL parsing: HTTPS (or localhost HTTP) only, with credentials/query/hash rejected before any remote OCR request.
- Remote OCR remains opt-in and local OCR remains the backward-compatible default; no API secret is stored in browser state.

## v277 Cloudflare runtime variable persistence

- Added top-level `keep_vars=true` so exact dashboard runtime values such as staging `ALLOWED_ORIGINS` survive future Git-triggered Wrangler deployments.
- Worker secrets remain server-side and are preserved independently by Cloudflare deploys.
- Added contract QA for this deployment invariant.

## v276 Gemini gateway adapter

- Added a direct server-side Gemini multimodal OCR adapter using `x-goog-api-key`, image `inline_data`, JSON response mode and a configurable `GEMINI_MODEL`.
- Staging now selects `OCR_PROVIDER=gemini` with `GEMINI_MODEL=gemini-2.5-flash`; the browser still receives only the provider-neutral expense OCR contract and never receives the API key.
- Generic upstream adapter remains available for future providers. Health readiness now understands both generic and Gemini configuration.
- Added runtime QA that validates the Gemini request envelope and sanitized expense response without sending any external request.

## v275 gateway contract QA hardening

- Reworked Gateway Contract QA to validate route/origin/protocol/storage semantics with whitespace-insensitive patterns instead of brittle source-format matches.
- Main regression suite already passes 101 groups on the preceding build; this change does not alter application or gateway runtime behavior.

## v274 storage QA alignment

- Updated the storage-compatibility regression to validate the actual long-lived identifiers: localStorage `site-ledger-v1`, recovery key, IndexedDB `IDB_NAME=site-ledger-db`, version 1 and object store `kv` through the current `idbOpen()` implementation.
- No storage identifier, IndexedDB schema or application behavior changed.

## v273 Cloudflare QA alignment

- Updated the period-close regression assertion to validate the canonical `accountingProductionGate()` path introduced by the hardened accounting releases, instead of obsolete pre-gate `hp.ok` / `tb2.ok` source checks.
- No accounting behavior, data, storage schema or Worker runtime configuration changed.

## v272 Cloudflare build gate fix

- Updated stale service-worker version assertions in the regression suite to the current v271 registration so Release QA validates the actual deployed source instead of historical v263/v267 markers.
- No accounting logic, storage key, IndexedDB schema, gateway contract or runtime settings changed in this release.

## v271 Cloudflare runtime compatibility

- Removed unsupported Durable Object `expirationTtl` write options; rate/idempotency state now uses Durable Object alarms for bounded cleanup.
- CORS OPTIONS responses now emit a bodyless HTTP 204 response.
- Provider aborts normalize to `PROVIDER_TIMEOUT` / HTTP 504.
- Browser gateway payload ceiling now matches the Worker at 3 MiB to avoid predictable remote 413/fallback mismatches.
- This commit is intended to trigger the first connected Cloudflare Workers Build for the staging Worker.

## v270 Cloudflare staging readiness

- Updated Worker compatibility date and Durable Object lifecycle to Cloudflare's current declarative `exports` configuration for a new SQLite-backed namespace.
- Added a fully separate `staging` Wrangler environment with conservative rate/retry settings; production routes/custom domains remain absent.
- Added `workflow_dispatch` to Release QA for explicit manual verification in addition to push/PR triggers.
- Added secret-safe `.gitignore` / local env template, staging runbook, acceptance checklist and rollback procedure.
- Source is now ready for Cloudflare staging deployment once the account is authenticated and the external staging origin/upstream/API secret are supplied. No production cutover is included.

## v269 Worker runtime / durable state preflight

- Implemented `GatewayState` Durable Object routes for rate limiting and idempotency with expiring SQLite-backed storage.
- Added Worker runtime QA that executes health, origin denial, OCR success/idempotent replay, Durable Object rate limit and idempotency behavior under Node Web APIs.
- Added staging preflight checks for Durable Object binding/migration and to ensure production origins/upstream URL/API key remain external configuration rather than committed values.
- Release QA now includes contract, runtime and staging-preflight gateway checks.
- No Cloudflare deployment, DNS cutover or production secret configuration is performed by this version.

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
