# AREA Ledger v1042 — Build Identity, Batch BOQ Linking, and Period Guards

## Changes

- App settings and Advanced Diagnostics show application build, deployment environment, and source commit. Cloudflare deploy workflows stamp the exact SHA into the active app before deploying.
- Staging and production live acceptance verify the deployed app shell reports the exact workflow SHA and target environment.
- Multi-expense OCR review can link each selected expense to a BOQ row before save. Changing project clears the pending BOQ link; invalid cross-project links block the batch. Linked references and scanned-row provenance persist through the existing backup/restore path.
- OCR fields needing review are highlighted. Expense inputs on iPhone use 16px text to prevent Safari focus zoom.
- BOQ cost linking (single and automatic bulk) skips closed accounting periods. OCR save writes audit evidence and rolls it back if persistence fails.
- The frozen accounting release remains v800 and storage keys stay `site-ledger-v1` and `site-ledger-db`; source build identity is versioned separately.

## Verification

- 28 Node test suites passed, including 546 groups in `tests/qa.cjs`.
- UX v1039, Safari runtime v1037, Cloudflare deploy, gateway preflight, and production cutover contract checks passed.
- Playwright mobile visual verification could not run because this workspace has no installed Chromium executable. The iPhone CSS and source-level UX regressions are covered; physical iPhone/Safari field acceptance remains required by the release workflow.
- Staging deployment and live OCR acceptance must run in GitHub Actions against configured Cloudflare staging secrets. Production remains guarded by its existing one-time authorization marker; that marker is absent in this source snapshot.
