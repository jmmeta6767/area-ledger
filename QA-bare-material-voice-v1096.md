# v1096 — amount missing from the actual transcript “ทราย 500”

Base: 0f2704ce97b967f191237ec92985c9834c5247ab (local v1095), continuing codex/reliability-ux-v1094. Main remains fc4fac861b2e3e2d13b44f51a37ccbd224d32c56. Existing v1094/v1095 work is preserved.

## Reproduction and change

The new supplied screenshot shows “ทราย 500”, amount zero and running version 1089. The local v1095 parser also reproduces this specific amount failure: its unlabelled trailing-number path requires an expense verb/prefix, whereas the actual recognition omitted ค่า. This is distinct from the lifecycle issue fixed in v1095.

The new regression fails on v1095 before the parser change. A short allowlist now accepts ทราย, ทรายหยาบ, ทรายละเอียด, ปูน, ปูนซีเมนต์, เหล็ก, อิฐ, สุขภัณฑ์ and ท่อ, followed by one monetary number or Thai number words. It does not treat an arbitrary description, material grade, product code, date, telephone, dimension, quantity/unit or multiple-number phrase as money. An internal marker preserves the full material name when a substring happens to resemble the รายละเอียด command.

“ทราย 500” and “ทราย500” now produce item ทราย, original category ค่าของ and amount 500, without บาท. No finance formula, category mapping, storage key, saved transaction, OCR or Google contract changes. Existing native finalization, fresh user-tap capture, stale callback rejection, undo and save guards remain in place. App/source cache identity advances to 1096; APP_RELEASE remains 800.

## Verification

- `tests/voice-finalization.cjs`: 12 accepted bare material cases and 15 rejected ambiguous cases. Twenty manual stop/delayed-final/end/new-tap cycles alternate bare ทราย and prefixed ค่าทราย; undo returns to the prior amount. Existing split results, intermediate results, timeouts, cancellation, error and draft ownership checks remain.
- `tests/qa.cjs`: 620 original QA groups, 22 OCR/voice groups, 5 finalization groups and 13 reliability workflow groups.
- `tests/reliability-ui.cjs`: actual DOM clicks at 320, 375, 390, 430, 768 and 1280px start with the exact “ทราย 500” transcript, then correct to 700, protect save during finalization, and undo to 500. Recognition is mocked in Chromium; no real microphone recording is made.
- `tests/sync-client-modules.cjs` and repository QA/build contracts remain required. Exact-commit command logs and screenshots are delivered outside source in the task workspace.

## Deployment and device limits

The attached phone still runs v1089. No physical iPhone Safari/PWA or real audio recognition acceptance is claimed by these tests. No customer ledger/Sheet is modified. The updated branch is not yet published: this host cannot read the Windows Git credential vault, and the connector publication was previously rejected by automatic approval review due to its input-size limit. The user chose a manual Git push; the latest read still shows the remote branch at fc4fac86.

The existing push command sends all three local commits. Publishing must still pass repository exact-head QA, staging acceptance and the production gate. Only then should a device running v1096 test “ทราย 500” → “แก้ยอดเป็น 700” repeatedly, including manual stop and a silent round. Do not clear Ledger storage to change versions.
