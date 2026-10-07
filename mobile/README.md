# Native app container

This is an initial Capacitor 8 container for Android and iOS. It bundles the first-party web client from `../gateway/public`; it intentionally does not set `server.url` to a remote website.

## Local setup

Use Node.js 22 or newer. Install dependencies from this directory, then add the platform project on a machine with its native toolchain:

```sh
pnpm install
pnpm run cap:add:android
pnpm run cap:add:ios
pnpm run cap:sync
```

Android builds require Android Studio and the Android SDK. iOS builds require macOS and Xcode. Capacitor 8.5.2 dependencies are pinned in `package.json`.

## Important release constraints

- `com.areamaibab.arealedger` is a proposed bundle identifier; verify and reserve the final identifier in both developer consoles before signing a public build.
- Installed-app storage is isolated from Safari and the current PWA. Users must deliberately export a validated backup from the old app and restore it in the installed app if they want to move existing data. There is no automatic import or storage migration.
- Native cloud requests use the production gateway. Exact native origins are present in Wrangler configuration on this branch but are not live until a separately accepted deployment. Do not test account data against a production build before that gate passes.
- Google Workspace OAuth remains unavailable in the native container until a secure callback/deep-link return is implemented and tested.
- A physical device test, privacy policy, support/feedback contact, store metadata, signed builds, and both store accounts are still required. The repository owner's signing credentials must remain private.
