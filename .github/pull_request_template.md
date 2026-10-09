## AREA AI Team review

**Source of truth**
- [ ] Checked latest `main` SHA (record below); this PR is rebased/compared against it
- [ ] Reviewed current README, relevant tests, and last CI result
- Base main SHA:
- AI-00 task / priority / specialist:
- Summary and changed files:

**Data and accounting gate**
- [ ] No change to `site-ledger-v1`, `site-ledger-db`, D1/R2/Cloud Sync without a reviewed migration plan
- [ ] No confidential financial data, receipt images, user data, or API secrets introduced
- [ ] OCR/accounting values are review-first, never silently inferred or auto-saved
- [ ] Duplicates, payment status, closed periods, sum checks and rollback cases tested where relevant
- [ ] Not applicable (explain):

**Evidence**
- [ ] Targeted tests passed (commands/results linked)
- [ ] `node tests/qa.cjs` and relevant regressions passed, or not applicable with reason
- [ ] AREA Ledger Release QA passed on PR
- [ ] Physical iPhone/Safari/VoiceOver results recorded, or explicitly marked NOT TESTED
- Test results / CI URL:

**Release gate**
- [ ] AI-05 QA signoff and AI-06 security/data review
- [ ] Staging acceptance recorded if runtime files changed
- [ ] Production cutover remains explicitly gated; no implicit authorization
- Risk / rollback / production impact:
- Documentation / release notes:

> Roles are logical review responsibilities; ticking this checklist is not evidence of automated multi-agent execution.
