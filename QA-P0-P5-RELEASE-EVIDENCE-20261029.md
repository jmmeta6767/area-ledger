# AREA Ledger P0–P5 execution and release evidence — 2026-10-29

**Release status: HOLD / Production authorization CLOSED.** This file is an evidence index only. It does not authorize deployment.

## Current source of truth and P0 security
- Original production-tested main: `5f9f79c7d4d494c78825edd3e7c42f56cf692667` (2026-10-28).
- P0 closure main: `4c800300303e4bc314bcfb3bf113ed29e7d1fdb5` (one-time marker `.github/production-cutover-v805` deleted; no accounting or cloud data modified).
- Main Staging Auto Deploy workflow #40814824935: success.
- Main Production Cutover workflow #40814933984: workflow-level success **but deploy-production job SKIPPED**, so **NO NEW PRODUCTION DEPLOY** after P0 marker closure. Do not confuse job skip with production release.
- Previous Production Cutover #40707860656 from 2026-10-28: deploy-production success, live acceptance success for the earlier `5f9f79c...` SHA.
- Read-only observer PR #250 proposes a separate outcome report; do not alter the protected cutover logic.

## Branch/PR inventory (all independently branched from P0-closed main)
| Phase | PR | Content | Acceptance |
| --- | --- | --- | --- |
| P0 | #250 | Read-only production outcome observer | Exact-head Release QA, PR Staging; observer summary in later cutover |
| P1 | #246 | Aggregate-only receipt placement and staging audit | Synthetic privacy plus exact-head QA; physical iPhone quota and readback separately |
| P1 | #247 | Read-only backup integrity tests in CI | Synthetic backup tests; real ledger/Drive reconciliation not inferred |
| P2 | #248 | Negative-path OAuth redirect/expired state tests | Synthetic; actual Google secret configuration and OAuth consent separate |
| P3 | #249 | OCR/voice batch storage regression in required CI workflows | Exact-head CI, human review, no automatic posting |
| P4 | #251 | Physical iPhone Safari acceptance checklist | REAL iPhone evidence required; Chromium does not count as device |
| P5 | this PR | Release evidence and fail-closed acceptance | Do not merge or deploy while blockers remain |

**Note:** Historic draft PRs #232 #238 #239 #240 #241 #242 #245 were built on earlier main; check overlaps and actual head checks before closing or replacing. Never merge unreviewed old refs.

## P1 real private backup boundary
- Owner's protected Google Drive folder `AREA Ledger Backups` contains 2026-10-22 JSON, safe ZIP and separate receipt evidence ZIP.
- 2026-10-22 structural verification: 6 projects, 96 transactions, 32 BOQ, 6 guarantees, 12 embedded receipt images; stored checksum matches. This is NOT a 2026-10-29 snapshot nor a proof of current Cloud Ledger balance.
- A reference-only in-memory simulation estimated 93.34% less ledger UTF-16 size, but **did not move, modify or delete any real photos**.
- Before real offload: portable backup + local IndexedDB copy + remote R2 byte readback + stable ledger revision + rollback + physical device quota tests. No blind restore or localStorage clear.

## P2 Google OAuth
- Production and Staging deploy logs from 2026-10-28 explicitly reported: `Google Workspace secrets not configured; integration remains disabled.`
- Connected ChatGPT Google Drive is separate from in-app AREA Ledger OAuth. Do not claim live sync is enabled until actual credentials and callback are verified through approved secret workflow.
- No secrets or private OAuth tokens are committed here.

## P3 financial and OCR correctness
- Previous main Release QA #40707151531 passed 624 synthetic QA groups plus additional OCR, payroll, BOQ, cloud ledger and iPhone emulation tests.
- #249 adds existing review and batch persistence suites as release blockers; full exact-head checks must pass before merge.
- Real 6-project balances, contractor AP examples, actual tax documents and end-to-end OCR with owner confirmation remain separate from synthetic tests.

## P4 physical device
- No physical iPhone Safari/PWA test was executed by this work. #251 records required tests for Thai keyboard/microphone, reload/offline, receipt quotas, print, project totals and evidence retention.
- #232 historic version-wording code patch cannot be blindly copied because the app shell and tests have drifted; rebase against latest main with conflict resolution and device QA first.

## P5 evidence checklist (all must be met for release)
- [ ] Branch head still exactly matches reviewed SHA and current main; no conflicting PR workflow edits.
- [ ] Release QA success for exact SHA, including accounting, OCR, payroll, backups, Google OAuth negative paths and iPhone browser QA.
- [ ] PR Staging Acceptance success for exact SHA, Cloudflare deploy identity and isolated data.
- [ ] External Workers Builds status separately inspected, including #140 blocker and failing jobs, not conflated with GitHub Actions.
- [ ] Current production origin and deployed build SHA checked live; approved D1/R2 binding separation and reconciliation.
- [ ] Current-device private JSON/receipts checksum backed up and reconciled with real Cloud ledger and all six projects.
- [ ] Real Google Workspace OAuth configuration plus non-destructive Sheets/Drive sync accepted.
- [ ] Physical iPhone Safari/PWA accepts storage, keyboard, audio/OCR, offline and recovery.
- [ ] Explicit new one-time production release authorization **only after all conditions**; run QA on reviewed source and capture live acceptance evidence.
- [ ] Post-release remove one-time authorization marker and verify subsequent deploy-production is SKIPPED.

**Do not merge PRs, create new production authorization marker, or restore any owner ledger based on this report alone.** Revalidate evidence immediately before every acceptance decision.
