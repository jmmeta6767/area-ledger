# AREA AI TEAM — v1048 Current-Main Continuation

**Origin:** Recovered AREA AI TEAM v1 / Sprint 01 (original target: AREA Ledger V5).
**Current verified baseline when this plan was drafted:** `c74de3937bc5c43390d2e69d2a135dee48e1855b` (2026-10-09).
**Rule:** Always re-check `main`; this SHA is historical evidence, not a future implementation baseline.
**Scope:** `jmmeta6767/area-ledger` ONLY.

## What already exists in main; do not rebuild

- v1048 OCR payment review and pilot reliability: explicit paid/unpaid review,
  unknown status remains blocked, absent date/payment channel fails closed, and
  multi-row review retains evidence and audit provenance.
- Scanned multi-page BOQ: source page/file provenance, visible-amount equation
  verification and page/document total reconciliation; human preview/confirmation.
- iPhone/PWA mobile layouts, keyboard/scroll simulations, guarded reload, staging
  workflows and production cutover safety gate.
- Source identity on main, verified GitHub Actions at baseline: Release QA,
  Staging Auto Deploy, Production Cutover all passed.
- v1048 release note is clear that real iPhone/Safari/VoiceOver device acceptance
  and live OCR-provider recognition accuracy were **not** certified by those tests.

## Execution model

Nine logical roles AI-00 through AI-08 are described in root `AGENTS.md`.
Owner remains sole authority for final financial correctness and irreversible
production decisions. Specialists propose changes; QA may veto.

## Next safe sprint (AI Team Sprint 02)

| Order | Owner(s) | Deliverable / acceptance | Risk |
| --- | --- | --- | --- |
| S02-01 | AI-00 / AI-01 | Audit current main, open PRs, CI, runtime, data contracts; write exact baseline | P0 preflight |
| S02-02 | AI-03 / AI-04 | BOQ + multi-expense OCR acceptance matrix using real owner-approved **redacted** sample files; compare source lines/pages/totals; never infer blank fields | P1 |
| S02-03 | AI-04 / AI-05 | Regression for mixed paid/unpaid/unknown, missing date/channel, duplicate evidence, closed period and atomic failure rollback | P1 |
| S02-04 | AI-02 / AI-05 | Physical iPhone Safari PWA test protocol and evidence: install, reload, keyboard, long list, scroll, portrait/landscape, VoiceOver | P1/P2 |
| S02-05 | AI-06 / AI-01 | Review OCR consent, gateway timeout/CORS/size limits, API key handling, safe error messages, backup/recovery contracts | P0/P1 |
| S02-06 | AI-07 / AI-05 | Run targeted tests and full GitHub Release QA; staging acceptance where applicable; check production gate unchanged | Release |
| S02-07 | AI-08 / AI-00 | Update release notes with actual checks, unresolved gaps and precise deployment status | Docs |

### Definition of done

- Task branch starts from the GitHub `main` current at start; relevant diffs reviewed.
- Tests reproduce the bug before fix when possible, then pass with fix.
- Neither old-data storage keys nor D1/R2/Cloud Sync contracts are silently changed.
- No secret, private bill image or real financial record is committed to GitHub.
- User confirms OCR/accounting imports before they are saved.
- CI and deployment statuses are linked and reported separately; staging success
  is never falsely reported as physical-device signoff or as a new production release.

### Work intake template

```text
AREA AI TEAM TASK
Repository: jmmeta6767/area-ledger
Source of truth: latest main, record SHA
Priority: P0 / P1 / P2 / P3
Observed behavior and source evidence:
Expected behavior / acceptance criteria:
Affected data contracts:
AI-00 triage -> AI-01 design -> specialists -> AI-05 QA -> AI-06 security
-> AI-07 release -> AI-08 report
Must not touch unrelated repositories; require human review for all financial saves.
```

## First implementation cycle

Start with **S02-02 and S02-03** only after current-main audit. The goal is stronger
OCR **acceptance evidence**, not a second competing OCR pipeline. The first change
must be a narrowly scoped PR with input fixtures stripped of personal information,
a deterministic expected-results manifest and human-review/atomic-save regressions.
If genuine samples are unavailable, use clearly labeled synthetic fixtures and
record that provider accuracy remains unverified. Do not claim extraction quality
based solely on synthetic inputs.

## Versioning / deployment

This document adds coordination policy only: it does not alter running UI, AI
models, data, production code, billing, secrets or deployment configuration.
Updating the team procedure is not evidence that Sprint 02 functionality is done.
