# Codex latest development sync — 2026-10-09

Repository: `jmmeta6767/area-ledger`
Source of truth: GitHub `main`, not archived chats, ZIPs, or old handoff versions.
Last verified main SHA: `c74de3937bc5c43390d2e69d2a135dee48e1855b`
Latest release baseline: **v1048**.

> Verify `main` SHA and PRs again before implementing any task. This file is a snapshot of verified GitHub activity and does not claim access to Codex's private in-progress sessions.

## Verified Codex pull requests (newest first)

- **#136**, `codex/close-v1048-cutover`: merged 2026-10-09, removes the one-time Production cutover marker after live acceptance. Main SHA: `c74de3937bc5...`.
- **#135**, `codex/authorize-v1048-cutover`: merged 2026-10-09, one-time cutover authorization after staging acceptance, intentionally removed by #136.
- **#134**, `codex/reliability-seven`: merged 2026-10-09, preserves OCR payment statuses and enhances mobile/pilot reliability. Main code SHA from merge: `fc211b9f88ed41023896fb7c4881e6b5b06e61de`.
- **#133**, `codex/legacy-shell-cache`: merged 2026-10-08, avoids stale app shells at the `g` origin for installed PWA.
- **#132**, `codex/staging-app-shell-cache`: merged 2026-10-08, marks app shell no-store to prevent stale edge caching.
- **#131**, `codex/transaction-report-mobile-ocr`: merged 2026-10-07, mobile transaction-report cards and OCR headers flagged for review.
- **#130**, `codex/expense-ocr-review`: merged 2026-10-07, OCR payee-header and iPhone PWA refresh fixes.

PR links: https://github.com/jmmeta6767/area-ledger/pulls?q=is%3Apr+is%3Aclosed+codex

## Adopted code contracts

1. OCR source documents are evidence, **not automatically accepted accounting data**.
2. Paid, unpaid and ambiguous/unknown payment states remain distinct. Unknown state must be reviewed; paid entries require confirmed channel; missing dates remain empty until a user corrects them.
3. OCR review is explicit and source-linked. A batch must fail closed for invalid financial facts, maintain evidence and audit fields, and rollback on persistence failure.
4. BOQ retains source file/page, row quantity-price checks, per-page totals and grand-total reconciliation; never synthesize missing source values.
5. iPhone Safari long-lived PWA should preserve scroll/focus, forbid unsafe reload during edits, and display actual source/build version.
6. Storage keys remain `site-ledger-v1` and `site-ledger-db`; protect Cloud Sync, D1, R2, backups, financial formulas and project data.
7. Keep GitHub staging acceptance and explicit production cutover separate from QA-only success. A completed one-time production marker is not standing permission for later deploys.

## Verified baseline checks

At snapshot time the latest main's **AREA Ledger Release QA**, **Staging Auto Deploy**, and **Production Cutover v805** GitHub Actions had conclusion `success`.
The v1048 Release note reports existing QA regressions and browser simulations; **physical iPhone/Safari/VoiceOver and live provider OCR accuracy were not certified**.

## AI Team handoff

- AI-00: treat main as truth; don't duplicate existing features; triage Sprint 02.
- AI-01: preserve schema, backups, migration boundaries and shared data contracts.
- AI-02: check physical iPhone/PWA behavior, mobile review and reload flow.
- AI-03: generate redacted source-to-output OCR acceptance evidence.
- AI-04: ensure amounts, statuses, withholding/VAT and BOQ maths pass.
- AI-05: independently challenge acceptance results and reject failing PRs.
- AI-06: verify gateway, remote OCR consent and secrets stay protected.
- AI-07: verify CI, staging, release authorization and production cutover.
- AI-08: update release notes with precise code SHA, tests and outstanding gaps.

Next work item: https://github.com/jmmeta6767/area-ledger/issues/138
AI Team governance PR: https://github.com/jmmeta6767/area-ledger/pull/137

**Status:** Codex GitHub updates reviewed; team policy and backlog proposed on a separate PR. No runtime change/deploy is authorized by this document.
