# AREA Ledger — v920 BOQ Acceptance Pack

This pack defines the minimum BOQ acceptance matrix before v1000 may be treated as operationally stable for BOQ work.

## Automated fixture families
- Excel-style table with Thai headers.
- Material-only row.
- Labor-only row.
- Mixed material/labor rows.
- Quantity/unit/price/amount equation row.
- OCR row with shifted/dynamic columns.
- Sparse/garbage OCR rejection.
- Duplicate import protection.
- Invalid quantity/price rejection.
- Large BOQ register with bounded rendering.

## Required real-document families
These remain manual until actual files are supplied/tested:
1. Government-style Excel BOQ.
2. Text PDF BOQ.
3. Scanned/image PDF BOQ.
4. Upright phone photo of a BOQ page.
5. BOQ with unclear table lines.
6. BOQ containing both material and labor columns.
7. BOQ with handwritten/circled annotations near printed values.

For each real document compare row count, description, quantity, unit, material/labor classification, unit price, extended amount, and grand total or declared total when present.

## Review rules
- Scanned/image BOQ is always manual-review-required.
- Any row marked ocrNeedsReview must be checked against the source image.
- Any low-confidence row must not be treated as verified merely because import succeeds.
- Preview is mandatory before save/import.
- AREA Ledger remains the authoritative accounting/BOQ store; Google Workspace remains optional and paused until separately activated.
