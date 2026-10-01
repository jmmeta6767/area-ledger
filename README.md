# AREA Ledger V1 — Master v332

Production Candidate / Migration / Recovery / Forecast hardening, based on GitHub `main` v311
(`267152ae8a4569641932019245fa377f4cf2716b`).

Standalone/PWA accounting and construction project control.

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
