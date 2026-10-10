# AREA Ledger v1054

Polishes the mobile expense amount field for a calmer visual hierarchy: the outer card uses a neutral surface with a small amber accent, the control uses one visible focus ring, and the amount text scales more gently on narrow screens. Accounting behavior, review-before-save, storage identifiers, and the stable accounting release remain unchanged. The PWA cache/build identity advances so installed copies can receive the updated interface.

## Validation

- `node tests/qa.cjs`
- `node tests/iphone-layout.cjs` at 320, 375, 390, 430, and 844 CSS px wide, including landscape and safe-area simulation.
- `node tests/reliability-v1048.cjs`
