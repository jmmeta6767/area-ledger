# Google Sheets + Drive readiness — 16 October 2026

Base: main `7ba7b49c7b8201dbe153b542fb41a3a978a55a77` (v1077).
The separate v1078 icon/navigation worktree contains uncommitted changes; preserve it and integrate after review.
Read-only production checks: `/ready` passed; `/v1/google/status` with a synthetic probe identity returned `configured:false`. This proves server OAuth configuration is incomplete, not the status of the owner's Google account.

## Existing behavior

One OAuth connection supports both APIs. Ledger remains authoritative. Each project gets a Drive folder and a spreadsheet with BOQ, สรุปหมวด, ค่าวัสดุ and ค่าแรง tabs. Source-file uploads are separate explicit actions, up to 8 MiB per file. Export is one way; changes in Sheets do not import into Ledger. Sync replaces the exported tabs, so do not use those tabs for independent edits.

## Activation

1. In https://console.cloud.google.com/ select or create one project for AREA Ledger. Enable Google Sheets API and Google Drive API in that same project.
2. Configure Google Auth Platform branding/audience. During testing add the owner's Google account as a test user. External Testing refresh tokens generally expire after seven days for these scopes; choose the appropriate publishing status before ongoing use.
3. Create an OAuth client of type Web application. Register the exact redirect URI `https://g.areamaibab.workers.dev/v1/google/oauth/callback`. Use the same hostname to start and finish authorization. Register other callback hosts separately only when they are used.
4. Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a randomly generated `GOOGLE_TOKEN_KEY` of at least 24 characters in the Worker secret store. Never put secret values in chat, Git, HTML or browser storage. Keep the token key stable after connections exist.
5. Verify D1 migrations `0003_google_workspace.sql` and `0004_google_drive_files.sql` have been applied. Do not recreate or clear the existing database.
6. In Ledger's BOQ project controls open Google Drive / Sheets, then Connect Google. The account owner must select the account and grant access. ChatGPT's Google connector does not grant this app its own OAuth credentials.
7. With a disposable test project export two BOQ rows, verify all four tabs/totals and folder placement, upload a small source file, repeat export to confirm reuse, and test reconnect. Test Safari and installed iPhone PWA returns before enabling for routine work. Native store-app OAuth remains explicitly unavailable in current code.

Current scopes: `openid email`, `drive.file`, and `spreadsheets`. Tokens are encrypted server-side with AES-GCM. No real Google account end-to-end test has been performed in this change.

## Cost constraints

Standard API use is available at no additional cost within Google quotas. Keep usage within the project's free quotas and existing Drive storage allowance; do not enable paid overage or increase paid capacity for this setup. Existing hosting/storage charges are independent of Google API pricing.

Sources checked 16 October 2026:
- https://developers.google.com/workspace/sheets/api/limits
- https://developers.google.com/workspace/drive/api/guides/limits
- https://developers.google.com/identity/protocols/oauth2/#expiration

## Readiness fix

Reject BOQs over 1,500 rows with `GOOGLE_BOQ_ROW_LIMIT` before Google or database writes. The former silent truncation could export incomplete financial data. The browser now displays the limit explicitly. Raising the limit requires a separate payload/quota review.

Validation: `node tests/google-workspace-readiness.cjs`, `node tests/qa.cjs`, `node tests/gateway-preflight.cjs`.
