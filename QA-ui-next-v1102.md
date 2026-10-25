# v1102 — full-screen workspace and usable forms

Built on main04b1766, retaining the latest verified R2 receipt offload, portable backup, OCR retry and payroll logic. Source and cache identity advance together to1102; APP_RELEASE800 and all Ledger/Payroll storage identities remain unchanged.

The shared screen-only layer replaces the earlier banking finish rather than adding another decorative theme. Navy/gold controls, white surfaces, neutral backgrounds, consistent input sizes and financial number hierarchy cover the main views and dialog catalogue. User-provided menu artwork and financial status meanings remain. Print CSS and document calculations are preserved.

Profile identity and cover now precede company/sync tools; floating profile controls stay within the actual cover on mobile and desktop. Main headings are semantic without adding duplicate page banners. BOQ retains the item/section counts in its subtitle, removes their duplicate cards, places primary actions in one row and keeps an honest, collapsed import guide. Actual financial rows must remain reachable above bottom navigation.

Settings now prioritizes business, bank and routine backup/accounting tasks; technical support is collapsed. UI-only drafts retain unsaved text across immediate toggles, never commit it as a side effect, and are cleared on close. The existing recovery-key confirmation can complete two taps without losing the typed key; editing the key invalidates its earlier confirmation. It is not copied into a new persistent store or logs. Each dialog creates its own header Close so footer Cancel/Save remain intact.

Payroll retains wage, advance and monthly-backup logic. Its tabs announce selection and support arrow/Home/End navigation. Dialogs contain focus, isolate the background, support Escape and return to the appropriate launcher after its DOM node is replaced.

The UI fixture serves actual local styles, artwork and images; unknown API routes and external requests are blocked. This corrects old tests that returned HTML for stylesheet requests. The all-page catalogue covers15views and70sheets at320/375/390/430/768/1280, automated WCAG-tagged axe checks, keyboard/dialog interactions, isolated AR/AP/BOQ/settings workflows and one-page A4 output. New geometry checks protect cover controls, readable amount input, BOQ row reachability and default states. Settings/backup draft regressions use synthetic keys and make no remote calls.

These are automated browser and keyboard checks, not accessibility certification or a physical-device test. Real customer backup restoration and customer Sheets are not exercised by this UI release.
