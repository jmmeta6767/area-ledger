# Release operations v1049

Source of truth: GitHub `main` at `c74de3937bc5c43390d2e69d2a135dee48e1855b`.

## Deployment authority

- GitHub Actions is the release path: stamped staging deploy, live staging acceptance, then the repository's one-time production cutover marker and production acceptance.
- The production marker `.github/production-cutover-v805` is absent on main. The production workflow therefore skips deployment. Keep that gate closed until the release candidate has passed staging acceptance and the required owner acceptance.
- Cloudflare reports a separate Git build for the staging Worker. The repository's Wrangler identity guard deliberately rejects an unstamped build, so this separate integration can appear as a failed check even when GitHub Actions deployed and accepted staging.
- Cloudflare dashboard access is not available to this task. The repository cannot turn off the account-level Git connection. An account administrator should open Workers & Pages → `area-ledger-ai-gateway-staging` → Settings → Builds & deployments, disable its Git-triggered build, then confirm the GitHub staging workflow remains the only staging deploy source. Check the legacy `g` Worker too before changing any integration there.
- Do not remove the Wrangler identity guard or use direct `wrangler deploy` to bypass the pipeline.

## Acceptance evidence

For each release, record the main SHA, staging SHA, workflow URL, live acceptance artifact, and production SHA if the one-time cutover is authorized. After production acceptance, remove the marker using the existing gate-close procedure. A skipped production job is a closed gate, not a production deployment.

Physical iPhone acceptance is tracked separately in `FIELD-ACCEPTANCE-v1049.md`. Automated safe-area/viewport simulation is not proof of native Safari or keyboard behavior.
