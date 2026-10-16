# v1078 — Icon coverage across the application

Extend the v1076 colored line-icon family to page headings, project tools, document actions, accounting panels, settings sections, backups, cloud tools and editor dialogs. Preserve existing icons instead of duplicating them. Use consistent rounded tiles for document shortcuts and distinct navigation colors. Dynamic OCR save labels retain their icon after edits.

The presentation helpers preserve text, action keys, record IDs, disabled states and existing card structure. Print previews receive toolbar icons; printed document content is unchanged. Logo and avatar assets are unchanged. No new remote dependency or financial/storage behavior is introduced.

Validation: 612 QA groups and existing storage regressions; 5 new presentation invariants cover attributes, escaped labels, nested controls, repeat decoration and printed content. Browser audit: 15 views at 320/390/768px plus 32 representative dialogs (77 checks), with icons present, no invalid SVG paths, no root horizontal overflow and no financial-state change attributable to decoration.

See UI-ICON-AUDIT-v1078.md for coverage.

Integration: rebased onto main 7ba7b49 (receipt-total and repeatable-voice v1077). Both OCR/voice and icon regression suites remain enabled.
