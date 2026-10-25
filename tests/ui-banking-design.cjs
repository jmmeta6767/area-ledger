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
// Real view coverage, geometry and interactions are exercised by full-system-ux.
for(const selector of ['.app-social-topbar','.nav button.on','.project-finance-kpis',
  '.master-form-page','.system-dialog','.boq-summary-grid']){
  assert.ok(css.includes(selector),'Missing scoped styling for '+selector);
}
assert.ok(!css.includes('@media print'),'UI layer may not alter A4 print output');
assert.ok(!css.includes('localStorage')&&!css.includes('indexedDB'),'UI layer may not manipulate storage');
assert.match(payroll,/Banking UI consistency pass/);
assert.match(payroll, /@media print/);
assert.match(payroll, /@media screen/);
assert.match(payroll, /const KEY='area-ledger-payroll-v1'/);
const version=JSON.parse(index.match(/var APP_BUILD=(\{[^\n]+\});/)[1]).version;
assert.ok(sw.includes('source-candidate-'+version+'-'),'cache and source versions agree');
assert.match(sw, /'assets\/ledger-reliability\.css'/);
assert.match(sw, /'payroll\.html'/);
console.log('PASS banking UI layer: main views, payroll, print, dark opt-out and PWA cache');
