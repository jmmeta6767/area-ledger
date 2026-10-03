const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8');

assert(src.includes('v1039 full-app UX/UI audit · every view + every bottom sheet'),'missing full-app UX layer');
assert(src.includes("document.body.setAttribute('data-view',v)"),'universal view scope missing');
assert(src.includes("document.body.setAttribute('data-sheet-kind',U.sheet&&U.sheet.kind?String(U.sheet.kind):'')"),'sheet-kind scope missing');
assert(src.includes("document.body.classList.toggle('sheet-open',!!U.sheet)"),'sheet-open state missing');

const views=['home','profile','list','add','projects','project','boq','due','guarantees','report','print','docs','procurement','doclist','quoteprint'];
for(const v of views){
  assert(src.includes(v+':1')||src.includes("'"+v+"'")||src.includes('="'+v+'"'),'renderable view missing '+v);
}
const scoped=['home','list','add','projects','project','boq','due','guarantees','report','print','docs','procurement','doclist','quoteprint','profile'];
for(const v of scoped)assert(src.includes('[data-view="'+v+'"]'),'responsive UX scope missing '+v);

for(const sel of ['.project-finance-kpis','.list-command-summary','.add-core-card','.project-hub-actions','.project-command-grid','.boq-summary-grid','.due-command-grid','.guarantee-mobile-summary','.owner-report-command','.docs-command-summary','.proc-grid','.doc-mobile-row','.profile-post-actions','.master-sheet'])
  assert(src.includes(sel),'major page family not audited '+sel);

assert(src.includes('@media(max-width:600px)'),'600px mobile breakpoint missing');
assert(src.includes('@media(max-width:430px)'),'430px iPhone breakpoint missing');
assert(src.includes('@media(max-width:380px)'),'380px narrow iPhone breakpoint missing');
assert(src.includes('overflow-x:auto!important'),'horizontal overflow safety missing');
assert(src.includes('overscroll-behavior-inline:contain'),'tab overscroll containment missing');

assert(src.includes('boqAiPageTotalCheck'),'BOQ page-total reconciliation contract changed');
assert(src.includes('aiEquationMismatch'),'BOQ row arithmetic verification contract changed');
assert(src.includes("KEY='site-ledger-v1'")||src.includes("const KEY='site-ledger-v1'"),'storage key contract missing');
assert(src.includes("'site-ledger-db'"),'IndexedDB contract missing');
console.log('PASS v1039 full-app UX/UI audit regression');
