# OCR acceptance baseline v1049

Source of truth for the application code: GitHub `main` at `c74de3937bc5c43390d2e69d2a135dee48e1855b`.

## Reference case from the user's screenshots

The screenshots show a Thai expense table with three known rows. The original pictures are not copied into this public repository because they contain project and financial information. The expected facts below are transcribed from the screenshots and intentionally contain no project or payee names:

| Row | Amount (THB) | Date visible in that row | Payment status |
| --- | ---: | --- | --- |
| 1 | 6,000.00 | 4 August 2026 | Paid |
| 2 | 17,000.00 | No date shown | Unpaid |
| 3 | 54,600.00 | No date shown | Unpaid |

The known subtotal is **77,600.00 THB**. A date from another row or another image must not be copied into rows 2 or 3. The app's screenshot showed 7 October 2026 for row 3, which does not match the source table; this is a review error to catch. The larger 83,375.00 total in another capture covers six selected rows and is a separate case; it must not be treated as the three-row subtotal.

## Acceptance rules

- Keep one expense per source row. Do not fold the three amounts into a single entry.
- Keep the exact source amounts: 6,000.00, 17,000.00 and 54,600.00 THB.
- Keep only the first row's visible date. Leave dates for rows 2 and 3 blank until a person verifies them.
- Keep the first row paid and the other two unpaid. Require a channel only for the paid row.
- Show the source image beside each row in review. The confidence percentage is an AI estimate and is not proof that the row is correct.
- Block saving while a selected row is missing a date, payment status, amount, or the required paid channel. Preserve all edits if save fails.
- Do not store the screenshot or any extracted real project/payee details in the test fixtures.

## Verification boundary

`tests/reliability-v1048.cjs` exercises the actual client review and save handlers with synthetic text-only rows based on the known table values. This checks normalization, review presentation, total arithmetic, and blocking rules. It does **not** certify the live Vision provider's image-reading accuracy. Provider accuracy needs a private, manually labeled set of receipt/table images and a staging evaluation run with the production model configuration; keep those images outside the public repository and record only aggregate pass/error counts here.

| Live provider run | Correct rows / labeled rows | Exact amount rows | Exact date rows | Exact payment states | Reviewer |
| --- | ---: | ---: | ---: | ---: | --- |
| Pending private image set | — | — | — | — | — |
