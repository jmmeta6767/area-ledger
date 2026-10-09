# AREA AI TEAM — Control Plane Sprint 03–06 (staged, read-only)

**Source-of-truth preflight:** `jmmeta6767/area-ledger` `main`. Historical starting SHA `c74de3937bc5c43390d2e69d2a135dee48e1855b` (v1048). Fetch latest main again before every new task.

This is a standalone reviewable **control plane prototype** for Execution Queue tasks 4–6, not a nine-agent autonomous runtime. No modifications to running AREA Ledger app files or financial data.

## Done in code

1. **Task Queue / Codex Handoff draft:** `issueQueueItem()` and `handoff()` generate an explicit specialist/QA checklist using verified GitHub issue ID, a checked base SHA and a reviewed triage plan. The handoff is marked `READY_FOR_HUMAN_DISPATCH` or `NEEDS_TRIAGE`; `codexExecution` always remains `NOT_STARTED`. No Codex connector is invented or executed.
2. **Independent PR review:** `reviewPullRequest()` checks PR status, exact main-base SHA, core regression/iPhone checks, external Workers Builds result, runtime file categories, and sensitive release/identity files. Unknown/failed checks **block**. Even green tests require independent human QA/security signoff; the module never issues merge credentials.
3. **Dashboard:** `dashboard()` produces a sanitized Markdown task table. A manual, read-only GitHub Actions `workflow_dispatch` can inspect a PR and write its release status to the run Summary. No external SaaS dashboard/deployment is claimed.
4. **Production decision support:** `releaseDecision()` checks PR findings, exact-SHA staging acceptance and owner authorization. It never executes a production deployment or authorizes a cutover by itself.

## QA / acceptance

```bash
node --test tests/area-ai-team-control-plane.cjs
```

Requires success from the existing `AREA Ledger Release QA` workflow on its PR plus the dedicated `AREA AI Team Control Plane` validation.

Must block on:
- mismatched/unknown SHA; missing, pending or failing regression/iPhone check
- failed Cloudflare external build even where GitHub QA is green
- draft/closed PR and changed release/identity files requiring additional review
- no exact-SHA staging acceptance or no explicit owner approval for production
- invalid GitHub issue IDs, unknown roles or missing task acceptance requirements

## Dependencies before activating with real Issues

- **PR #137:** AI Team governance reviewed and merged after all required gates green.
- **PR #139:** Issue triage workflow reviewed/merged; run with GitHub Issue #138 once activated.
- **Issue #140:** external direct Cloudflare Workers Build failure diagnosed with actual Cloudflare logs. Existing `gateway/wrangler.toml` deliberately requires source identity stamping and GH Actions stamps before staging. The Cloudflare direct build check reports failure but GitHub check output contains no source error; confirm in account UI before adjusting any integration.
- Ensure the backend has a supported, authenticated Codex task dispatch API **before** claiming autonomous development. No such action is available from this control-plane prototype.
- Physical iPhone/Safari/VoiceOver and live OCR provider accuracy still need separate acceptance.

## Non-negotiable release boundaries

- No force push, automated merge, change to `.github/production-cutover-v805`, or production unlock through this code.
- No change to `site-ledger-v1`, `site-ledger-db`, Cloud Sync, D1/R2, OCR review-first accounting flows, secrets, or financial records.
- Even a release-readiness `readyForManualCutover: true` does not grant approval and cannot deploy; existing production cutover process must be used separately.
- This PR is intended to stay **draft/unmerged** until preceding queue phases and Cloudflare gate are resolved.

## Execution Queue state at implementation

| Item | Status |
| --- | --- |
| 1. Diagnose Workers Build / Issue #140 | Code-level expected failure identified; **actual private Cloudflare log not accessible; blocker remains** |
| 2. Merge PR #137 after QA | Release QA passed; external Build failed; **not merged** |
| 3. Merge PR #139 after QA | Intake / regression / layout QA passed; external Build failed; **not merged** |
| 4. Trial Issue #138 via activated workflow | Workflow not on main yet; **not executed** |
| 5. Task Queue + Codex Handoff | Read-only deterministic handoff prototype added; **Codex execution unavailable/not started** |
| 6. Independent QA Review | Read-only PR review / release gates added with tests; **no merges or deployment** |
