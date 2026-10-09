# AREA Ledger field acceptance v1049

Use a non-production test ledger first. Do not ask participants to share account screenshots, receipts, or exports in public issues. Keep feedback voluntary and user-shared through the app's existing feedback flow.

## Physical iPhone acceptance

The current automated checks simulate mobile Chromium and safe-area behavior. They do not certify physical iOS Safari, the native keyboard, VoiceOver, or an installed home-screen app. Complete these checks on at least one supported iPhone and record the iOS version, Safari version, device model, build SHA, and whether each run used Safari or standalone mode.

1. Open the staging URL in Safari at portrait and landscape. Repeat after Add to Home Screen and launch from the icon.
2. At 320, 375, 390, and 430 CSS-pixel widths where available, navigate Overview → Project → BOQ → Add expense → Documents → Settings. Confirm no unintended horizontal scroll.
3. Open and close the project editor and multi-expense OCR sheet. Focus the first and last inputs, open and dismiss the keyboard, and rotate the phone. Confirm the focused input and save/cancel controls remain visible and edits remain intact.
4. Expand each OCR source image. Verify row amount, date, payee, project, and paid/unpaid status against the source. Confirm missing facts remain visibly unresolved and save stays blocked until required review fields are complete.
5. Export a backup, restore it into a spare test install, and compare project, BOQ, income/expense counts, amounts, and one photo attachment. Do not use a production ledger for this rehearsal.
6. In airplane mode, create a draft, cancel it, and confirm it was not saved. Reconnect and use the guarded app update; confirm a draft prevents reload and the ledger remains present after update.
7. Check VoiceOver focus order, labels, announcements for progress/errors/success, text zoom, and reduced motion.

## Small user pilot

Invite 3–5 consenting field users after the physical-device checks pass. Use a disposable test project. Ask each person to add one expense from a receipt, check a multi-row table, connect a row to BOQ, inspect an unpaid item, and find the backup/feedback controls.

Record only task completion, elapsed time, number of OCR fields corrected, blocked saves, support requests, device/browser mode, and app SHA. Do not collect ledger contents or images automatically. Ask participants to use the existing share-based feedback action only when they choose to report a problem.

| Participant (alias) | Device / mode | Task completed | OCR fields corrected | Blocked saves | Feedback summary | Build SHA |
| --- | --- | --- | ---: | ---: | --- | --- |
| Pending | — | — | — | — | — | — |

## Release decision

Physical iPhone and participant results are pending. Automated browser runs can support the layout review, but production release acceptance must not be described as physical-device acceptance until the checks above are completed.
