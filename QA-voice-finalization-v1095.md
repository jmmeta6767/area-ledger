# v1095 — graceful microphone completion and repeat capture

Base: local v1094 commit 8b06c26c63b49de06885eac8b91fd0a104b2ce5c, on main fc4fac861b2e3e2d13b44f51a37ccbd224d32c56. Continues branch codex/reliability-ux-v1094 so the user's pending push command remains valid.

## Reproduced defect

The supplied screen identifies production v1089 and a listening session with amount zero. That image alone cannot identify the native event sequence. The existing lifecycle does have a reproducible defect: a second tap while listening calls abort and removes result handlers, discarding any final response delivered afterward. A result-triggered stop also removes the recognizer from the onresult guard too early. The previous tests encoded abort on manual stop and mostly returned complete results before stopping, which missed this path.

The new regression fails against the previous implementation before the fix. Web Speech specifies that stop attempts a result from captured audio, while abort discards recognition: https://webaudio.github.io/web-speech-api/#speechrecognition-methods . This change follows that distinction; it does not claim to improve Apple's recognition service or prove the exact event sequence on the pictured phone.

## Changes

- Manual stop and native speech-end request stop once and retain result/error/end handlers until completion. Cancellation on navigation, background, draft replacement or errors still aborts and rejects stale callbacks.
- Reads every final row in the current result list. A description and amount delivered as separate final segments are parsed together and applied once at completion. The existing parser maps ค่าทราย500 to the original materials category, item ทราย, amount 500; no baht suffix is required.
- Enables interim results for visible listening feedback. Interim values never enter the financial draft. An interim-only end preserves existing fields and asks for another capture.
- Each user tap after completion creates a fresh recognizer. No automatic capture starts from end. A missing native end releases handlers after six seconds, explicitly aborts remaining capture and applies only already confirmed final text; diagnostics retain END_TIMEOUT and do not claim a native end occurred. Missing start retains its six-second limit; a twenty-second capture requests completion before release.
- Saving waits for both listening and finalization. Voice edits remain unsaved until the existing manual save flow; project/date/payment choices and guarded undo remain intact. Storage keys, APP_RELEASE 800, accounting formulas, OCR and Google contracts are unchanged. Advances app/source cache identity to 1095.

## Checks

- `node tests/qa.cjs`: original accounting and storage QA, 22 OCR/voice groups, new finalization cases and v1094 reliability workflows.
- `tests/voice-finalization.cjs`: twenty distinct manual stop -> delayed final -> end -> fresh tap cycles, stale callbacks, undo to the prior round, no ledger writes; interim and split final results; empty/interim-only and missing end; navigation, changed draft/view, error and retry.
- `tests/reliability-ui.cjs`: real DOM start/stop clicks at 320, 375, 390, 430, 768 and 1280px; interim text without amount changes, final text arriving after manual stop, save blocked during closure, second-round correction and undo. Uses mocked native events in isolated Chromium contexts with synthetic ledger data.
- Existing expense entry, shared UI, module-distribution and full workflow checks remain applicable. Exact commit logs and browser evidence are delivered outside source in the task workspace.

## Release and acceptance limits

The screenshot runs v1089, not this candidate. A local passing test is not a production rollout. Deployment remains dependent on publishing this branch, exact-head GitHub QA, staging acceptance and the repository production gate. The user's manual Git push is pending because this host cannot read its Windows credential vault; connector publication previously failed the automatic approval review input limit.

No physical iPhone microphone, native Safari/PWA speech service, real audio quality or VoiceOver acceptance is claimed. No customer ledger or Google data is modified in these tests. On an installed v1095 build, physical acceptance should speak ค่าทราย500, wait for result 500/ทราย, tap again and speak แก้ยอดเป็น700, then verify amount 700 without any automatic transaction save; repeat after stopping manually and after a silent session.
