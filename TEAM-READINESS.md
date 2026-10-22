# Team access — deferred by user choice

Current scope is one user. The current owner/foreman selector is a local workflow mode. Cloud ledger capability keys authorize access to one ledger; Google Workspace authorization connects export services. Neither is a per-person team login.

Before enabling multiple people, implement and review these as a separate release:

1. Verified identity with secure sessions, logout and revocation; choose the login provider with the owner. Never reuse a Google export access token as an app session.
2. Organization, project membership and explicit owner/site/accountant permissions checked on every protected server operation, including snapshots, files, Google export, approval and restore. Do not trust a role submitted from local state.
3. Per-person audit identity, approved immutable source records and transaction validation before replacing whole ledger snapshots. A role-limited person must not gain arbitrary whole-ledger write authority.
4. Invitations, removal, session expiry, separate tenants and migration from existing private capability keys, with recovery and rollback. Existing users retain access until they opt into a reviewed migration.
5. Negative integration tests for forged roles, cross-company/project IDs, removed memberships, key reuse, expired sessions and denied file/Google/restore actions.

Do not label this future work as implemented, invite users into the current local role mode, or change storage identities for the preparation document. Authentication, schema and binding changes need their separate staged rollout and acceptance.
