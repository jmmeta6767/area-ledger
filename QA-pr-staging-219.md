# Issue 219: exact-head PR staging

Base: main a4a71dfb06617595c56f34a400aaa3f83d1dfad4. PR 220 remains separate and unmerged.

The existing Cloudflare Git preview cannot deploy an unstamped source: tests/assert-deploy-identity.cjs intentionally rejects an empty build SHA. This is reproducible locally; Cloudflare build logs have not been accessed, so their exact failure cause remains unverified.

This PR adds a distinct GitHub PR staging workflow. It checks out the exact same-repository PR head for both full release regression and iPhone browser QA, then deploys only after both pass. The staging job rechecks the open PR head and current main before deploy and after live acceptance. Any changed head/base fails instead of claiming stale acceptance. Shared staging deployment and acceptance use the same concurrency group as the existing staging auto-deploy.

Before deploy, a runtime guard rejects forks, non-PR events, incorrect SHA, an open production marker, database migrations, binding config changes, legacy production source, and changes to existing release workflows. No migrations, secret writes or production deploy commands are added. Existing pinned staging D1/R2/DO bindings and existing staging secrets are used as configured; missing schema/config fails acceptance and requires investigation, not automatic provisioning.

Staging live acceptance uses a fresh synthetic ledger key, checks exact deployed SHA, D1 reconciliation, R2, synthetic history/restore and OCR quality. It does not access the user's ledger key, customer backups, Google authorization or real spreadsheets. Test-only R2 objects created by acceptance are cleaned up by that test; no customer data is deleted.

Production Cutover continues listening only to the original staging workflow, for successful main pushes with the one-time authorization marker. The new workflow has a different name and never writes a marker. Its success does not authorize production.

Local checks: workflow YAML parsing, negative candidate guard cases and deployment/production contracts pass. Full Release QA regression is run before publishing. CI iPhone and live staging results must be reviewed for the exact PR SHA; no physical iPhone acceptance is claimed.

Rollback: revert these workflow/test files. No data or schema rollback is needed. Do not use this workflow to approve a schema or production infrastructure change.
