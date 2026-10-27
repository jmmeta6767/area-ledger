/* Synthetic transcripts and native event ordering, never records real microphone audio. */
const assert=require('node:assert/strict');
const {appContext}=require('./helpers/reliability-context.cjs');
const tests=[];function test(name,fn){tests.push([name,fn]);}
function fixture(){
 const x=appContext(),engines=[];let stops=0,aborts=0;
 x.c.window.webkitSpeechRecognition=function(){engines.push(this);this.start=()=>this.onstart?.();this.stop=()=>{stops++;};this.abort=()=>{aborts++;};};
 return {...x,engines,get stops(){return stops;},get aborts(){return aborts;}};
}
function result(engine,text,final=true){const row=[{transcript:text}];row.isFinal=final;engine.onresult({resultIndex:0,results:[row]});}
test('bare material transcripts fill item and amount without the word cost or baht',()=>{
 const {c}=fixture();
 for(const [text,item,amount] of [['ทราย 500','ทราย','500'],['ทราย500','ทราย','500'],['ทราย ๕๐๐','ทราย','500'],['ทรายห้าร้อย','ทราย','500'],['ทรายหยาบ 500','ทรายหยาบ','500'],['ทรายละเอียด 500','ทรายละเอียด','500'],['ปูน 1,250','ปูน','1250'],['ปูนซีเมนต์ 1250','ปูนซีเมนต์','1250'],['เหล็ก 2500','เหล็ก','2500'],['อิฐ 500','อิฐ','500'],['สุขภัณฑ์ 500','สุขภัณฑ์','500'],['ท่อ 500','ท่อ','500']]){
  const p=c.expenseVoiceParse(text);assert.equal(p.amount,amount,text);assert.equal(p.sub,item,text);assert.equal(p.cat,'ค่าของ',text);assert.equal(p.amountIssue,false,text);
 }
 for(const text of ['ทราย 5 คิว','ทราย 5 คิว 500','เหล็ก 12 มม. 50 เส้น','ทรายเบอร์ 500','ท่อขนาด 500','เหล็กรุ่น 500','ปูนรหัส 500','ทราย 500 600','ทราย 50,00','ทราย -500','ทราย วันที่ 22/10/2569','ทราย โทร 000-9876543','ร้านทราย 500','โครงการ 500','ทราย 500 กิโล'])assert.equal(c.expenseVoiceParse(text).amount,'',text);
 assert.equal(c.S.tx.length,0);
});
test('manual stop accepts the delayed final, then 20 new taps replace the amount without saving',()=>{
 const x=fixture(),{c}=x,before=JSON.stringify(c.S);c.U.draft.paid=false;c.U.draft.pay='cash';const date=c.U.draft.date;
 for(let i=0;i<20;i++){
  c.expenseVoiceStart();const engine=x.engines.at(-1),stale=engine.onresult;
  c.expenseVoiceStart();assert.equal(x.aborts,0,'stop must finalize rather than discard audio');assert.equal(c.U.expenseVoiceState,'closing');
  result(engine,(i%2?'ค่าทราย':'ทราย')+(500+i));assert.notEqual(c.U.draft.amount,String(500+i),'wait for the complete native result set');engine.onend();
  assert.equal(c.U.draft.amount,String(500+i));assert.equal(c.U.draft.sub,'ทราย');assert.equal(c.U.draft.cat,'ค่าของ');
  assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.U.expenseVoiceEnding,null);assert.equal(c.expenseVoiceButtonText(),'พูดรายการ');
  stale({results:[[{transcript:'ค่าทราย9999'}]]});assert.equal(c.U.draft.amount,String(500+i));
 }
 assert.equal(x.engines.length,20);assert.equal(x.stops,20);assert.equal(c.U.draft.pid,'p');assert.equal(c.U.draft.date,date);assert.equal(c.U.draft.paid,false);assert.equal(c.U.draft.pay,'cash');
 assert.equal(JSON.stringify(c.S),before);assert.equal(x.writes.length,0);
 c.expenseVoiceUndo();assert.equal(c.U.draft.amount,'518');
});
test('later manual edits survive pending voice completion, timeout and the next correction undo',()=>{
 const edits={type:'in',amount:'700',cat:'ค่าแรง',sub:'รายการที่กรอกเอง',subCustom:'รายละเอียดที่กรอกเอง',partner:'ร้านที่กรอกเอง',date:'2026-01-02'};
 for(const stage of ['listening','closing'])for(const [field,value]of Object.entries(edits)){
  const x=fixture(),{c}=x;c.U.draft.amount='100';c.U.draft.sub='รายการเดิม';const ledger=JSON.stringify(c.S);c.expenseVoiceStart();const engine=x.engines[0];
  if(stage==='closing')result(engine,'ค่าทราย500');c.U.draft[field]=value;const manual=JSON.stringify(c.U.draft);if(stage==='listening')result(engine,'ค่าทราย500');engine.onend();
  assert.equal(JSON.stringify(c.U.draft),manual,stage+' '+field);assert.equal(c.U.expenseVoiceDiagnostic.code,'DRAFT_CHANGED');assert(c.expenseVoiceStatusText().includes('เก็บค่าที่กรอกเองไว้'));assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.U.expenseVoiceEnding,null);assert.equal(JSON.stringify(c.S),ledger);assert.equal(x.writes.length,0);
 }
 const x=fixture(),{c,timers}=x;c.U.draft.amount='100';c.U.draft.sub='รายการเดิม';c.expenseVoiceStart();result(x.engines[0],'ค่าทราย500');c.U.draft.amount='700';timers.get(c.U.expenseVoiceReleaseTimer)();
 assert.equal(c.U.draft.amount,'700');assert.equal(c.U.draft.sub,'รายการเดิม');assert.equal(c.U.expenseVoiceDiagnostic.code,'DRAFT_CHANGED');assert.equal(x.aborts,1);
 assert(c.expenseVoiceStart());result(x.engines.at(-1),'ค่าทราย900');x.engines.at(-1).onend();assert.equal(c.U.draft.amount,'900');assert(c.expenseVoiceUndo());assert.equal(c.U.draft.amount,'700');assert.equal(c.U.draft.sub,'รายการเดิม');assert.equal(c.S.tx.length,0);assert.equal(x.writes.length,0);
});
test('changing only project and payment choices does not discard a valid pending voice result',()=>{
 const x=fixture(),{c}=x;c.S.projects.push({id:'q',name:'โครงการใหม่',status:'active'});c.expenseVoiceStart();result(x.engines[0],'ทราย500');c.U.draft.pid='q';c.U.draft.paid=false;c.U.draft.pay='cash';x.engines[0].onend();
 assert.equal(c.U.draft.amount,'500');assert.equal(c.U.draft.sub,'ทราย');assert.equal(c.U.draft.pid,'q');assert.equal(c.U.draft.paid,false);assert.equal(c.U.draft.pay,'cash');assert.equal(c.U.expenseVoiceDiagnostic.code,'');assert.equal(c.S.tx.length,0);assert.equal(x.writes.length,0);
});
test('native speechend and final rows wait for end without redundant stop or interim amounts',()=>{
 const x=fixture(),{c}=x;c.expenseVoiceStart();const engine=x.engines[0];assert.equal(engine.interimResults,true);
 result(engine,'ค่าทราย900',false);assert.equal(c.U.draft.amount,'');assert(c.expenseVoiceStatusText().includes('ค่าทราย900'));
 engine.onspeechend();assert.equal(x.stops,0);assert.equal(c.U.expenseVoiceState,'closing');
 const first=[{transcript:'ค่าทราย'}];first.isFinal=true;engine.onresult({resultIndex:0,results:[first]});
 const second=[{transcript:'500'}];second.isFinal=true;engine.onresult({resultIndex:1,results:[first,second]});
 assert.equal(x.stops,0);assert.equal(c.U.draft.amount,'');engine.onend();
 assert.equal(c.U.draft.amount,'500');assert.equal(c.U.draft.sub,'ทราย');assert.equal(c.U.expenseVoiceTranscript,'ค่าทราย 500');assert.equal(c.S.tx.length,0);
});
test('native final and speechend survive aborted in either order and queue a correction',()=>{
 for(const order of ['final-speechend-aborted','speechend-aborted-final']){
  const x=fixture(),{c}=x;c.U.draft.amount='123';const ledger=JSON.stringify(c.S);c.expenseVoiceStart();const first=x.engines[0];
  for(const event of order.split('-')){if(event==='final')result(first,'ค่าทราย500');if(event==='speechend')first.onspeechend();if(event==='aborted')first.onerror({error:'aborted',message:'No speech detected'});}
  assert.equal(c.U.draft.amount,'123');assert.equal(x.stops,0);assert.equal(x.aborts,0);assert.equal(c.U.expenseVoiceEnding,first);
  const releaseTimer=c.U.expenseVoiceReleaseTimer;assert(c.expenseVoiceStart());assert(c.expenseVoiceStart());assert.equal(c.U.expenseVoiceReleaseTimer,releaseTimer);assert.equal(x.engines.length,1,'queued restart waits for native end');
  first.onend();assert.equal(c.U.draft.amount,'500');assert.equal(c.U.draft.sub,'ทราย');assert.equal(c.U.expenseVoiceEnding,null);assert.equal(x.engines.length,2);assert(c.U.expenseVoiceDiagnostic.events.includes('restart-queued'));assert(c.U.expenseVoiceDiagnostic.started);
  result(x.engines[1],'แก้ยอดเป็น700');x.engines[1].onend();assert.equal(c.U.draft.amount,'700');assert.equal(x.stops,0);assert.equal(JSON.stringify(c.S),ledger);assert.equal(x.writes.length,0);
 }
});test('native errors retain ownership through end; an explicit queued tap starts a clean attempt',()=>{
 for(const error of ['network','not-allowed','audio-capture','no-speech','unrecognized']){
  const x=fixture(),{c}=x;c.U.draft.amount='321';c.expenseVoiceStart();const first=x.engines[0],late=first.onresult;
  result(first,'ทราย500');first.onerror({error,message:'private recognizer message secret 987654'});assert.equal(c.U.expenseVoiceEnding,first);assert.equal(x.aborts,0);assert(c.expenseVoiceStart());assert.equal(x.engines.length,1);
  first.onerror({error:'aborted',message:'Another request is started'});late({results:[Object.assign([{transcript:'ค่าทราย900'}],{isFinal:true})]});first.onend();
  assert.equal(c.U.draft.amount,'321');assert.equal(c.U.expenseVoiceEnding,null);assert.equal(x.engines.length,2);assert(c.U.expenseVoiceDiagnostic.events.includes('restart-queued'));assert(!JSON.stringify(c.U.expenseVoiceDiagnostic).includes('private'));assert(!c.expenseVoiceDiagnosticText().includes('987654'));
  c.expenseVoiceStop();assert.equal(c.S.tx.length,0);
 }
 const x=fixture(),{c,timers}=x;c.U.draft.amount='321';c.expenseVoiceStart();x.engines[0].onerror({error:'aborted',message:'private service detail'});assert.equal(c.U.expenseVoiceDiagnostic.nativeReason,'NATIVE_ERROR');assert(c.expenseVoiceStart());assert.equal(x.engines.length,1);timers.get(c.U.expenseVoiceReleaseTimer)();assert.equal(c.U.draft.amount,'321');assert.equal(c.U.expenseVoiceDiagnostic.code,'ERROR_ABORTED');assert.equal(x.aborts,1);assert.equal(c.U.expenseVoiceEnding,null);assert.equal(c.S.tx.length,0);
});test('aborted late finals still respect manual edits and explicit stop is requested only once',()=>{
 const x=fixture(),{c}=x;c.U.draft.amount='100';c.expenseVoiceStart();const engine=x.engines[0];c.expenseVoiceStart();assert.equal(x.stops,1);engine.onspeechend();engine.onerror({error:'aborted'});c.U.draft.amount='700';result(engine,'ค่าทราย500');assert.equal(x.stops,1);engine.onend();assert.equal(c.U.draft.amount,'700');assert.equal(c.U.expenseVoiceDiagnostic.code,'DRAFT_CHANGED');assert.equal(x.aborts,0);assert.equal(c.U.expenseVoiceEnding,null);assert.equal(c.S.tx.length,0);
});
test('interim-only, empty and missing-end sessions release the mic without guessing a payment',()=>{
 const x=fixture(),{c,timers}=x;c.U.draft.amount='321';
 c.expenseVoiceStart();result(x.engines.at(-1),'ค่าทราย500',false);x.engines.at(-1).onend();assert.equal(c.U.draft.amount,'321');assert.equal(c.U.expenseVoiceDiagnostic.code,'NO_FINAL_RESULT');
 c.expenseVoiceStart();c.expenseVoiceStart();timers.get(c.U.expenseVoiceReleaseTimer)();assert.equal(c.U.draft.amount,'321');assert.equal(c.U.expenseVoiceEnding,null);assert.equal(c.U.expenseVoiceDiagnostic.ended,false);assert.equal(x.aborts,1);
 c.expenseVoiceStart();result(x.engines.at(-1),'ค่าทราย500');timers.get(c.U.expenseVoiceReleaseTimer)();assert.equal(c.U.draft.amount,'500');assert.equal(c.U.expenseVoiceEnding,null);assert.equal(c.U.expenseVoiceDiagnostic.code,'END_TIMEOUT');assert.equal(x.aborts,2);
 c.expenseVoiceStart();x.engines.at(-1).onend();assert.equal(c.U.draft.amount,'500');assert.equal(c.U.expenseVoiceDiagnostic.code,'NO_SPEECH');assert.equal(x.engines.length,4);
});
test('cancel, draft replacement and errors reject late final results and leave the next tap available',()=>{
 for(const mode of ['cancel','draft','view','network']){
  const x=fixture(),{c}=x;c.expenseVoiceStart();const engine=x.engines[0],late=engine.onresult,end=engine.onend;
  result(engine,'ค่าทราย500');
  if(mode==='cancel')c.expenseVoiceStop();if(mode==='draft')c.U.draft=c.newDraft('out','p');if(mode==='view')c.U.view='home';if(mode==='network')engine.onerror({error:'network'});
  late({results:[[{transcript:'ค่าทราย900'}]]});end();assert.equal(c.U.draft.amount,'',mode);assert.equal(c.U.expenseVoiceEnding,null,mode);
  c.U.view='add';c.expenseVoiceStart();assert.equal(x.engines.length,2,mode);c.expenseVoiceStop();assert.equal(c.S.tx.length,0);
 }
});
test('second user tap during native close queues one fresh capture after end',()=>{
 const x=fixture(),{c}=x;c.expenseVoiceStart();const first=x.engines[0];
 result(first,'ค่าทราย500');assert.equal(c.U.expenseVoiceState,'closing');
 assert(c.expenseVoiceStart());assert.equal(x.engines.length,1);assert.equal(c.U.expenseVoiceRestartDraft,c.U.draft);assert(c.expenseVoiceStart());assert.equal(x.engines.length,1,'repeated taps still queue only one capture');assert(c.expenseVoiceStatusText().includes('จะเริ่มฟังรอบใหม่'));
 assert.equal(c.U.expenseVoiceRestartDraft,c.U.draft);
 first.onend();assert.equal(x.engines.length,2);assert.equal(c.U.expenseVoiceRecognition,x.engines[1]);
 assert.equal(c.U.draft.amount,'500');result(x.engines[1],'แก้ยอดเป็น700');x.engines[1].onend();
 assert.equal(c.U.draft.amount,'700');assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.S.tx.length,0);assert.equal(x.writes.length,0);
});test('queued second capture is cleared on timeout, cancellation, navigation or a replaced draft',()=>{
 for(const mode of ['timeout','cancel','draft','view']){
  const x=fixture(),{c,timers}=x;c.expenseVoiceStart();const first=x.engines[0];result(first,'ค่าทราย500');c.expenseVoiceStart();assert.equal(c.U.expenseVoiceRestartDraft,c.U.draft);
  if(mode==='timeout')timers.get(c.U.expenseVoiceReleaseTimer)();
  if(mode==='cancel')c.expenseVoiceStop();
  if(mode==='draft')c.U.draft=c.newDraft('out','p');if(mode==='view')c.U.view='home';
  if(mode!=='timeout'&&mode!=='cancel')first.onend();
  assert.equal(c.U.expenseVoiceRestartDraft,null,mode);assert.equal(c.U.expenseVoiceRestartView,null,mode);assert.equal(x.engines.length,1,mode);assert.equal(c.S.tx.length,0,mode);
 }
});let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS',name);}catch(error){failed++;console.error('FAIL',name,error.message);}}
if(failed)process.exitCode=1;else console.log(`PASS ${tests.length} voice finalization groups`);
