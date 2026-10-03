# AREA Ledger — v850 Workspace / Business Stable Milestone

Date: 2026-10-03

This milestone completes the v836–v850 development plan on top of the existing Business Stable runtime.

## Scope completed

1. **v836 UI Cleanup** — feature navigation and settings are grouped by real work instead of one long mixed menu.
2. **v837 Project Command Center** — project-level BOQ, transaction entry, edit, project-cost accounting, documents, guarantees and contract/letter controls are available together.
3. **v838 Accounting Workspace** — a direct Accounting Center entry exposes AR/AP, bank reconciliation, month-end, GL, trial balance, statements, tax/document controls, project cost and executive accounting.
4. **v839 BOQ Workspace** — BOQ shows the four-stage flow: import → AI/OCR → review → save/manage, while retaining upright-only OCR and monotonic 1–100% progress.
5. **v840 Expense / Receipt AI** — photo expense entry exposes the four-stage scan flow and remains human-review-before-save.
6. **v841 Document Center** — quote → bill → payment → receipt lifecycle is visible without changing existing document lineage safeguards.
7. **v842 Contract / Government Work** — procurement and contract work are discoverable through the project workflow; Variation, EOT, timeline, evidence and letter follow-up remain project-scoped.
8. **v843 Guarantee Center** — ≤30-day guarantee alerts can be dismissed for the current day without deleting the underlying guarantee record.
9. **v844 Owner Reports** — liquidity, AR, AP and guarantee return exposure are grouped with a direct link to Accounting.
10. **v845 Mobile / iPhone UX** — 16px form controls, safe-area handling and landscape workspace behavior are retained/enhanced.
11. **v846 Data Integrity** — Integrity Gate aggregates Data Health, Document Flow, Billing, duplicate detection and the frozen storage contract without mutating records automatically.
12. **v847 Performance** — long registers use browser content-visibility/contain-intrinsic-size so large lists render with less layout cost while keeping full data available.
13. **v848 Google Workspace** — source support remains ready, but live connection remains intentionally paused until OAuth credentials are configured. AREA Ledger remains the source of truth.
14. **v849 Production Business Acceptance** — release QA, staging live acceptance and production cutover are required for the exact deployed SHA.
15. **v850 Stable Workspace Milestone** — UI/workflow contracts are covered by regression QA.

## Frozen compatibility contracts

These are intentionally unchanged:

- `APP_RELEASE=800`
- Service worker URL contract `sw.js?v=800`
- localStorage key `site-ledger-v1`
- IndexedDB name `site-ledger-db`
- Cloudflare remains the active runtime; legacy hosting is recovery-only.
- Human review remains required before OCR-derived accounting/BOQ data is committed.
- Google Workspace does not replace the Cloud Ledger or AREA Ledger accounting source.

## Production acceptance

A v850 production acceptance is complete only after:

- Release QA passes for the exact source SHA.
- Staging deploy and live acceptance pass for that same SHA.
- One-time production authorization is re-armed.
- Production preflight, full QA, deploy, D1 migration, redeploy and live acceptance pass.
- The one-time production authorization marker is removed again immediately after success.

Real-device iPhone field acceptance and any Google OAuth activation remain explicit user-side acceptance/configuration steps rather than being auto-certified by source code.
