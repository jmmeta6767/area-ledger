/* Native IndexedDB in an isolated browser origin. No live app or user ledger. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const script=fs.readFileSync('gateway/public/assets/ledger-primary-store.js','utf8');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});try{
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('https://primary-store.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><script>'+script+'</script>'}));
 const page=await context.newPage();await page.goto('https://primary-store.test/');
 const expected=await page.evaluate(async()=>{window.store=AreaLedgerPrimaryStore.create();const old={projects:[],tx:[{id:'old',amount:99}]};window.oldCommit=await store.save(old,null);window.fixture={projects:Array.from({length:6},(_,i)=>({id:'p'+i})),boq:Array.from({length:32},(_,i)=>({id:'b'+i,qty:1,price:100})),tx:Array.from({length:112},(_,i)=>({id:'t'+i,amount:500+i,photo:'data:image/jpeg;base64,'+'A'.repeat(70000)+i}))};window.pending=await store.stage(fixture);if((await store.load()).state.tx[0].id!=='old')throw Error('staging replaced current data');return AreaLedgerPrimaryStore.hash(JSON.stringify(fixture));});
 await page.reload();
 assert.equal(await page.evaluate(async()=>(await AreaLedgerPrimaryStore.create().load()).state.tx[0].id),'old');
 const saved=await page.evaluate(async()=>{window.store=AreaLedgerPrimaryStore.create();const old=await store.load(),state={projects:Array.from({length:6},(_,i)=>({id:'p'+i})),boq:Array.from({length:32},(_,i)=>({id:'b'+i,qty:1,price:100})),tx:Array.from({length:112},(_,i)=>({id:'t'+i,amount:500+i,photo:'data:image/jpeg;base64,'+'A'.repeat(70000)+i}))};const next=await store.save(state,old.head.id);return next.head;});
 await page.reload();
 assert.equal(await page.evaluate(async()=>AreaLedgerPrimaryStore.hash(JSON.stringify(await AreaLedgerPrimaryStore.create().exportState()))),expected);
 console.log('PASS native IndexedDB: 8MB staged restore, interruption, commit, reload and portable export');
 const second=await context.newPage();await second.goto('https://primary-store.test/');
 const stage=async(p,amount)=>p.evaluate(async amount=>{window.store=AreaLedgerPrimaryStore.create();const current=await store.load();window.staged=await store.stage({...current.state,note:'tab '+amount});return {expected:current.head.id,id:staged.id};},amount);
 const [one,two]=await Promise.all([stage(page,1),stage(second,2)]);assert.equal(one.expected,saved.id);assert.equal(two.expected,saved.id);
 const commit=(p,expected)=>p.evaluate(async expected=>{try{return {ok:true,head:(await store.commit(staged,expected)).head};}catch(e){return {ok:false,error:e.code||e.message};}},expected);
 const results=await Promise.all([commit(page,one.expected),commit(second,two.expected)]);assert.equal(results.filter(x=>x.ok).length,1);assert.equal(results.find(x=>!x.ok).error,'CONFLICT');
 console.log('PASS native IndexedDB: atomic cross-tab compare-and-swap admits one writer');
 const result=await page.evaluate(async()=>{const store=AreaLedgerPrimaryStore.create(),before=await store.load(),stage=await store.stage({...before.state,note:'must not commit'}),driver=AreaLedgerPrimaryStore.indexedDriver();const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(key==='primary-v2:head')throw new DOMException('full','QuotaExceededError');return original.call(this,value,key);};let failed=false;try{await store.commit(stage,before.head.id);}catch(e){failed=true;}finally{IDBObjectStore.prototype.put=original;}const after=await store.load();return {failed,unchanged:after.head.id===before.head.id};});assert.deepEqual(result,{failed:true,unchanged:true});
 console.log('PASS native IndexedDB: activation transaction abort retains previous active snapshot');
 await context.close();
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

