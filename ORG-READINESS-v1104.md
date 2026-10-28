# v1104 — Account clarity and activity history

## Implemented

- Company Profile now has an **บัญชีและสิทธิ์** panel that states the current single-user mode and selected owner/site role.
- The panel links to user-mode settings. Owners can open the existing recorded change history directly from the profile.
- Activity entries use Thai action/entity labels and readable local date/time. They show only the action, entity type, timestamp and existing note; raw before/after snapshots and internal IDs are not rendered.
- The settings page explains that owner/site mode changes app menus and actions and is not individual team authentication.
- Activity history is read-only and uses the current audit collection. No new account, member, role, permission or storage fields are introduced.

## Current limits shown to the user

- The app still operates as one account. The owner/site choice is an in-app operating mode; it does not identify a person or enforce access on the server.
- The audit list shows only actions already recorded by the app. Older data and some areas may not have complete history; it must not be presented as a complete team audit log.
- Individual actor identity is not available and is intentionally not invented in the UI.
- Real team access requires authenticated identities and server-side permission checks before inviting users. This release does not enable team invitations or claim that client-side role controls secure shared access.

## Protected contracts

- APP_RELEASE=800, site-ledger-v1, site-ledger-db, accounting formulas, transaction data and existing audit entries are unchanged.
- The new list is read-only and does not write financial data.
