# AREA Ledger — v900 Business Stable Candidate

Date: 2026-10-03

This candidate executes the post-v850 acceptance plan across phases 1–10 without weakening the existing human gates.

## Acceptance phases

1. **Field Acceptance / iPhone** — source and CI safeguards are ready, but physical iPhone/Safari confirmation remains manual. The application must not mark this phase complete automatically.
2. **BOQ real-world acceptance** — representative Excel/BOQ fixtures, upright-only image OCR, 1–100% monotonic progress, review-before-save, duplicate/integrity protections.
3. **Receipt / expense OCR acceptance** — representative small-shop cash receipt parsing, category suggestion, confidence gate and human review before save.
4. **Accounting reconciliation** — AR receipt lineage, document flow, billing reconciliation and balanced Trial Balance are tested together.
5. **Project control** — contract value, actual cost, cash received, forecast profit and contract-control deadlines are cross-checked.
6. **Performance** — transaction register is bounded to 120 rendered rows per batch and BOQ to 200 rows per batch; stress QA uses 10,000 transactions and 2,000 BOQ rows.
7. **Backup / recovery drill** — backup format/checksum, restore parse, canonical business digest and Data Health round-trip are covered.
8. **Final UI cleanup** — categorized navigation, workflow strips, safe-area behavior and mobile controls remain regression-protected.
9. **Google Workspace** — source remains ready but live OAuth connection is intentionally paused. AREA Ledger remains the source of truth.
10. **Stable release gate** — automated QA/Staging/Cloudflare acceptance may pass, but final Stable certification still requires current physical iPhone Field Acceptance and Accounting Freeze evidence.

## Compatibility freeze

No storage migration is introduced by this candidate.

- APP_RELEASE remains 800.
- APP_CHANNEL remains stable.
- localStorage remains `site-ledger-v1`.
- IndexedDB remains `site-ledger-db`.
- Service worker registration remains `sw.js?v=800`.
- Accounting policy remains 1.0.

## Production rule

The exact production SHA must pass Release QA, Staging deployment, D1 migrations, redeployment and live Cloudflare acceptance. Production authorization is one-time and must be removed immediately after successful cutover.

## Manual acceptance boundary

CI cannot certify physical Safari keyboard behavior, real camera capture quality, Wi‑Fi/5G switching, actual offline/online transitions or user review of a real receipt/BOQ. Those checks remain explicit human evidence in the existing Field Acceptance control.
