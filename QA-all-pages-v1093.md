# v1093 — All-page visual consistency

Base: main efd0d3809928b6411782737af1ade0547d4f22bd (v1092).

Extends page accents and raised surfaces to transaction filters, project details/folds, BOQ sections, due summaries, guarantee register, reports, document types/registers, procurement, profile records, settings/backup dialogs and document preview toolbar. Existing alert/overdue/validation colors, financial values, labels, calculations and handlers remain in place. Printed paper stays neutral.

Payroll receives a matching navy/teal/gold finish, readable secondary text, 44px actions and 16px inputs. Its wage engine, monthly backup limit, data keys and separation from the main ledger remain unchanged. New isolated browser coverage checks four tabs, long names, employee/advance dialogs, six widths (320–1280px), tap/input sizes, totals, print, axe and zero mutations from browsing. Both Release QA and exact-head staging run it.

Required acceptance: complete regression, 15-view/70-dialog catalogue, keyboard/voice/OCR, icon fallback, dark-OS and A4 workflows, payroll suite and exact-SHA staging. Review CI screenshots before merge. Local browser execution has an environment socket limitation; CI is the browser evidence source. Record accepted head and run/artifact IDs in the PR.

No production authorization, customer data changes, real Google writes, restore or migrations. Physical iPhone acceptance remains separate from Chromium emulation.
