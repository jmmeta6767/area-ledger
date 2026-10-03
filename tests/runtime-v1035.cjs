const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8');
function fn(name){const p=src.indexOf('function '+name+'(');assert(p>=0,'missing '+name);const n=src.indexOf('\nfunction ',p+10);return src.slice(p,n<0?src.length:n);}

const home=fn('vHome');
assert(home.includes('all.forEach(function(t){'),'dashboard single-pass aggregation missing');
assert(home.includes('var paid=txPaidNet(t),due=txOutstandingNet(t);'),'dashboard paid/outstanding values must be computed once per row');
assert(home.includes('cnt={all:all.length,in:inCount,out:outCount'),'dashboard type counts must reuse aggregate pass');
assert(!home.includes("all.filter(function(t){return t.type==='in'&&txPaidNet(t)>.01;}"),'old repeated dashboard paid-in scan returned');

const list=fn('vList');
assert(list.includes('searchTokens=listQueryTokens(F.q),searchCache=Object.create(null)'),'list per-render search cache missing');
assert(list.includes('function searchOf(t)'),'list cached searchable text helper missing');
assert(list.includes('var visible=base.filter(queryMatch)'),'list visible filtering must reuse cached query matcher');
assert(list.includes("data-list-search=\"'+esc(searchOf(t))+'\""),'list markup must reuse cached searchable text');

const boq=fn('vBoq');
assert(boq.includes('rowIndex=new Map()'),'BOQ row index map missing');
assert(boq.includes('rows.forEach(function(x,ri){'),'BOQ one-pass aggregate missing');
assert(boq.includes('var amount=boqAmount(x)'),'BOQ amount should be calculated once in aggregate pass');
assert(boq.includes('var i=rowIndex.get(x)'),'BOQ render must use Map row lookup');
assert(!boq.includes('rows.indexOf(x)'),'O(n^2) BOQ index lookup returned');

assert(src.includes('v1035 runtime performance polish · off-screen paint containment'),'v1035 paint containment layer missing');
assert(src.includes('@supports (content-visibility:auto)'),'content-visibility feature guard missing');
assert(src.includes('.list-row-wrap,.boq-check-row{'),'long-row paint containment missing');
assert(src.includes('Math.max(120,+U.listRenderLimit||120)'),'transaction incremental render ceiling changed');
assert(src.includes('Math.max(200,+U.boqRenderLimit||200)'),'BOQ incremental render ceiling changed');
assert(src.includes("KEY='site-ledger-v1'")||src.includes("const KEY='site-ledger-v1'"),'storage key contract missing');
assert(src.includes("'site-ledger-db'"),'IndexedDB contract missing');
console.log('PASS v1035 runtime performance regression');
