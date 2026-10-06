# iPhone PWA layout correction on v1044

Baseline: main `5dac2923285352bf5be0602b8050a303f0931ae5`. Production at start: v1044 `78fa553cceb17a1f8500f9fad9bc978eb452713f`; production gate absent; /ready healthy. Existing malformed OCR row rejection remains intact.

Follow-up evidence from user-provided iPhone captures exposed a later `max-width:430px` / `380px` override restoring the dashboard expense-status cards to two narrow columns. The original v1044 layout regression now pins the deployed baseline `86b5c5948fba70ee8e839036160fb4d9dcb0a075`, reproduces the split `฿237,711.80` / `฿66,775.00` amounts at 390px, and verifies the corrected one-column, single-line output at 320 / 375 / 390 / 430px and 844px landscape. Status cards stack vertically through the narrow tablet breakpoint; all amount digits and decimals remain unchanged.

## Observed in source and Chromium

- Money styles allowed arbitrary mid-number wrapping. Mobile KPI and summary grids now allocate a full row and preserve unbroken currency text.
- Project action grids retained four-column declarations for three buttons, with later narrow-screen overrides. The three actual actions now share three equal columns with minimum 44px targets. Budget/received/paid are separate mobile rows without vertical separators.
- Sheets rendered both a pseudo-element handle and a real handle. Only the real handle remains.
- Later sheet height overrides bypassed the existing VisualViewport height. The final rule now observes that height with a dvh fallback and top safe-area limit.
- Root safe-area padding overlapped responsibility with header/navigation. Root padding is removed; header owns the top inset and existing navigation owns the bottom inset.
- Background scrolling was not locked while a sheet was open. An ephemeral position snapshot now freezes the body and restores the scroll position after the closing render. No touchmove cancellation.
- Expense controls had narrow two-column layouts, small font overrides and native date intrinsic sizing risk. Mobile fields now use one column, 16px text and bounded date boxes. The action bar is in document flow after the last row, so it cannot cover editable fields. The heading also stays in flow.

## Validation

- All 29 existing CJS suites passed, including 554 main QA groups, v1044 malformed OCR, multi-expense selection/save/rollback, accounting/storage, and deployment gates; BOQ quality contract and syntax checks passed.
- `tests/iphone-layout.cjs` checks synthetic data at 320/375/390/430 and 844x390, browser and 44px/34px safe-area simulation; Dashboard, Projects, BOQ and expense review with 1/11/60 rows.
- Checks document width, date bounds, unbroken money styles, 44px actions, final-action reachability, retained edits/selection, viewport shrink and modal scroll restoration. Before/after PNGs and JSON measurements are emitted as CI artifacts.
- No accounting formula, amount formatting, BOQ values, OCR extraction/validation, save handlers, storage key, migration or production workflow change.

## Follow-up: iPhone project editor and BOQ utilization

Inspection of main `0762cc88` found that `budgetPct` divided project costs by the editable `p.budget` field. When that field was zero or differed from the BOQ total, the Projects screen reported 0% or a misleading ratio despite recorded expenses. The derived indicator now uses the existing BOQ summary: expense base divided by the sum of BOQ quantity × unit price; it stays at 0% when no BOQ budget exists. Displayed expense amounts, accounting calculations, and stored records are unchanged.

The project editor scrim previously followed VisualViewport height and top offset only. It now follows VisualViewport width and horizontal offset when Safari changes the visible viewport (including zoom/keyboard presentation). The editor sheet and fields have bounded min-widths, and the save bar stays inside the sheet. Chromium measured the previous save bar extending 2 CSS px past the sheet at 430px (sheet: 0–430px, save bar: −2–432px); the regression verifies that this is gone.

`tests/project-mobile-budget.cjs` checks a 25% result from a synthetic 100,000 expense against a 400,000 BOQ, zero BOQ behavior, 320/375/390/430px portrait, 640×360 and 844×390 landscape, and a simulated 300px VisualViewport shifted 90px horizontally. It asserts sheet, fields, footer and document bounds and emits after screenshots for the project card and editor. These are Chromium viewport simulations; they are not physical iPhone Safari or standalone-PWA acceptance.

## Limits

The supplied iPhone screenshots were inspected; the Dashboard split-amount defect was reproduced in Chromium at 390 CSS px and corrected. Other screenshot details were already covered by the earlier v1044 layout work, but native iOS date controls, real keyboard behavior, standalone launch/rotation, rubber-band gestures and VoiceOver were not exercised on a physical iPhone in this run. The browser test is Chromium emulation with CSS safe-area substitution, not Safari/PWA certification. It also does not establish a device-specific horizontal-overflow cause beyond the reproduced dashboard wrapping override.
