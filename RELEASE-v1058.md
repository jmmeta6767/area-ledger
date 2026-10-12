# AREA Ledger v1058 — clearer voice entry on mobile

This release makes voice-based expense entry easier to control and understand on mobile.

- While speech recognition is active, the voice card changes color, announces that it is listening, and changes its action to “หยุดฟัง”. Tapping again aborts recognition while preserving any existing draft values.
- After recognition, the editable draft shows the heard phrase so the user can review it alongside the parsed fields before saving.
- The form explains that speech may be processed by the browser or device recognition service and that the app does not save audio.
- Unsupported browsers and microphone errors continue to leave keyboard entry available. Recognized speech still never creates or saves a transaction automatically.
- The PWA source cache identity advances to 1058. The stable accounting release number, account storage keys, and stored account data are unchanged.

Validation: QA covers Thai voice parsing, listening and stop states, preservation of draft and account data, manual-save behavior, privacy disclosure, and unsupported-browser fallback. Reliability v1049, UI v1034, Cloudflare-only and deploy-contract checks remain required. Real-device microphone behavior and live staging deployment remain to be verified separately. No production deployment or store submission is included in this release.
