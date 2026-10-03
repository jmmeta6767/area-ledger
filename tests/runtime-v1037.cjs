const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8');
function fn(name){const p=src.indexOf('function '+name+'(');assert(p>=0,'missing '+name);const n=src.indexOf('\nfunction ',p+10);return src.slice(p,n<0?src.length:n);}

for(const name of ['runtimeDiag','runtimeNow','runtimeScheduleRender','runtimeActionSignature','runtimeActionDuplicate','runtimeDiagnosticsSnapshot','runtimePageRelease'])assert(src.includes('function '+name+'('),'missing '+name);
assert(src.includes('runtimeDiag:{startedAt:Date.now()'),'ephemeral runtime diagnostics state missing');
assert(src.includes("if(runtimeActionDuplicate(el)){e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();return;}"),'duplicate write action guard missing');

const guard=fn('runtimeActionDuplicate');
for(const a of ['save','saveMore','saveBillPayment','apPaySave','saveBizDoc','saveQuote','manualJournalSave','bankReconcile','periodClose'])assert(guard.includes(a+':'),'protected action missing '+a);
assert(guard.includes("sig=runtimeActionSignature(a)"),'payment-aware action signature missing');assert(guard.includes('now-last<750'),'duplicate action window changed');

const sig=fn('runtimeActionSignature');assert(sig.includes("apPayAmount")&&sig.includes("apPayDate")&&sig.includes("apPayMethod"),'AP payment signature missing');assert(sig.includes("payAmount")&&sig.includes("payDate")&&sig.includes("payMethod"),'bill payment signature missing');

const exp=fn('expenseScanProgressSet'),batch=fn('expenseBatchScan');
assert(exp.includes('runtimeScheduleRender()'),'expense scan progress should coalesce renders');
assert(batch.includes('runtimeScheduleRender()'),'batch progress should coalesce renders');

const renderFn=fn('render');
assert(renderFn.includes('runtimeStart=runtimeNow(),runtimeState=runtimeDiag()'),'render timing start missing');
assert(renderFn.includes('runtimeState.maxRenderMs=Math.max'),'render timing accounting missing');

assert(src.includes("document.addEventListener('visibilitychange'"),'visibility lifecycle listener missing');
assert(src.includes("window.addEventListener('pageshow'"),'pageshow BFCache listener missing');
assert(src.includes("window.addEventListener('pagehide'"),'pagehide cleanup listener missing');
assert(src.includes("if(!(e&&e.persisted))runtimePageRelease();"),'BFCache-safe release contract missing');

assert(src.includes("class=\"card runtime-diagnostics\""),'advanced runtime diagnostics UI missing');
assert(src.includes('Render ล่าสุด / สูงสุด'),'runtime render diagnostics label missing');
assert(src.includes('Safari BFCache restore'),'BFCache diagnostics label missing');

assert(src.includes("boqAiCoverage(aiRows,pages,aiDeclared,aiPageCounts)"),'BOQ AI coverage contract changed');
assert(src.includes('aiEquationMismatch'),'BOQ arithmetic verification must remain present');
assert(src.includes("KEY='site-ledger-v1'")||src.includes("const KEY='site-ledger-v1'"),'storage key contract missing');
assert(src.includes("'site-ledger-db'"),'IndexedDB contract missing');
console.log('PASS v1037 Safari long-session stability regression');
