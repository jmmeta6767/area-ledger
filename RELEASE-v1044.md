# AREA Ledger v1044 — reject malformed OCR rows

## Fix

An OCR row with English recognition noise could survive as a “strong” table/equation row even with quantity, price and amount all equal to 1 and no unit. The Thai labor suffix was also counted as evidence that the description itself was Thai. The preview then showed zero malformed rows because scanned validation did not require a unit or meaningful description, and final confirmation did not block that state.

v1044 removes category suffixes before evaluating name evidence, tightens strong-row rescue to require a plausible unit/scale and Thai or recognized construction term, counts unreadable or unitless scan rows as invalid, and blocks OCR import until the user corrects or removes invalid rows. Valid noisy descriptions backed by a real unit and row evidence remain available for human review.

## Verification

- Regression reproduces the screenshot row (`EET EE Erin aay. he, aR — ค่าแรง`, qty/price/amount 1, blank unit, 100% OCR, equation and row-band flags) and verifies filtering, invalid count, and no save on confirmation.
- Existing tests continue to cover real equation-backed BOQ lines, review-before-save and multi-page handling.
- Candidate QA and staging/production acceptance are pending.
