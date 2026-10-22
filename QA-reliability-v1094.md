# v1094 — release identity, repeatable corrections and verified recovery/sync

Base: main fc4fac861b2e3e2d13b44f51a37ccbd224d32c56 (v1093). Branch: codex/reliability-ux-v1094.

## Delivered changes

- Settings names the currently running build and the build fetched from the same server. A failed/offline or wrong-environment check never claims freshness. Reload waits for active microphone capture/closure and Google operations as well as the existing draft/save guards. A read-only CLI, `node tests/release-status.mjs --origin https://g.areamaibab.workers.dev`, records the actual served SHA independently of GitHub workflow color.
- Voice corrections show only changed fields alongside the latest transcript, with a one-step undo. Undo refuses to overwrite subsequent manual edits. It never saves a transaction, starts another capture automatically, or records audio. Existing parsing and fresh-recognizer lifecycle remain in place.
- File recovery previews current versus incoming counts and gross income/expense, net receipts/payments/outstanding values, receipt references and project differences. This uses the existing payment helpers. The replacement confirmation is bound to both the selected backup and the current business digest. Recovery commits the complete state and metadata once, preserving the existing failure rollback and storage keys.
- Google sync captures detached payloads, stops remaining bulk requests if local business data changes, and reports a changed snapshot rather than falsely calling it current. New clients request readback verification. After writing the existing atomic snapshot, the gateway reads the exact managed ranges and compares stored values, including numeric date serials and displayed column order, before advancing last-success metadata. Existing clients remain compatible. User tabs, formulas, chart IDs, positions and the original accounting helpers remain unchanged.
- A scoped stylesheet supplies readable recovery/version/verification surfaces without adding global important overrides. Shared card shadows are reduced. New reusable test context and separate read-only release inventory avoid adding operational diagnostics to financial handlers.

Sheets verification follows the documented ordered batch response and unformatted/serial date output: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet . It verifies the exported rectangle at that instant, not later edits or the user's custom ranges.

## Scope agreed with the user

The user selected single-user operation; account login and server-side team roles are deferred. No login, invitations, membership schema or infrastructure change is introduced. See TEAM-READINESS.md.

The user confirmed no real backup is available on this machine. No customer ledger, real backup restore or actual Google account/spreadsheet write is performed. The preview is ready for explicit file selection on the user's device.

## Verification

- `tests/qa.cjs`: 620 existing QA groups, 22 OCR/voice groups and 13 new reliability groups.
- New reliability groups exercise 20 distinct mocked captures, corrections without baht, stale callback rejection, undo/manual-edit preservation, read-only six-project comparison, changed-file/local-state confirmation binding, one restore commit, reload guards, build identity, date-aware Sheets readback, mismatch rejection and last-success preservation.
- `tests/reliability-ui.cjs`: six widths, real DOM clicks for repeat speech and undo, recovery preview/confirmation with unchanged original storage, version panel, and axe at 390px. Speech is mocked; no native microphone acceptance is claimed.
- Existing six-width 15-view/70-dialog catalogue, dark-OS case, accounting/payment/document workflows, expense OCR/save/quota/voice, original release regressions, icon fallback and payroll isolation remain required. Exact-head CI/staging evidence is recorded on the pull request.

The read-only pre-change inventory on 22 October found production v1089 / 43f23eae and staging v1093 / fc4fac86. Production rollout, if completed, must be evidenced by its exact deployed SHA; a successful workflow with skipped deploy does not count.

## Limits

Physical iPhone Safari/PWA microphone, VoiceOver and human accessibility acceptance remain unverified. Browser emulation and synthetic tests are not those checks. Zero axe findings do not certify full WCAG 2.2 AA. Data recovery checks use synthetic six-project fixtures because the real backup is unavailable. Google verification is tested against mocked API responses; user-account acceptance remains a separate explicit sync action. No storage reset, accounting migration, financial formula or payroll change is included.
