# AREA Ledger: App Store and Google Play readiness

Audit date: 9 October 2026
Source of truth: GitHub `main` at `c74de3937bc5c43390d2e69d2a135dee48e1855b` (v1048).

## Current release state

AREA Ledger is currently a first-party, offline-capable PWA served from Cloudflare Workers. Main includes an initial Capacitor configuration and an app-package contract, but generated iOS/Xcode and Android/Gradle projects have not been built or device-tested. There is no published privacy policy or store support/feedback contact, and neither an App Store Connect nor Play Console account is available for uploading a signed build. The app has not been submitted to either store.

The repository can be prepared for an installable native package, but the package must bundle the app itself. A remote-only WebView would be a poor review candidate: Apple's minimum-functionality guidance says an app should elevate beyond a repackaged website, and Google Play restricts website WebViews without the owner's permission. AREA MAIBAB owns the web app, but that fact alone does not make a remote wrapper store-ready.

## Verified product and data behavior

- The client is one large web app at `gateway/public/index.html`; the current manifest declares `display: standalone`.
- Accounting state uses `site-ledger-v1` and IndexedDB `site-ledger-db`. Data is local-first. The code does not create a user login account.
- Cloud ledger sync and attachment storage are optional and require the user to enable them. Cloud endpoints use a generated ledger key held in local storage.
- Remote OCR sends receipt/BOQ images to the Cloudflare gateway only after the user enables remote OCR; the gateway can forward images to Gemini.
- Google Drive/Sheets integration is optional and user-initiated. It uses an OAuth return URL tied to the app's current web origin.
- The existing backup/restore flow is user-triggered and validates a backup before replacing current data. This should remain the path for moving data into a separately installed native app; no automatic import or storage migration should be added.
- A bundled native WebView has a different origin and isolated WebView storage from Safari/PWA. It will not automatically see data already stored by `g.areamaibab.workers.dev`. This must be explained to users and tested with the existing reviewed backup/restore flow.
- Main and the v1048 production source map native Cloud API calls to the production gateway and include the exact Capacitor iOS/Android origins in Wrangler configuration. This is configuration-level evidence only; the native app has not been built or exercised on physical iOS/Android devices. Production changes still use the repository's normal explicit production gate and acceptance.
- Native Google OAuth currently fails closed with a clear message until a verified callback/deep-link flow exists. The web/PWA OAuth path is unchanged.

## Recommended implementation before a store submission

1. Generate and build the iOS and Android projects from the Capacitor 8 configuration so the packaged app bundles `gateway/public` locally; keep the existing PWA deployment independent.
2. Verify the branch's native production API routing and exact-origin CORS on staging and physical devices before changing production. Keep OCR consent and cloud-sync opt-in unchanged.
3. Test import/export, camera/file selection, keyboard, system share, background/resume, deep links, and VoiceOver/TalkBack on physical devices. Complete a secure native Google OAuth callback before enabling that integration in the store build.
4. Preserve `site-ledger-v1`, `site-ledger-db`, user review-before-save, and the current no-auto-save behavior. Keep data transfer explicit through validated backups.
5. Publish a complete privacy policy and support/feedback channel before store listing. Disclose local and transmitted data, Gemini/Google/Cloudflare processing, retention and deletion, and consent/revocation behavior based on the final native build.
6. Produce accurate Thai and English store listing text, icons, screenshots, review notes, privacy labels/Data Safety answers, and a signed Android App Bundle / iOS archive. A build is not a submission until the owner uploads it in each console and completes store review.

## Account and policy prerequisites

- **Apple:** the owner or authorized account holder must enroll in Apple Developer Program. Apple lists a US$99 annual membership (local price can vary). An organization enrollment requires a verified legal entity, D‑U‑N‑S number, organization-domain email, public working website, and a person with authority to bind the entity. The seller name is the individual's legal name for individual enrollment or the legal entity for organization enrollment.
- **Google Play:** the owner must create and verify a Play Console developer account; Google lists a US$25 one-time registration fee. If the new account is personal, Google's current production-access requirement is a closed test with at least 12 opted-in testers for 14 continuous days. Google currently requires new app submissions to target Android 16 / API 36 from 31 August 2026.
- **Publisher/support identity:** do not guess the legal publisher name, support email, privacy-policy owner, retention periods, or deletion contact. These must match the real publisher and data operations before public release.
- Do not send account passwords, signing keys, API secrets, or payment details in chat. Store owners should keep credentials and signing identity under their control; CI signing secrets can be configured later through repository secret settings.

## Items still needed from the publisher

- Whether the seller should be AREA MAIBAB's verified legal entity or a person's legal name, and whether the entity already has a D‑U‑N‑S number.
- A public support/feedback email or HTTPS form URL and the matching privacy-policy URL/domain.
- Confirmation of the intended Google Play account type (personal or organization).
- Confirmation that the owner has enrolled and completed verification in both developer programs. The current answer is that neither account exists yet.

## Official store references

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/uk/) — minimum functionality and privacy.
- [Apple Developer Program enrollment](https://developer.apple.com/programs/enroll/) — account types, identity and current annual fee.
- [Apple App Review preparation](https://developer.apple.com/app-store/review/) — support/privacy links, complete metadata, permissions, and review readiness.
- [Google Play account setup](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en) — developer account and registration fee.
- [Google Play personal-account test requirement](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) — newly created personal accounts must complete a closed test with at least 12 opted-in testers for 14 continuous days before applying for production access.
- [Google Play target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en) — new apps and app updates must target Android 16 / API 36 from 31 August 2026.
- [Capacitor v8 environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup) — Node 22+, Xcode on macOS, and Android Studio/SDK.
