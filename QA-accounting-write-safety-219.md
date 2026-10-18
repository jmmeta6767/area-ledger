# Issue 219 — v1090 accounting write safety candidate

Based on refreshed main a4a71df plus unmerged PR 220 head cbbde761537b32a70dc630a0ab6f2cba63a32c77. PR 220 voice and six-project dry-run changes are preserved.

## Verified regressions and fixes

- Forced rejected contractor/AP writes could leave a success audit entry in memory. With 1,000 audit entries, the rejected action also discarded the oldest entry. Snapshot the audit array before mutation and restore it on rejection.
- Rejected bank reconciliation, manual journal and period-close/reopen writes now restore the associated audit array. Bank rollback removes only the attempted record rather than popping an unrelated last reconciliation after persist has restored the committed state.
- Failed reopen removes the uncommitted reopenedAt field instead of only assigning the older properties over it.
- Protect AP entry/payment, mark-paid, edit/delete transaction, receipt collection, manual journal, bank reconciliation, period close/reopen and contractor-create actions at dispatch. Direct saveTx also rejects non-owner income or edits; new foreman outgoing expense remains allowed.
- This is the app's existing local owner/foreman policy. A user able to change the local role/state is not stopped by these controls; this does not add server-side identity/authentication or certify multi-user authorization.

## Tests

Synthetic VM handler tests cover audit rollover, failed AP/contractor writes, bank/journal/period rollback, direct foreman action rejection, allowed new foreman expense and a real first-save localStorage failure with no IndexedDB writes. Existing owner partial/full settlement, closed period, duplicate, OCR/voice and accounting tests remain active. The period-close rollback test mocks only the successful checklist to isolate post-validation persistence failure; separate month-end tests cover that checklist.

The candidate updates APP_BUILD and the service-worker cache/registration to v1090 so an eventual approved release can update installed PWA clients. Storage keys site-ledger-v1 / site-ledger-db remain unchanged; no schema, data migration, clear/reset, real restore, cloud ledger or Google write was performed.

Full Release QA is run before publishing. Exact-head CI iPhone and PR staging acceptance are required before merge. Physical iPhone microphone and real six-project recovery remain unverified. PR 221 supplies the proposed staging workflow separately; its result does not authorize production.

No production authorization marker is created. Rollback is a code revert and prior app-cache release; accounting storage is preserved.
