// Text represents user keyboard/dictation input. Never records or transmits audio.
const assert=require('node:assert/strict'),{appContext}=require('./helpers/reliability-context.cjs');
const tests=[];function test(name,fn){tests.push([name,fn]);}
function fixture(){const x=appContext();x.c.expenseVoiceCommandHtml(x.c.U.draft);x.nodes.expenseVoiceCommand={value:''};return x;}
test('explicit command applies sand500 then correction700 and undo without saving or recording',()=>{
 const {c,nodes,writes}=fixture(),d=c.U.draft,ledger=JSON.stringify(c.S);d.paid=false;d.pay='cash';d.partner='ร้านเดิม';const date=d.date;
 nodes.expenseVoiceCommand.value='ทราย 500';assert(c.expenseVoiceCommandApply());assert.equal(d.amount,'500');assert.equal(d.sub,'ทราย');assert.equal(d.cat,'ค่าของ');
 nodes.expenseVoiceCommand.value='แก้ยอดเป็น 700';assert(c.expenseVoiceCommandApply());assert.equal(d.amount,'700');assert(c.expenseVoiceUndo());assert.equal(d.amount,'500');
 assert.equal(d.pid,'p');assert.equal(d.paid,false);assert.equal(d.pay,'cash');assert.equal(d.partner,'ร้านเดิม');assert.equal(d.date,date);assert.equal(JSON.stringify(c.S),ledger);assert.equal(writes.length,0);
});
test('empty commands and stale draft or view cannot apply; HTML escapes retained command text',()=>{
 const {c,nodes,writes}=fixture(),old=c.U.draft;old.amount='321';nodes.expenseVoiceCommand.value='  ';assert.equal(c.expenseVoiceCommandApply(),false);assert.equal(old.amount,'321');
 nodes.expenseVoiceCommand.value='ทราย999';c.U.draft=c.newDraft('out','p');assert.equal(c.expenseVoiceCommandApply(),false);assert.equal(c.U.draft.amount,'');assert.equal(old.amount,'321');
 c.expenseVoiceCommandHtml(c.U.draft);c.U.view='home';assert.equal(c.expenseVoiceCommandApply(),false);c.U.view='add';c.U.expenseVoiceCommandText='</textarea><script>throw 1</script>';const html=c.expenseVoiceCommandHtml(c.U.draft);assert(!html.includes('<script>'));assert(html.includes('&lt;/textarea&gt;'));assert.equal(writes.length,0);
});
test('active and closing native captures block command application without starting another capture',()=>{
 const {c,nodes,writes}=fixture();let engine,starts=0;c.window.SpeechRecognition=function(){engine=this;this.start=()=>{starts++;this.onstart();};this.stop=()=>{};this.abort=()=>{};};
 c.U.draft.amount='123';nodes.expenseVoiceCommand.value='ทราย700';c.expenseVoiceStart();assert.equal(c.expenseVoiceCommandApply(),false);assert.equal(c.U.draft.amount,'123');
 engine.onerror({error:'aborted',message:'No speech detected private words'});assert.equal(c.expenseVoiceCommandApply(),false);assert.equal(c.U.draft.amount,'123');assert.equal(starts,1);engine.onend();
 assert(c.expenseVoiceCommandApply());assert.equal(c.U.draft.amount,'700');assert.equal(starts,1);assert.equal(writes.length,0);assert(!JSON.stringify(c.U.expenseVoiceDiagnostic).includes('private words'));
});
test('unapplied draft-bound commands block navigation and update reload until cleared or discarded',()=>{
 const {c}=fixture();assert.equal(c.draftDirty(),false);assert.equal(c.pwaCanReload(),true);
 c.U.expenseVoiceCommandText='ทราย 500';assert.equal(c.U.draft.amount,'');assert.equal(c.draftDirty(),true);assert.equal(c.pwaCanReload(),false);
 let left=false;assert.equal(c.leaveAddTo(()=>{left=true;}),false);assert.equal(left,false);assert.equal(c.U.sheet.kind,'leaveAdd');assert.equal(c.U.expenseVoiceCommandText,'ทราย 500');
 c.U.sheet=null;c.U.expenseVoiceCommandText='  ';assert.equal(c.draftDirty(),false);assert.equal(c.pwaCanReload(),true);
 c.U.expenseVoiceCommandText='ทราย 500';const old=c.U.draft;c.U.draft=c.newDraft('out','p');assert.equal(c.draftDirty(),false);c.expenseVoiceCommandHtml(c.U.draft);assert.notEqual(c.U.expenseVoiceCommandDraft,old);assert.equal(c.U.expenseVoiceCommandText,'');assert.equal(c.U.draft.amount,'');
});
for(const [name,fn]of tests){fn();console.log('PASS',name);}console.log('PASS',tests.length,'keyboard command fallback groups');
