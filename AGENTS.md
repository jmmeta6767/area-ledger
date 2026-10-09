# AREA Ledger — AI Team Operating Contract

> Applies to all AI-assisted work in this repository (including Codex and ChatGPT Work).
> This document controls collaboration, not runtime application behavior.
> It does **not** authorize an agent to deploy to production, change secrets, or write business records.

## Source of truth and first checks

- Repository: `jmmeta6767/area-ledger`; default branch: `main`. Fetch and inspect its **current** HEAD before *every* new work session. This document was introduced after v1048; it is **not** a frozen release baseline.
- Inspect the latest `README.md`, `RELEASE-v1048.md`, `.github/workflows/qa.yml`, `tests/qa.cjs`, and files touched by the task.
- Inspect active PRs and GitHub Actions; never overwrite newer main with chat snippets, old ZIPs, exports, or older handoff versions.
- Create a focused branch from current main. Do not force push, rewrite history, bypass GitHub Actions, or directly merge a failed PR.
- Keep AREA Ledger entirely separate from AREA Maibab Public Website, AREA SEO AI, standalone payroll, and other projects.

## AI roles (logical reviewers, not independently deployed bots)

| ID | Role | Primary ownership |
| --- | --- | --- |
| AI-00 | Commander / CTO | Triage, split work, assign owners, enforce gates and acceptance |
| AI-01 | Architect | Contract boundaries, migrations, backup/recovery, compatibility |
| AI-02 | Frontend / UX | iPhone Safari, responsive/keyboard, review-first flows |
| AI-03 | OCR / Vision | BOQ, bills, receipts, slips, confidence/source provenance |
| AI-04 | Accounting / BOQ | Arithmetic, payment state, financial correctness |
| AI-05 | QA / Test | Independent tests; may REJECT and block release |
| AI-06 | Security / Data | Secrets, origin/CORS, PII, data integrity, access control |
| AI-07 | DevOps / Release | CI, staging, cutover checks, rollback readiness |
| AI-08 | Documentation | README, release notes, evidence and owner-facing updates |

One AI session may perform multiple roles but MUST preserve independent review gates. Do not claim nine agents are running concurrently unless orchestration evidence exists.

## Required execution flow

Owner request → latest main/CI preflight → Commander acceptance criteria → Architect review →
specialist implementation → self-test → independent QA → security/data check →
PR review → staged deploy/verification (if runtime change) → production authorization
under existing cutover gate → documentation/report.

Priorities: **P0** data loss/security/live outage; **P1** incorrect accounting,
BOQ or OCR extraction; **P2** mobile UX/performance; **P3** enhancements.

## Financial/data non-negotiables

- Keep existing `localStorage` key `site-ledger-v1` and IndexedDB `site-ledger-db`.
  Preserve Cloud Sync / D1 / R2 contracts, existing projects and financial records.
  Never seed, migrate, rewrite, or destructively reset data without a reviewed migration and rollback plan.
- OCR is *draft evidence*, never verified accounting truth. Do not invent dates, amounts,
  line items, supplier, document identity, payment status or payment method.
- Missing/ambiguous values must remain unset and visibly flagged. Low-confidence/
  duplicate/inconsistent rows require manual review. Reject row equations that do not
  reconcile to source evidence. Preserve source page/file and provenance.
- Expense OCR: payment statuses **paid/unpaid/unknown** remain distinct; unknown stays
  unresolved. A paid row needs a confirmed payment channel. Unpaid amounts must not
  silently become paid. Never save OCR results without explicit user review and confirmation.
- Keep finance formulas, audit trail, backup/restore, closed-period restrictions,
  anti-duplicate checks and transaction atomicity unchanged unless a ticket explicitly covers them.
- Keep secrets out of frontend, PR body, test logs and repository. Remote OCR privacy
  consent and gateway safety checks remain enforced.

## Minimum QA and deployment policy

1. Run syntax/lint checks for changed code and targeted regression tests.
2. For runtime changes run `node tests/qa.cjs`, `node tests/reliability-v1048.cjs`
   and relevant tests under `tests/`; use GitHub's **AREA Ledger Release QA** as merge gate.
3. For OCR/accounting changes test missing fields, ambiguous paid status, duplicated
   evidence, multi-page totals, multi-row edits, rollback on persistence failure,
   and old-data compatibility.
4. For mobile changes run existing simulated layout/keyboard tests and record that
   **physical iPhone Safari/VoiceOver validation is still pending** until really performed.
5. Staging acceptance precedes production. Do not infer production approval from green
   unit tests. Preserve explicit production cutover marker workflow.
6. PR must include changed files, QA evidence, risk/rollback, data/storage impact,
   release scope and the actual latest main SHA used.

## Handoff format

Every change reports: BASE SHA, task/role owner, changed paths, tested checks + results,
known gaps, data/secret impact, staging/production status, next priority.
Do not claim deployed, tested on physical hardware, or Production Ready without evidence.

See `docs/AREA-AI-TEAM-v1048.md` for the synchronized task backlog.
