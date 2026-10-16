# AREA Ledger icon audit — v1078

## Main screens — all 15 render routes

| Screen | Icon treatment |
| --- | --- |
| Overview | Page/section identity, report shortcuts, existing category rows |
| Transactions | List summary identity, existing category rows, review/filter tools |
| Add transaction | Existing category family, page identity, save controls |
| Projects | Directory identity and project management actions |
| Project detail | Heading, BOQ, accounting, documents, guarantee and worksite actions |
| BOQ | Heading, import/export, edit and linking tools |
| Guarantees | Heading, registration/edit/return/export tools |
| Receivables/payables | Heading and payment tools |
| Reports | Overview identity, finance sections and accounting/export tools |
| Documents | Heading, quotation/billing/receipt tiles with matching colors |
| Document list | Heading and document controls |
| Procurement | Heading and material/contract tiles |
| Company profile | Edit/share/post/loan controls; company identity assets preserved |
| Report print preview | Toolbar actions only |
| Business document print preview | Toolbar actions only |

## Dialog coverage

The shared heading/action/section treatment applies to dialogs. Browser-checked examples: settings, accounting, GL, trial balance, financial statements, chart of accounts, month end, tax register, audit, backup, restore, Google Workspace, health, integrity, project edit, BOQ edit, guarantees, profile edit/post, loan list/edit, feedback, bill payment, payable payment, contractor package, site event, contract change, time extension, transaction details, OCR expense batch, quotation and business document editors (32).

## Checks

- Main views checked at 320, 390 and 768px; dialogs at 390px: 77 renders.
- All checked views/dialogs include icon coverage; no undefined SVG path or root horizontal overflow.
- Compare decorated render against the original render after existing BOQ metadata normalization; decoration leaves financial state unchanged.
- Decorative SVGs are hidden from assistive technology; text labels, record IDs, action attributes and disabled states stay intact.
- Repeated decoration is idempotent. Existing SVG buttons and transaction rows are not duplicated.
- Dynamic OCR totals continue to update while retaining the save icon.
- Printing hides decorative UI icons and preserves the document body.
- Source and automated checks do not substitute for checking on the user's physical iPhone.
