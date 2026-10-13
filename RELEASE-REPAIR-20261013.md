# AREA Ledger — Release safety repair (13 October 2026)

Base: GitHub main `d3924babe308a64ce2875b277d994050bd914b10`. This patch changes only recovery navigation, Cloudflare permissions policy, release workflow checks, and regression contracts. It **does not** change ledgers, formulas, localStorage `site-ledger-v1`, IndexedDB `site-ledger-db`, Cloud Ledger revisions, D1 migrations, R2 data, or provider secrets.

## Fixes

1. Render legacy recovery links to `https://g.areamaibab.workers.dev/` (production) instead of staging. No backup is uploaded or restored automatically.
2. Production Cloudflare web-app response headers permit `microphone=(self)` for Thai voice draft entry, while recovery-only Render headers continue to disable microphone. Access still requires the browser/device to allow voice recognition; no audio is stored by AREA Ledger.
3. Manual production deployment now fails closed unless it is launched from `main`, carries the exact one-time `DEPLOY_PRODUCTION` marker, and GitHub reports a **successful** staging-auto workflow for the **same commit SHA** (successful after BOQ quality verification). Immediately before production it also verifies the actual staging build SHA, Cloudflare/D1/R2 acceptance and live BOQ document quality. Explicit user confirmation is still required.
4. Manual production, automatic one-time cutover, and staging workflows use matching concurrency locks to avoid two repository workflows deploying to the same target simultaneously.
5. Regression tests pin these invariants.

## Outside repository control / remaining blockers

- External Cloudflare Workers Git Builds for `area-ledger-ai-gateway-staging` may overwrite the trusted stamped GitHub staging deploy. The observed 12 October 2026 failure was `deployedBuild.sha=56cfdbd3` while `main=d3924bab`. Inspect Cloudflare's actual external build logs and, if redundant, have an authorized Cloudflare owner disable the competing direct Git Build. Never weaken source stamping or bypass live QA.
- Verify real iPhone/PWA microphone behavior, permission policy received as an HTTP response, keyboard/focus, and actual small-store receipt accuracy. Automated source/CI acceptance does not replace device or provider accuracy evidence.
- Google Workspace OAuth staging secrets were absent in inspected logs; optional integration remains unavailable until configured by the owner.
- Enable branch protection / required status checks in GitHub repository settings; available connector access does not provide repository administrative ruleset mutation.
- Investigate whether a public BOQ image fixture contains private project data; avoid committing real receipts to a public repository. If sensitive, remove public exposure via a coordinated fixture/history clean-up after replacement acceptance. Do not rewrite main history automatically.
- Verify staging and production secrets, account-level Cloudflare settings, and rollback approach before any merge. **No production deployment is authorized by this patch**.

## Acceptance checklist

- [ ] Proposed branch regression QA and iPhone layout CI are green
- [ ] Staging latest SHA and full live BOQ acceptance green
- [ ] External Cloudflare build collision resolved
- [ ] Physical iPhone Safari/PWA voice + recovery tests complete
- [ ] User approves any production release, with explicit one-time marker and backup captured
