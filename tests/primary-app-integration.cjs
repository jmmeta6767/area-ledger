/* Synthetic ledger only. Execute the actual application handlers and adapter. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const harness=fs.readFileSync('tests/single-save-storage.cjs','utf8').split('(async()=>{')[0];
const api=require('../gateway/public/assets/ledger-primary-store.js');
const context={require,console,URL};vm.createContext(context);
vm.runInContext(harness+'\nglobalThis.h={c,storage,messages,fixture,listeners};',context);
const {c,storage,messages,fixture}=context.h;
let rows,fail=false,hold=null;
const copy=x=>x===undefined?x:JSON.parse(JSON.stringify(x));
function driver(){return {
 async get(k){return copy(rows.get(k));},
 async put(k,v){if(fail)throw new DOMException('full','QuotaExceededError');rows.set(k,copy(v));},
 async activate(id,expected,guard){if(hold)await hold;const old=rows.get('primary-v2:head');if((old?.id||null)!==expected)throw Error('CONFLICT');guard();if(fail)throw new DOMException('full','QuotaExceededError');const snap=rows.get('primary-v2:snapshot:'+id);const head={id,previous:old?.id||null,revision:(old?.revision||0)+1,checksum:snap.checksum,legacyToken:snap.legacyToken};rows.set('primary-v2:head',head);return copy(head);}
};}
c.AreaLedgerPrimaryStore={hash:api.hash,create:()=>api.create({driver:driver()})};
c.primaryBusy=on=>{c.U.primaryWriteBusy=on;c.primaryAbort=on?new AbortController():null;};
async function setup(){rows=new Map();fail=false;hold=null;c.primaryActive=false;c.primaryStore=null;c.primaryHead=null;c.U.primaryWriteBusy=false;const raw=fixture();assert.equal(await c.primaryEnable(),true);assert.equal(storage.get(c.KEY),raw);return raw;}
function eq(a,b){assert.equal(JSON.stringify(a),JSON.stringify(b));}
async function click(el){el.dataset={act:el.getAttribute('data-act')};el.closest=()=>el;for(const fn of context.h.listeners.click)await fn({target:el,preventDefault(){},stopPropagation(){}});}
(async()=>{
 const original=await setup();assert.equal(c.primaryHead.legacyToken,await api.hash(original));c.primaryActive=false;const reboot=await c.primaryLoad();eq(reboot,c.S);storage.set(c.KEY,'changed by old tab');await assert.rejects(c.primaryLoad(),/LEGACY_CHANGED/);console.log('PASS migration retains legacy data and detects old-tab changes after reload');
 await setup();let release;hold=new Promise(r=>release=r);const pending=c.saveTx(false);assert(pending&&typeof pending.then==='function');await new Promise(r=>setTimeout(r,30));assert(c.U.draft);assert(c.U.saveLock);assert.equal((await c.primaryStore.load()).state.tx.length,1);release();await pending;assert.equal((await c.primaryStore.load()).state.tx.length,2);assert.equal(c.U.draft,null);console.log('PASS real save handler waits for durable commit before clearing draft');
 await setup();const before=JSON.stringify(c.S);fail=true;await c.saveTx(false);assert.equal(JSON.stringify(c.S),before);assert(c.U.draft);assert.equal((await c.primaryStore.load()).state.tx.length,1);assert(!messages.some(x=>x==='บันทึกแล้ว'));console.log('PASS rejected primary write retains ledger and editable draft');
 await setup();const old=await c.primaryStore.load();const other=api.create({driver:driver()});await other.save({...copy(old.state),note:'other tab'},old.head.id,{legacyToken:c.primaryLegacyToken});await c.saveTx(false);assert(c.U.draft);assert.equal((await other.load()).state.note,'other tab');assert.equal(c.U.storageConflict,true);console.log('PASS stale application tab cannot overwrite new primary revision');
 await setup();c.U.sheet={kind:'restore'};const target=copy(c.S);target.projects=Array.from({length:6},(_,i)=>({id:'p'+i,name:'project '+i}));target.tx=Array.from({length:112},(_,i)=>({id:'t'+i,pid:'p'+i%6,type:'out',amount:500,cat:'ค่าของ',date:'2026-10-01',photo:'data:image/jpeg;base64,'+'A'.repeat(70000)+i}));target.boq=Array.from({length:32},(_,i)=>({id:'b'+i,pid:'p0',name:'item',qty:1,price:10}));c.U.rsText=JSON.stringify(target);const el={getAttribute:k=>k==='data-act'?'doRestore':null};await click(el);assert.equal(c.U.confirm,'restore');await click(el);const restored=await c.primaryStore.exportState();assert.equal(restored.tx.length,112);assert.equal(restored.projects.length,6);assert.equal(restored.boq.length,32);assert.equal(restored.tx[111].photo,target.tx[111].photo);assert.equal(c.U.sheet,null);console.log('PASS actual confirmed restore commits 8MB, 6 projects, 112 transactions and 32 BOQ');
})().catch(e=>{console.error(e);process.exitCode=1;});
