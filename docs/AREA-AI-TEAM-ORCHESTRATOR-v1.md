# AREA AI TEAM — Issue Intake Automation v1

## Purpose

Provide a real, **opt-in GitHub Actions issue intake** for AREA Ledger development work.
This step routes a GitHub issue to the AREA AI Team's logical specialists and
review gates, posting a reproducible plan comment. It does **not** instantiate nine
independent AI models, run Codex, merge a PR, edit user accounting data or deploy.

## Runtime and source protections

- Based on latest `main` at task start (initial baseline `c74de3937bc5c43390d2e69d2a135dee48e1855b`).
- Pure Node `tools/area-ai-team/triage.cjs` reads issue metadata only.
- Workflow `.github/workflows/area-ai-team-triage.yml` runs on
  the `area-ai-task` issue label or manual `workflow_dispatch` for an issue number.
- The workflow uses the repository's default-branch code, not issue-provided scripts.
- Permissions are read-only for code; the triage job has only `issues: write` to
  post/update one planning comment. No deployment, PR merge, code push, secret
  access, or business record mutation is performed.
- Repeated runs update the same comment from `github-actions[bot]` instead of
  flooding the issue.
- Explicit `[P0]` … `[P3]` in title or `Priority: P1` in body; any omitted
  priority remains `UNSET`. Missing acceptance criteria are flagged.
- Role routing is deterministic keyword matching. It is not semantic AI analysis:
  specialists and reviewers must still inspect the issue before implementing.
- Raw issue contents, amounts and secrets are **never copied** into the bot plan comment.

## How to use after merge to main

1. Open a Github Issue describing observed behavior, expected behavior, exact
   acceptance checks, redacted evidence, and priority.
2. Add the `area-ai-task` label **if that label already exists**, or invoke
   Actions → AREA AI Team - Issue Intake → Run workflow with the Issue number.
   GitHub repository managers may need to create the `area-ai-task` label first.
3. Read the bot's planning-only comment, verify role mapping, then assign the
   actual engineer/Codex task via the existing authorized development process.
4. Developer implements changes on a fresh branch from **current** main.
5. AI-05 independent QA and AI-06 security review can reject the PR.
6. Release remains controlled by existing GitHub QA, staging/live acceptance,
   and the explicit production authorization process.

Issue intake does NOT auto-invite or grant access to Codex, and does NOT substitute
for GitHub users, reviewer permissions, data integrity testing or owner signoff.

## Test and validation

`node tests/area-ai-team-triage.cjs`

PR changes to this code run a dedicated read-only `validate` job plus the
repository's existing Release QA. The test checks severity parsing, OCR/BOQ/
finance/mobile routing, release risk, review gates, no premature approvals,
malformed data, no issue-content echo and safe repeat comments.

**Required before main merge:** GitHub Release QA passes; inspect any failing
Cloudflare Workers Build check instead of bypassing it. v1048's existing
unstamped-source safeguard may reject direct Workers Builds by design; only an
authorized owner can change Cloudflare's external build integration. Do not
remove source stamping / production cutover safeguards to turn that check green.

## Future phases (not yet implemented)

- Persist structured task status and deterministic acceptance artifacts.
- Authorized human-triggered Codex task dispatch (requires a real supported
  Codex integration and scoped credentials; none exists in this workflow).
- Independent verification of generated PRs and feedback loops.
- Progress dashboard backed by GitHub Issues, PRs and Actions.

See related governance PR #137 and Sprint Issue #138.
