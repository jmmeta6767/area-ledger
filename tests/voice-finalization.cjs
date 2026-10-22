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
test('speechend requests a final result, accepts all final rows and ignores interim amounts',()=>{
 const x=fixture(),{c}=x;c.expenseVoiceStart();const engine=x.engines[0];assert.equal(engine.interimResults,true);
 result(engine,'ค่าทราย900',false);assert.equal(c.U.draft.amount,'');assert(c.expenseVoiceStatusText().includes('ค่าทราย900'));
 engine.onspeechend();assert.equal(x.stops,1);assert.equal(c.U.expenseVoiceState,'closing');
 const first=[{transcript:'ค่าทราย'}];first.isFinal=true;engine.onresult({resultIndex:0,results:[first]});
 const second=[{transcript:'500'}];second.isFinal=true;engine.onresult({resultIndex:1,results:[first,second]});
 assert.equal(x.stops,1);assert.equal(c.U.draft.amount,'');engine.onend();
 assert.equal(c.U.draft.amount,'500');assert.equal(c.U.draft.sub,'ทราย');assert.equal(c.U.expenseVoiceTranscript,'ค่าทราย 500');assert.equal(c.S.tx.length,0);
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
let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS',name);}catch(error){failed++;console.error('FAIL',name,error.message);}}
if(failed)process.exitCode=1;else console.log(`PASS ${tests.length} voice finalization groups`);
