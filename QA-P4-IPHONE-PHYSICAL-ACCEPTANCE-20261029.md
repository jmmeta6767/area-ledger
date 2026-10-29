# AREA Ledger P4 — Physical iPhone / Safari acceptance (2026-10-29)

> STATUS: **BLOCKED — requires physical iPhone and owner-side private ledger evidence.**
> Browser automation is not a substitute for real WebKit speech, storage quota, or production-device backup verification.

## Tested baseline / current release boundary
- GitHub main at branch creation: `4c800300303e4bc314bcfb3bf113ed29e7d1fdb5` (P0 one-time production marker removed).
- Previous production deploy completed from `5f9f79c7d4d494c78825edd3e7c42f56cf692667` on 2026-10-28. Its live SHA must be revalidated on each release.
- The browser CI already covers layout/scroll/forms/keyboard at 320, 375, 390, 430, 768 and 1280 CSS px, but these checks run in Chromium emulation.
- Existing draft #232 changes published-version wording; do not cherry-pick stale gateway/public/index.html from an old base without a conflict-aware rebase.

## Physical device acceptance checklist — record result, SHA, time and screenshots for every row
1. **Identity/update**: On `https://g.areamaibab.workers.dev/` in Safari and installed PWA, record published version/SHA and verify that a newer GitHub SHA is never falsely reported as published. Do **not** clear site data.
2. **Persistence**: Take a fresh portable JSON+receipt backup, verify checksum/counts, then open/close/reload. Confirm the same six projects and actual balances, not merely a legacy backup.
3. **Quota/attachments**: Save small and large receipt batches under constrained storage; retain drafts after failed saves. For R2 offload, require original offline IndexedDB copy, remote byte readback, and a portable export before dropping inline image data. Never use an arbitrary 4 MiB estimate as Safari's actual quota.
4. **Voice/OCR**: Real Thai microphone start/stop/retry, `ทราย 500`, amount correction, no auto-save; receipt multipage review with mandatory date/payment and manually checked totals.
5. **Financial flows**: Project-specific contract 50,000 → advance 30,000 → outstanding 20,000 → final 20,000 → outstanding 0; no duplicate AP/expense; closed-period guard and undo/rollback.
6. **Keyboard/UI**: iPhone portrait/landscape, actual Thai keyboard, profile sheet, guarantee cards, project summary, payroll inputs, A4 preview and VoiceOver labels. Check no hidden save or horizontal scrolling.
7. **Offline/online**: Wi-Fi↔cellular switch, cached PWA shell, draft retention, single/repeated transactions and correct conflict handling; never overwrite a newer device revision.
8. **Recovery**: Dry-run private backup on isolated storage only; explicitly compare current device revision against 2026-10-22 backup (six projects, 96 transactions, 32 BOQ, 12 images). Owner authorization is required before any live restore.

## Required gate before acceptance
- Exact PR SHA Release QA and PR Staging CI green.
- Actual physical iPhone results with redacted evidence and no personal data in GitHub.
- Fresh Cloudflare production/staging identity plus Google OAuth connection status.
- No mutation/deletion of `site-ledger-v1`, `site-ledger-db`, customer backups, D1 or R2 as part of QA documentation.
- Production authorization remains **CLOSED**. This document alone does not authorize release.

Refs: #219 #229 #232 #245 #246 #247 #248 #249.
