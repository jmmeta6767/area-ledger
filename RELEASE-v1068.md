# AREA Ledger v1068 — compact banking-style transaction entry

The add-entry page used oversized labels and stacked borders that pushed payment fields far below the amount. This release applies the approved navy header and yellow action palette, clearer section headings, stronger input borders, and smaller vertical spacing.

- Amount precedes project and category in the entry section.
- Partner and transaction date are grouped with payment status/method.
- Frequent-description suggestions collapse by default, while typed descriptions remain visible.
- Existing categories, field IDs, data attributes, scan/voice controls, save/save-more, OCR checks and accounting handlers remain intact.
- Styling is scoped to the add-entry view; storage keys and financial calculations are unchanged.
- Build identity/cache advances to 1068, retaining release 800 and guarded PWA updates.

Validation: 607 Node QA groups; reliability regression; UX regression; Chromium layout suite (browser/safe-area simulation, 320/375/390/430/768 widths and landscape, OCR batches 1/11/60); focused entry interactions (all five expense categories, paid/unpaid, cash, income/expense). Focused 390px synthetic fixture shrinks from 1678 to 1326px, with no horizontal overflow at tested widths.

Physical iPhone Safari/PWA and real OCR/microphone capture remain device checks. No production accounting records were used or written by these tests.
