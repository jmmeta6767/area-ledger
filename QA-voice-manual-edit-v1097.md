# v1097 — retain manual edits while speech finishes

The repeated-capture fix buffers confirmed speech until native completion. Review reproduced a race: after a final transcript arrived but before `onend`, manually changing amount 100 to 700 could be overwritten with the spoken 500.

Each capture now snapshots only the fields voice can change: type, amount, category, item, custom item, partner and date. If any differs when the final result is ready, the entire pending voice patch is rejected. The form retains the latest manual values and existing review/undo state, shows a Thai explanation, releases the microphone and allows another tap. Project and payment choices do not block completion because voice does not change them. Missing native end uses the same guard.

`tests/voice-finalization.cjs` exercises edits to all seven fields during both listening and closing, timeout, a fresh correction and undo back to the manual value, and project/payment compatibility. The new manual-edit regression failed before the fix and passes after it. No transaction is automatically saved. APP_BUILD/cache advance to 1097; financial calculations, APP_RELEASE 800 and storage identities remain unchanged.

All microphone tests use synthetic speech events. Physical iPhone Safari/PWA audio and real-user speech still require device verification after deployment.
