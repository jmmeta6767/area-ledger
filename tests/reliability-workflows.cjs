/* Synthetic fixtures; never accesses customer storage, Google accounts or microphone. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const {appContext}=require('./helpers/reliability-context.cjs');
(async()=>{
 const {c,writes,action}=appContext();let count=0;
 const same=()=>JSON.stringify(c.S);
 const financial=same();
 // Every capture needs a new direct start; repeated callbacks must never save a transaction.
 let recognition;const captures=[];
 c.window.webkitSpeechRecognition=function(){recognition=this;captures.push(this);this.start=()=>this.onstart();this.stop=()=>this.onend?.();this.abort=()=>{};};
 const draft=c.U.draft;draft.partner='ร้านเดิม';draft.date='2026-10-14';draft.paid=false;draft.pay='cash';
 for(let i=0;i<20;i++){
  assert(c.expenseVoiceStart());const current=recognition;
  current.onresult({results:[[{transcript:i===0?'ค่าทราย 500':'แก้ยอดเป็น '+(500+i)}]]});
  assert.equal(c.U.expenseVoiceEnding,current);current.onend();
  assert.equal(draft.amount,String(500+i));assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.U.expenseVoiceEnding,null);
  assert.equal(draft.pid,'p');assert.equal(draft.partner,'ร้านเดิม');assert.equal(draft.date,'2026-10-14');assert.equal(draft.pay,'cash');assert.equal(draft.paid,false);
 }
 assert.equal(new Set(captures).size,20);assert.equal(same(),financial);assert.equal(writes.length,0);count++;
 assert(c.expenseVoiceUndo());assert.equal(draft.amount,'518');assert.equal(draft.sub,'ทราย');
 c.expenseVoiceApply(c.expenseVoiceParse('แก้ยอดเป็น 700'),draft);draft.amount='750';assert.equal(c.expenseVoiceUndo(),false);assert.equal(draft.amount,'750');count++;
 // An old recognition callback is ignored after a new direct session starts.
 c.expenseVoiceStart();const stale=recognition.onresult;c.expenseVoiceStop();c.expenseVoiceStart();stale({results:[[{transcript:'ค่าทราย 999'}]]});assert.equal(draft.amount,'750');c.expenseVoiceStop();count++;
 // Recovery comparison is read-only and preserves individual partial-payment amounts.
 const incoming=c.emptyState();incoming.projects=Array.from({length:6},(_,i)=>({id:'p'+i,name:'โครงการ '+i}));
 incoming.tx=incoming.projects.flatMap((p,i)=>[{id:'out'+i,pid:p.id,type:'out',amount:1000,paid:false,payments:[{amount:300,pay:'transfer',date:'2026-10-14'}],cat:'ค่าแรง',date:'2026-10-14',photoRef:'synthetic/'+i},{id:'in'+i,pid:p.id,type:'in',amount:2000,paid:true,date:'2026-10-14',cat:'รับเงินค่างวดงาน'}]);
 const checksum=c.backupStateChecksum(incoming),envelope={backupFormat:2,stateChecksum:checksum,state:incoming};c.U.rsText=JSON.stringify(envelope);c.U.sheet={kind:'restore'};
 let before=same(),writeCount=writes.length;const summary=c.restoreProjectSummary(c.restoreParse(c.U.rsText).state);assert.equal(summary.totals.expense,6000);assert.equal(summary.totals.received,12000);assert.equal(summary.totals.paid,1800);assert.equal(summary.totals.payable,4200);assert.equal(summary.receiptReferences,6);
 assert(c.restoreComparisonHtml().includes('6'));assert.equal(same(),before);assert.equal(writes.length,writeCount);count++;
 action('doRestore');assert.equal(same(),before);assert.equal(writes.length,writeCount);assert.equal(c.U.confirm,'restore');
 c.S.projects[0].name='แก้หลังตรวจ';before=same();action('doRestore');assert.equal(same(),before,'changed local state requires a fresh confirmation');assert.equal(writes.length,writeCount);
 const differentFile=JSON.parse(c.U.rsText);differentFile.state.tx[0].amount=1200;differentFile.stateChecksum=c.backupStateChecksum(differentFile.state);c.U.rsText=JSON.stringify(differentFile);action('doRestore');assert.equal(same(),before,'changed backup requires a fresh confirmation');assert.equal(writes.length,writeCount);
 action('doRestore');assert.equal(c.S.projects.length,6);assert.equal(c.S.tx.length,12);assert.equal(c.S.lastBackupRevision,c.S.dataRevision);assert.equal(writes.filter(x=>x[0]===c.KEY).length,1,'restore commits the complete state once');count++;
 const failedRestore=appContext(),f=failedRestore.c;f.U.sheet={kind:'restore'};f.U.rsText=JSON.stringify(envelope);f.localStorage.setItem(f.KEY,JSON.stringify(f.S));f.committedState=f.localStorage.getItem(f.KEY);const original=f.committedState;
 failedRestore.action('doRestore');const set=f.localStorage.setItem;f.localStorage.setItem=(key,value)=>{if(key===f.KEY)throw Object.assign(Error('quota'),{name:'QuotaExceededError'});return set(key,value);};failedRestore.action('doRestore');assert.equal(JSON.stringify(f.S),original);assert.equal(f.localStorage.getItem(f.KEY),original);assert(f.U.rsText);count++;
 // PWA updates must wait for active speech and Google writes even when there is no sheet.
 c.U.sheet=null;c.U.draft=null;c.U.expenseVoiceRecognition={};assert.equal(c.pwaCanReload(),false);c.U.expenseVoiceRecognition=null;
 c.U.googleWorkspace={syncBusy:true};assert.equal(c.pwaCanReload(),false);c.U.googleWorkspace={bulkSyncBusy:true};assert.equal(c.pwaCanReload(),false);c.U.googleWorkspace={};assert.equal(c.pwaCanReload(),true);count++;
 c.APP_BUILD={version:1094,sha:'a'.repeat(40),environment:'production'};
 c.fetch=async()=>({ok:true,text:async()=> 'var APP_BUILD='+JSON.stringify({version:1093,sha:'b'.repeat(40),environment:'production'})+';'});
 await c.pwaCheckUpdate();assert.equal(c.U.pwaRemoteBuild.version,1093);assert(c.U.pwaCheckMessage.includes('1093'));
 c.fetch=async()=>({ok:true,text:async()=> 'var APP_BUILD='+JSON.stringify({version:1094,sha:'b'.repeat(40),environment:'staging'})+';'});await c.pwaCheckUpdate();assert.equal(c.U.pwaRemoteBuild,null);assert.equal(c.reloads,0);count++;
 // Sheets verification compares the actual presentation order and stored date serials.
 const w={URL,URLSearchParams,Request,Response,Headers,AbortController,TextEncoder,TextDecoder,crypto:webcrypto,console,setTimeout,clearTimeout};vm.createContext(w);vm.runInContext(fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker='),w);
 const tabs=[{title:'ค่าใช้จ่าย',values:[['วันที่','รายการ','ยอด'],['2026-10-14','=literal',6430]]},{title:'BOQ',values:[['รายการ','ยอด'],['ทราย',2700]]}];
 let response={valueRanges:[{values:[['วันที่','รายการ','ยอด'],[Date.parse('2026-10-14')/86400000+25569,'=literal',6430]]},{values:[['รายการ','ยอด'],['ทราย',2700]]}]};
 w.googleJson=async(url)=>{assert(url.includes('values:batchGet'));return response;};const verified=await w.googleVerifyProjectSnapshot('synthetic','sheet',tabs);assert(verified.matched);assert.equal(verified.counts.expenses,1);count++;
 response.valueRanges[0].values[1][2]=9893124;await assert.rejects(w.googleVerifyProjectSnapshot('synthetic','sheet',tabs),/GOOGLE_SYNC_VERIFY_FAILED/);response={valueRanges:[]};await assert.rejects(w.googleVerifyProjectSnapshot('synthetic','sheet',tabs),/GOOGLE_SYNC_VERIFY_FAILED/);count++;
 // A failed readback must not update the last successful sync timestamp.
 let marked=0;w.googleAccessToken=async()=> 'synthetic';w.googleEnsureProjectAssets=async()=>({spreadsheetId:'sheet'});w.googleWriteProjectSnapshot=async()=>{};w.googleVerifyProjectSnapshot=async()=>{throw Error('GOOGLE_SYNC_VERIFY_FAILED');};const env={LEDGER_DB:{prepare(){return {bind(){return {run:async()=>marked++}}}}}};
 await assert.rejects(w.googleSyncProject(env,'synthetic',{project:{id:'p',name:'P'},rows:[],verify:true}),/GOOGLE_SYNC_VERIFY_FAILED/);assert.equal(marked,0);count++;
 // Changed local data cannot be reported as up to date; remaining projects are not silently sent.
 c.S=c.emptyState();c.S.projects=[{id:'p',name:'P'},{id:'q',name:'Q'}];c.U.googleWorkspace={};c.cloudLedgerKey=()=> 'synthetic';c.U.sheet={kind:'googleWorkspace',pid:'p'};let calls=0;
 c.cloudGateway=async()=>{calls++;c.S.projects[0].name='changed';return {ok:true,data:{verification:{matched:true,counts:{boq:0,expenses:0,income:0}},lastSyncAt:'2026-10-22T04:00:00Z'}};};
 assert.equal(await c.googleWorkspaceSyncActive(false),false);assert.equal(calls,1);assert(c.U.googleWorkspace.bulkSyncResults.every(x=>x.state==='error'));assert.equal(c.U.googleWorkspace.error,'GOOGLE_SOURCE_CHANGED');count++;
 c.U.googleWorkspace={};const localBefore=same();c.cloudGateway=async()=>({ok:true,data:{}});assert.equal(await c.googleWorkspaceSync('p'),false);assert.equal(c.U.googleWorkspace.error,'GOOGLE_SYNC_UNVERIFIED');assert.equal(same(),localBefore);count++;
 console.log('PASS reliability workflows:',count,'groups; 20 repeat voice captures, read-only six-project comparison, bound confirmation, one restore commit, update guard, verified Sheets and changed-source detection');
})().catch(e=>{console.error(e);process.exitCode=1;});
