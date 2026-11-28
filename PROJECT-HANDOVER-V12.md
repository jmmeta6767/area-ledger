# AREA Ledger V12 — Project Handover, Inspection and A4 Letter

**Scope:** Draft PR #266 based on open Draft #265, with integration target GitHub `main`. It builds no production credentials or database migrations, and is not an authorization to release.

## User journey
1. From Dashboard, Projects or Project Detail choose **ส่งงาน / ตรวจรับ**.
2. Select **ยื่นหนังสือส่งงาน · รอตรวจรับ**, enter actual submission date and registered letter number. This does not count as acceptance and does not close the project.
3. Use **ดูหนังสือส่งงาน A4 / PDF** to preview a Thai A4 letter built from *saved* project data and company settings. When incomplete the letter is visibly marked **ร่างเอกสาร**. It has a blank signature line. **No signature or legal acceptance is generated.**
4. Print using native **พิมพ์ / บันทึกเป็น PDF** (works with browser print/share) or **ดาวน์โหลด PDF** using the existing html2pdf library; if library load fails, fallback to native print. Users must inspect the print output before formally filing it.
5. Set **นัดตรวจรับแล้ว** and a date, or **ตรวจแล้ว · มีรายการแก้ไข** with inspected date and mandatory defect note. Both stay in the submitted/current-project state, with no two-year retention timer.
6. Only after actual acceptance choose **ตรวจรับแล้ว · ส่งมอบงาน**, enter valid date, inspection party and check explicit acknowledgment. Then project becomes `delivered`, *not* `closed`. The existing guarantee maturity rule (delivery date + two years) applies to eligible outstanding cash guarantees, while explicit owner dates remain untouched.
7. Dashboard shows counts for pending, scheduled, rework and accepted work. Owner project detail shows financial closeout **as a provisional contract-minus-booked-cost spread** (THB and %) with separate AR, AP and contract guarantee balances. It explicitly warns this is neither final profit nor net cash.

## Storage and accounting invariants
- The system stores only plain-text references to evidence in `handover.evidenceRef`, *not* attached raw photo/PDF bytes in `site-ledger-v1`. Existing project documents and site-photo modules remain the places for files. New private R2 uploader and physical readback are **pending**; no Google OAuth upload is implied.
- `handover` fields: `stage` (submitted/accepted), `submittedDate`, `letterNo`, `recipient`, `acceptedBy`, `acceptedDate`, `inspectionStatus` (pending/scheduled/rework/passed), `inspectionDate`, `defectNote`, `evidenceRef`, `note`, `updatedAt`.
- Validation rejects missing letters, future submission/acceptance dates, date inversions, rework without actual inspection date and note, accidental duplicate submissions and edits to already delivered/closed projects through this flow.
- Only `accepted` updates `p.deliveryDate` and `p.retDue` when the guarantee due date was previously empty/auto-derived. Custom due dates, returned guarantees, bank letters and other projects are unaffected.
- Saves use existing `accountingAudit`, `persist()` and full state rollback on failure. **No automatic new income, expense, refund, contractor payment, receipt or cost posting.**
- `projectHandoverCloseout()` is read-only, based on existing `approvedContractValue`, `projectCostWithGuarantees` and `txOutstandingNet`. It is a *booked-cost gross spread*, not a final project margin until ETC and VAT/overhead adjustments are reviewed.
- `S.role='owner'` is a UI-level guard only. Real multi-user authorization remains a separate platform hardening task.
- Existing `site-ledger-v1`, `site-ledger-db`, D1/R2 IDs, restoration and older project records remain unchanged.

## Acceptance and what has not been done
- `tests/qa.cjs` covers functional handover, acceptance, inspection/rework, pure analytics, HTML escaping, A4 document routes and no finance writes.
- `tests/handover-mobile.cjs` is added to required Release QA and PR Staging iPhone-layout jobs; tests synthetic Chromium at 320/375/390/430/844 px and creates an A4 PDF artifact. This **does not count as physical iPhone Safari acceptance**.
- Review PDF typography, multi-page output, Thai accents, offline print fallback, PWA updates, printed signatures, long titles, expected evidence attachment and real Google Workspace consent on an actual device.
- This work is an **isolated Draft candidate**, not in production. Before integrating with [PR #263](https://github.com/jmmeta6767/area-ledger/pull/263), rebase from freshly fetched main and ensure awaited durable-save compatibility. Do not merge both overlapping shells blindly. Work P0–P8 is tracked by [Issue #264](https://github.com/jmmeta6767/area-ledger/issues/264).
- Production release remains held pending owner current-device backup with receipt readback, independent review, exact-head required CI and staged live SHA, Cloudflare checks, native Safari acceptance, and one-time release approval. Never bypass these gates.

## Next increments
- Private R2/Drive evidence attachment with explicit consent, checksum and readback, no duplicate billing/media
- Reminder scheduling for inspection and guarantee maturity
- Controlled correction/amendment of accepted and locked-period records
- Genuine forecast profit percentage based on explicit remaining cost estimate, not misleading provisional spread
