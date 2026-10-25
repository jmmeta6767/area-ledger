'use strict';
/* Structural guard for presentation-only banking UI update.
   Browser geometry, axe and interaction checks remain in iphone-layout/payroll-layout. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const css=read('gateway/public/assets/ledger-reliability.css');
const index=read('gateway/public/index.html');
const payroll=read('gateway/public/payroll.html');
const sw=read('gateway/public/sw.js');

assert.match(index, /href="assets\/ledger-reliability\.css"/);
assert.match(css,/AREA Ledger banking UI finish/);
assert.match(css, /@media screen/);
assert.match(css, /:root:not\(\[data-theme="dark"\]\)/);
for(const selector of ['.master-ref-header','.nav button.on','.mdash-stats>button',
  '.project-hub-card','.master-due-card','.master-doc-row',
  '.master-form-page','.expense-review-sheet','.google-sync-scope',
  '.master-report-card','.project-lifecycle-overview']){
  assert.ok(css.includes(selector),'Missing scoped styling for '+selector);
}
assert.ok(!css.includes('@media print'),'UI layer may not alter A4 print output');
assert.ok(!css.includes('localStorage')&&!css.includes('indexedDB'),'UI layer may not manipulate storage');
assert.match(payroll,/Banking UI consistency pass/);
assert.match(payroll, /@media print/);
assert.match(payroll, /@media screen/);
assert.match(payroll, /const KEY='area-ledger-payroll-v1'/);
assert.match(css,/v1100: touch, focus and financial-error visibility/);
assert.match(css,/min-height:44px/);
assert.match(css,/font-size:16px/);
assert.match(css,/prefers-reduced-motion:reduce/);
const iphone=read('tests/iphone-layout.cjs');
assert.match(iphone,/data-ledger-ui-real/);
assert.match(iphone,/actualBankingCss/);
assert.match(iphone,/Banking CSS must be applied/);
assert.match(sw, /1098-native-voice-end-ui-banking-finish/);
assert.match(sw,/v1100-a11y/);
assert.match(sw, /'assets\/ledger-reliability\.css'/);
assert.match(sw, /'payroll\.html'/);
console.log('PASS banking UI layer: main views, payroll, print, dark opt-out and PWA cache');
