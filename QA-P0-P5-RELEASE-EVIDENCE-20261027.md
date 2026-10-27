# AREA Ledger P0–P5 Release Evidence — 2026-10-27

> **STATUS: HOLD / NOT PRODUCTION-READY.** This is a read-only release audit of observable GitHub evidence, not a deployment authorization. Revalidate every SHA and check immediately before merge or release. No private ledger, token, receipt or Google Drive content is stored here.

## Source of truth

- Repository: `jmmeta6767/area-ledger`; verified `main` SHA `04b17665baa39e71d2e3a726d59b43dbbdda7eb4` (v1101).
- Latest observed Production Cutover workflow: [40157859087](https://github.com/jmmeta6767/area-ledger/actions/runs/40157859087), overall success but **`deploy-production` skipped**. Never equate workflow success with a live production deployment.
- Actual Cloudflare production Worker SHA, production D1/R2 bindings and physical iPhone Safari acceptance: **not independently verified**.

## PR matrix (snapshot; each PR is a separate draft/review gate)

| Priority | PR | HEAD | GitHub Release QA | GitHub PR Staging | External Cloudflare build | Release decision |
|---|---|---|---|---|---|---|
| P0 | [#238](https://github.com/jmmeta6767/area-ledger/pull/238) | `b3299ebeb896eea53483ad999153065e9d3a50cb` | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40354831351) | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40354831535) | failure | HOLD |
| P1 | [#239](https://github.com/jmmeta6767/area-ledger/pull/239) | `9245a70f8e7cdaddf7408e719edb7d2e918a0d0f` | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40354143759) | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40354143745) | failure | HOLD |
| P2 | [#240](https://github.com/jmmeta6767/area-ledger/pull/240) | `8558d12709833bbff374020ae1a284c8f40356e4` | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40355433545) | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40355433588) | failure | HOLD |
| P3 | [#241](https://github.com/jmmeta6767/area-ledger/pull/241) | `28be2aa92141f8a635e1119c866638813133f908` | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40453102587) | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40453102514) | failure | HOLD |
| P4 | [#237](https://github.com/jmmeta6767/area-ledger/pull/237) | `88c8dff475b1b8a0785ea1e03d6be4d9358fd511` | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40346930688) | [success](https://github.com/jmmeta6767/area-ledger/actions/runs/40346930580) | failure | HOLD |

## Current blockers and repair plan

1. **External Cloudflare Workers Builds**: failures are present on #237–#241 and #238–#240. `gateway/wrangler.toml` invokes `node ../tests/assert-deploy-identity.cjs` before Wrangler upload. The script explicitly rejects an unstamped source build; GitHub candidate-staging instead stamps the exact reviewed SHA via `tests/stamp-build.mjs`. This makes a redundant direct Cloudflare Git build a **plausible cause**, not a verified diagnosis without the external build log. Existing tracking issue: [#140](https://github.com/jmmeta6767/area-ledger/issues/140).
2. **Safe repair**: inspect the Cloudflare direct-build failure log and its build source. If it is confirmed to be the unstamped direct Git integration, have the account operator disable only that redundant direct build in Cloudflare while preserving the gated GitHub Actions staging deployment. Revalidate that GitHub Actions still deploys the exact stamped SHA, then rerun checks. If another failure caused it, fix that specific failure instead. Do **not** relax `assert-deploy-identity.cjs`, create a production authorization marker, or disable the required staging acceptance workflow.
3. **P4 conflicts**: [#232](https://github.com/jmmeta6767/area-ledger/pull/232) currently reports `mergeable=false` against main; preserve its iPhone version-check wording/test changes, resolve against current main and #237, then rerun exact-head QA before merge. Do not discard that work or force-merge.
4. **P5**: [#242](https://github.com/jmmeta6767/area-ledger/pull/242) is an evidence-only draft. [Release QA](https://github.com/jmmeta6767/area-ledger/actions/runs/40453184588) passed on initial SHA `4e4380363f8543e02d4533bc65374fabb8cf6a5e`; it does **not** establish live production or physical iPhone acceptance. Re-run and re-record checks after edits.

## Gate checklist — no item may be assumed from a green GitHub Actions workflow alone

- [ ] Confirm latest `main` SHA, current PR HEAD, base ancestry and overlapping files. Rebase/retest sequentially before merging dependent PRs.
- [ ] Review external Cloudflare Workers Builds failure logs; determine whether direct Git builds are intentionally rejected by `tests/assert-deploy-identity.cjs`. **Never disable the fail-closed stamp guard** just to pass the check.
- [ ] All required GitHub, Cloudflare and staging checks green for the exact merge candidate SHA; isolate staging from production resources.
- [ ] Verify production Worker live `APP_BUILD` SHA, `/health`, `/v1/platform/status`, D1 reconciliation and R2 private upload/read/delete on the intended target.
- [ ] Verify user backup integrity and restore to an isolated non-production target; preserve existing projects, transactions, BOQ, receipt originals, `site-ledger-v1` and `site-ledger-db`.
- [ ] Google OAuth real account callback and token renewal, Safari return, Drive/Sheets permissions and idempotent sync tested separately from synthetic QA.
- [ ] OCR cash receipt, slip, BOQ and VAT/WHT values reviewed by a user before posting; no guessed financial entries.
- [ ] Physical iPhone Safari/PWA test: first-load without refresh, reload, offline/online, attachments, export to Files, Google redirect, voice and keyboard.
- [ ] Fresh portable backup, reversible rollback procedure, operator approval and explicit Production Gate authorization. Confirm `deploy-production=success` **and** independent live SHA afterwards.

## Non-destructive release rule

Do not merge or deploy merely because this report exists. Do not clear browser data, rewrite ledger state, import a backup into live production, mutate D1/R2, or create an authorization marker as part of QA. Record any remaining failure with links and keep release on HOLD.
