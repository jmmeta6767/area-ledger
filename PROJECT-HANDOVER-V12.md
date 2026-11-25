# AREA Ledger V12 — Project Handover Workflow (Staging Candidate)

## Scope
This change adds an owner's **ส่งงาน / ตรวจรับ** action from Home, Projects list, and the project detail. The existing project editor and financial records are preserved. A handover is not the same as a financial project close.

## Stages
1. **ยื่นหนังสือส่งงาน / submitted:** require submission date and document number. Keep existing project status unchanged (usually `active`); do not set `deliveryDate` or calculate retention maturity.
2. **ตรวจรับแล้ว / accepted:** require a date on or after submission, the accepting person/agency, and explicit confirmation. Set `status=delivered`, store `deliveryDate`, and (for a pending existing contract guarantee) derive `retDue` from delivery + 2 years using the existing app rule. **Do not set `status=closed`.**
3. Already delivered or closed projects show a read-only handover overview here. Legacy dates and explicit manual due dates are preserved.

Data written on the project record is `handover={stage,submittedDate,letterNo,recipient,acceptedBy,acceptedDate,evidenceRef,note,updatedAt}`. All content is escaped when rendered. The evidence reference is plain text **not a file upload**; existing documents and real photos stay in their current modules.

## Safety invariants
- No automatic revenue, paid expense, guarantee refund, receipt, D1 or R2 write; `projectHandoverPlan()` is nonmutating.
- Only existing owner UI may save (it does **not** constitute server-side role authorization).
- New due dates are applied only to unreturned cash-like guarantees with missing dates or dates that match the previous auto-derived date; explicit custom due dates, returned guarantees, unrelated projects and bank guarantees are preserved.
- On failed `persist()`, restore the entire pre-mutation state, including audit log and guarantees. Rejected repeated submissions do not save again.
- Existing `site-ledger-v1` and `site-ledger-db` keys are unchanged. No migration or delete of historical records.

## QA / release
- `node tests/qa.cjs` now validates submission, acceptance, date rules, duplicate behavior, custom guarantee due dates, and sheet rendering.
- Validate on real iPhone Safari and installed PWA at 320–430 CSS px, keyboard, scrolling, offline/reload, storage-quota failure, click double-taps and current owner data with a fresh verified backup.
- This branch is based on main `d07df1c146db7e477dc4f2ce4d5a0f39b131a52e`; PR #263 is open and overlaps the app shell. Rebase only on **new latest main** before any merge and review conflicts with the storage/async persist candidate.
- Run exact-head Release QA, iPhone Layout, candidate Staging and required external Cloudflare checks. Never bypass Production Gate. No Production authorization is created by this change.

## Follow-up (out of V1 scope)
Generate a formal Thai handover letter/PDF, upload independent evidence to private R2 with readback, reminders for pending acceptance, multistage inspection/defect reports, and a reviewed workflow to amend an accepted record.
