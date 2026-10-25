/* Synthetic data only. Exercises the actual client and provider request functions. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8'),code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n').replace(/\nboot\(\);/,'\n');
const listeners={},timers=new Map();let timerId=0;
const node=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){},appendChild(){},innerHTML:''});
const c={console,Date,Math,JSON,Number,String,Array,Object,Promise,Set,Map,RegExp,URL,parseFloat,isFinite,isNaN,AbortController,setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id),navigator:{},location:{protocol:'https:',origin:'https://ledger.test',hostname:'ledger.test'},history:{pushState(){},replaceState(){}},window:{addEventListener(){},scrollTo(){}},document:{addEventListener(k,f){(listeners[k]??=[]).push(f);},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return [];},documentElement:node(),body:node(),createElement:node},localStorage:{getItem(){return null;},setItem(){},removeItem(){}},sessionStorage:{getItem(){return null;},setItem(){},removeItem(){}}};
vm.createContext(c);vm.runInContext(code,c);c.render=()=>{};c.toast=()=>{};c.persist=()=>true;c.S=c.emptyState();c.S.projects=[{id:'p',name:'Test',status:'active'}];c.U.view='add';
const tests=[];function test(name,f){tests.push([name,f]);}
test('merchant words cannot select expense category, while explicit work categories keep their mappings',()=>{
 for(const [text,cat] of [['ซื้อ ปูน 500 บาท ร้านช่างสมใจ','ค่าของ'],['ซื้อเหล็ก500บาท ร้านค่าแรงดี','ค่าของ'],['ค่าแรง 1200 บาท ร้านวัสดุสมใจ','ค่าแรง'],['ค่าเช่าเครื่องตัด 300 บาท ร้านช่างดี','ค่าเช่าอื่นๆ'],['ค่าประกันสัญญา 500 บาท ร้านวัสดุ','ค่าประกัน/ค่างาน'],['ค่าแบบ 300 บาท ร้านช่างสมใจ','ค่างานเอกสาร']])assert.equal(c.expenseVoiceParse(text).cat,cat,text);
});
test('explicit Thai Buddhist, Gregorian, short-year and named-month dates validate without rollover or guessing',()=>{
 assert.equal(c.expenseVoiceParse('วันที่ 2026/10/14').date,'2026-10-14');assert(c.expenseVoiceParse('วันที่ 014/10/2569').dateIssue);
 for(const [text,date] of [['จ่าย 1200 บาท วันที่ 14/10/2569 ร้านสมใจ','2026-10-14'],['วันที่ ๑๔/๑๐/๒๕๖๙','2026-10-14'],['วันที่ 14-10-69','2026-10-14'],['วันที่ 2026-10-14','2026-10-14'],['วันที่ สิบสี่ ตุลาคม 2569','2026-10-14'],['วันที่ 14 ต.ค. 2569','2026-10-14'],['วันที่ 29/2/2567','2024-02-29']])assert.equal(c.expenseVoiceParse(text).date,date,text);
 for(const text of ['วันที่ 31/2/2569','วันที่ 29/2/2569','วันที่ 32/10/2569','วันที่ 14/13/2569','วันที่ 14/10','วันที่ 14/10/2569 และวันที่ 15/10/2569']){const x=c.expenseVoiceParse(text);assert.equal(x.date,'',text);assert(x.dateIssue,text);}
});
test('oversized and ambiguous money is rejected without accepting a smaller suffix or fee instead',()=>{
 for(const text of ['จ่ายหนึ่งล้านล้านบาท','ศูนย์ล้านบาท','หนึ่งล้านล้านบาท ค่ารถ 100 บาท','ยอดสองพันล้านบาท','ยอด 1000000001 บาท ค่าขนส่ง 50 บาท','จ่ายลบห้าร้อยบาท','ยอดยี่บาท','ยอดเอ็ดบาท','จ่าย 100 บาท และ 200 บาท']){const x=c.expenseVoiceParse(text);assert.equal(x.amount,'',text);assert(x.amountIssue,text);}
 for(const [text,n] of [['หนึ่งล้านบาท','1000000'],['หนึ่งพันล้านบาท','1000000000'],['เก้าร้อยเก้าสิบเก้าล้านบาท','999000000'],['ยี่สิบเอ็ดบาท','21'],['หนึ่งร้อยเอ็ดบาท','101']])assert.equal(c.expenseVoiceAmount(text),n,text);
});
test('invalid voice money/date clears stale values and displays field-specific review without saving',()=>{
 assert.equal(c.expenseVoiceParse('จ่ายหนึ่งล้านล้านบาท วันที่ 31/2/2569').sub,'');assert.equal(c.expenseVoiceParse('จ่ายหนึ่งล้านล้านบาท รายการปูน').sub,'ปูน');
 let instance;c.window.SpeechRecognition=function(){instance=this;this.start=()=>{};this.abort=()=>{};};c.U.draft=c.newDraft('out','p');c.U.draft.amount='250';c.U.draft.date='2026-10-01';c.expenseVoiceStart();instance.onresult({results:[[{transcript:'จ่ายหนึ่งล้านล้านบาท วันที่ 31/2/2569'}]]});instance.onend();assert.equal(c.U.draft.amount,'');assert.equal(c.U.draft.date,'');assert.equal(c.U.expenseVoiceIssues.length,2);assert(c.vAdd().includes('วันที่อ่านไม่ได้'));assert.equal(c.S.tx.length,0);
 c.U.draft.amount='500';c.expenseVoiceReviewUpdate();assert.equal(c.U.expenseVoiceIssues.length,1);c.U.draft.date='2026-10-14';c.expenseVoiceReviewUpdate();assert.equal(c.U.expenseVoiceIssues.length,0);
});
test('WebKit-prefixed speech can restart after silence, permission failure, timeout and thrown start',()=>{
 delete c.window.SpeechRecognition;let instance;c.window.webkitSpeechRecognition=function(){instance=this;this.start=()=>{};this.abort=()=>{};};c.U.view='add';c.U.draft=c.newDraft('out','p');c.U.draft.amount='123';
 for(const event of ['end','denied','timeout']){assert(c.expenseVoiceStart());const timer=c.U.expenseVoiceTimer;if(event==='end')instance.onend();else if(event==='denied')instance.onerror({error:'not-allowed'});else timers.get(timer)();if(c.U.expenseVoiceEnding)instance.onend();assert.equal(c.U.expenseVoiceRecognition,null);assert(!timers.has(timer));assert.equal(c.U.draft.amount,'123');}
 c.U.draft.date='2026-10-14';c.expenseVoiceStart();c.saveTx(false);assert.equal(c.S.tx.length,0);assert(c.U.expenseVoiceRecognition);assert.equal(c.U.draft.amount,'123');c.expenseVoiceStop();
 c.window.webkitSpeechRecognition=function(){this.start=()=>{throw Error('start failed');};this.abort=()=>{};};assert.equal(c.expenseVoiceStart(),false);assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.U.expenseVoiceTimer,null);delete c.window.webkitSpeechRecognition;assert.equal(c.S.tx.length,0);
});
test('partial document survives transport and prevents a page total from becoming a single expense',()=>{
 const x=c.aiGatewayValidateExpense({amount:6430,documentTotal:null,partialDocument:true,rows:[]}),r=c.expenseOcrNormalizeRemote(x);assert.equal(r.partialDocument,true);assert.equal(r.amount,0);assert(c.expenseScanImage.toString().includes("if(res.partialDocument){done('เอกสารระบุหลายหน้า"));
 for(const text of ['Page 1 of 2 GRAND TOTAL 6430','หน้า ๑ จาก ๒ รวมสุทธิ 6430']){const local=c.expenseOcrResult(text);assert(local.partialDocument,text);assert.equal(local.amount,0);const remote=c.expenseOcrNormalizeRemote({text,amount:6430,documentTotal:6430});assert(remote.partialDocument);assert.equal(remote.amount,0);assert.equal(remote.documentTotal,0);}
 assert(!c.expenseOcrPartialDocument('Page 1 of 1'));
});
test('labor description followed by an unlabelled amount fills the amount on repeated speech sessions',()=>{
 for(const text of ['ค่าแรงงานโครงหลัง 54,000','ค่าแรงงานโครงหลังคา 54000','ค่าแรงงานโครงหลังคา ๕๔,๐๐๐','ค่าแรงงานโครงหลังคา ห้าหมื่นสี่พัน']){const x=c.expenseVoiceParse(text);assert.equal(x.amount,'54000',text);assert.equal(x.cat,'ค่าแรง');assert(!/ห้าหมื่น|สี่พัน|54000|54,000/.test(x.sub));}
 for(const text of ['ค่าแรงงาน 12 คน','ค่าแรงงาน วันที่ 14/10/2569','ค่าแรง โทร 064 9893124','ค่าแรง 12 คน 54000','ค่าแรง ร้านสมใจ 54000','ค่าแรง -54000','ค่าแรงงานโครงหลังคา 54,00'])assert.equal(c.expenseVoiceParse(text).amount,'',text);
 let instance;c.window.SpeechRecognition=function(){instance=this;this.start=()=>{};this.abort=()=>{};};c.U.view='add';c.U.draft=c.newDraft('out','p');
 for(const text of ['ค่าแรงงานโครงหลัง 54,000','ค่าแรงงานโครงหลังคา ห้าหมื่นสี่พัน']){c.U.draft.amount='999';assert(c.expenseVoiceStart());instance.onresult({results:[[{transcript:text}]]});instance.onend();assert.equal(c.U.draft.amount,'54000');assert.equal(c.U.draft.cat,'ค่าแรง');assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.S.tx.length,0);}
});
test('repeated speech edits only named fields and retains unresolved warnings and draft identity',()=>{
 let instance;c.window.webkitSpeechRecognition=function(){instance=this;this.start=()=>{};this.abort=()=>{};};delete c.window.SpeechRecognition;c.U.view='add';c.U.draft=c.newDraft('out','p');const d=c.U.draft;d.partner='ร้านเดิม';d.date='2026-10-14';d.pay='cash';d.paid=false;
 const speak=text=>{assert(c.expenseVoiceStart());instance.onresult({results:[[{transcript:text}]]});instance.onend();assert.equal(c.U.draft,d);assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.S.tx.length,0);};
 speak('ค่าแรงงานโครงหลังคา 54,000');assert.equal(d.amount,'54000');const sub=d.sub;
 for(const command of ['แก้ยอดเป็น 53,000','เปลี่ยนจำนวนเงินเป็น ห้าหมื่นสองพัน','51,000','ห้าหมื่นบาท']){speak(command);assert.equal(d.sub,sub);assert.equal(d.partner,'ร้านเดิม');assert.equal(d.date,'2026-10-14');assert.equal(d.pid,'p');assert.equal(d.pay,'cash');assert.equal(d.paid,false);}
 assert.equal(d.amount,'50000');speak('เปลี่ยนรายการเป็น ค่าแรงติดตั้งหลังคา');assert.equal(d.sub,'ค่าแรงติดตั้งหลังคา');assert.equal(d.amount,'50000');assert.equal(d.cat,'ค่าแรง');
 speak('วันที่ 15/10/2569');assert.equal(d.date,'2026-10-15');assert.equal(d.sub,'ค่าแรงติดตั้งหลังคา');
 speak('แก้ยอดเป็น หนึ่งล้านล้าน');assert.equal(d.amount,'');assert.equal(c.U.expenseVoiceIssues.length,1);speak('เปลี่ยนรายการเป็น ค่าแรงมุงหลังคา');assert.equal(c.U.expenseVoiceIssues.length,1);speak('แก้ยอดเป็น 49000');assert.equal(d.amount,'49000');assert.equal(c.U.expenseVoiceIssues.length,0);
 for(const invalid of ['0','1000000001','-53000','หนึ่งล้านล้าน']){speak(invalid);assert.equal(d.amount,'');assert(c.U.expenseVoiceIssues.length);speak('แก้ยอดเป็น 49000');}
 const markup=c.vAdd();assert(markup.indexOf('id="amt"')<markup.indexOf('class="expense-action-tools"'));assert(markup.indexOf('class="expense-action-tools"')<markup.indexOf('id="pid"'));assert(markup.includes('ข้อความที่ได้ยินล่าสุด'));assert(markup.includes('แก้ยอดเป็น 49000'));
 c.U.draft=c.newDraft('out','p');assert(!c.vAdd().includes('แก้ยอดเป็น 49000'));
});
test('backup choices separate file cloud and restore without changing data or removing confirmation gates',()=>{
 const info=c.cloudSyncInfo,before=JSON.stringify(c.S);c.U.sheet={kind:'backup'};
 for(const enabled of [false,true]){c.cloudSyncInfo=()=>({enabled,label:enabled?'ซิงก์แล้ว':'ปิด',meta:{hit:enabled,revision:3,savedAt:'2026-10-17'},key:''});let h=c.sheetHtml();for(const title of ['1. เก็บไฟล์สำรองไว้กับคุณ','2. สำรองและซิงก์บนคลาวด์','3. กู้คืนจากไฟล์สำรอง'])assert(h.includes(title));for(const action of ['backupFile','copyBk','restoreOpen','cloudUseKey','closeSheet'])assert(h.includes('data-act="'+action+'"'));assert(h.includes('id="bkbox"'));assert(h.includes('id="cloudKeyImport"'));if(enabled){for(const action of ['cloudPush','cloudPull','cloudHistory','cloudCopyKey','cloudDisable','cloudAcceptance','cloudFilesMigrate','cloudRestorePrevious'])assert(h.includes('data-act="'+action+'"'));c.U.confirm='cloudPull';h=c.sheetHtml();assert(h.includes('ยืนยันแทนที่ข้อมูลในเครื่องด้วยข้อมูลคลาวด์'));assert(h.includes('dng sure'));}else assert(h.includes('data-act="cloudEnable"'));c.U.confirm=null;}
 c.cloudSyncInfo=info;c.U.sheet=null;assert.equal(JSON.stringify(c.S),before);
});
test('fragmented Thai currency suffix from iPhone speech keeps rental amount and category',()=>{
 for(const text of ['ค่าเช่าเครื่องตบดิน 500 ย','ค่าเช่าเครื่องตบดิน 500 บ','ค่าเช่าเครื่องตบดิน 500 บา','ค่าเช่าเครื่องตบดิน ๕๐๐ ย','ค่าเช่าเครื่องตบดิน 500 บาท']){
  const x=c.expenseVoiceParse(text);assert.equal(x.transcript,text);assert.equal(x.amount,'500',text);assert.equal(x.cat,'ค่าเช่าอื่นๆ',text);assert.equal(x.sub,'เครื่องตบดิน',text);assert.equal(x.amountIssue,false,text);
 }
 for(const text of ['ค่าเช่าเครื่องตบดิน 500 คิว','ค่าเช่าเครื่องตบดิน 500 ยาง','ค่าเช่าเครื่องตบดิน 500 ย 600','ค่าเช่าเครื่องตบดิน 500 บาท 600 ย','ค่าทราย 5 คิว 500 ย','ค่าเช่าเครื่องตบดิน 50,00 ย','ค่าเช่าเครื่องตบดิน -500 ย']){
  const x=c.expenseVoiceParse(text);assert.equal(x.amount,'',text);
 }
 for(const text of ['ค่าเช่าเครื่องตบดิน 50,00 ย','ค่าเช่าเครื่องตบดิน -500 ย','ค่าเช่าเครื่องตบดิน 500 บาท 600 ย','ค่าทราย 5 คิว 500 ย'])assert.equal(c.expenseVoiceParse(text).amountIssue,true,text);
 c.expenseVoiceStop();let instance;
 c.window.SpeechRecognition=function(){instance=this;this.start=()=>{};this.stop=()=>{this.onend?.()};this.abort=()=>{};};
 c.U.view='add';c.U.draft=c.newDraft('out','p');assert(c.expenseVoiceStart());
 instance.onresult({results:[[{transcript:'ค่าเช่าเครื่องตบดิน 500 ย'}]]});instance.onend();
 assert.equal(c.U.draft.amount,'500');assert.equal(c.U.draft.sub,'เครื่องตบดิน');assert.equal(c.U.draft.cat,'ค่าเช่าอื่นๆ');assert.equal(c.S.tx.length,0);
});
test('short material expenses without baht split the item and amount, including Thai number words',()=>{
 for(const text of ['ค่าทราย 500','ค่าทราย500','ค่าทราย ๕๐๐','ค่าทราย ห้าร้อย','ค่าปูน 1,250','ค่าเหล็ก สองพัน']){const x=c.expenseVoiceParse(text);assert.equal(x.cat,'ค่าของ');assert.equal(x.amount,/ปูน/.test(text)?'1250':/เหล็ก/.test(text)?'2000':'500');assert.equal(x.sub,/ปูน/.test(text)?'ปูน':/เหล็ก/.test(text)?'เหล็ก':'ทราย');}
 for(const text of ['ค่าทราย 5 คิว','ค่าทราย วันที่ 17/10/2569','ค่าทราย -500','ค่าทราย-500','ค่าทราย 5 คิว 500','ค่าทราย 50,00'])assert.equal(c.expenseVoiceParse(text).amount,'',text);
});
test('fresh recognizer per tap waits for end and never starts automatically',()=>{
 c.expenseVoiceStop();let instance,constructed=0,starts=0;c.window.webkitSpeechRecognition=function(){constructed++;instance=this;this.start=()=>{starts++;this.onstart();};this.stop=()=>{};this.abort=()=>{};};delete c.window.SpeechRecognition;c.U.view='add';c.U.draft=c.newDraft('out','p');
 for(let i=0;i<10;i++){assert(c.expenseVoiceStart());const result=instance.onresult;result({results:[[{transcript:'ค่าทราย '+(500+i)}]]});assert.equal(c.U.expenseVoiceState,'closing');assert(c.expenseVoiceStart());assert.equal(starts,i+1);instance.onend();assert.equal(c.U.draft.amount,String(500+i));assert.equal(starts,i+1,'end must not start a new recording');result({results:[[{transcript:'ค่าทราย 9999'}]]});assert.equal(c.U.draft.amount,String(500+i));}
 assert.equal(constructed,10);assert.equal(c.U.expenseVoiceEnding,null);assert.equal(c.S.tx.length,0);
 c.U.draft=c.newDraft('out','p');c.expenseVoiceStart();instance.onresult({results:[[{transcript:'ค่าทราย 700'}]]});timers.get(c.U.expenseVoiceReleaseTimer)();assert.equal(c.U.draft.amount,'700');assert.equal(c.U.expenseVoiceDiagnostic.code,'END_TIMEOUT');assert(c.expenseVoiceStart());assert.equal(constructed,12);c.expenseVoiceStop();
});
test('missing native start and missing result release mic and expose metadata only',()=>{
 c.window.SpeechRecognition=function(){this.start=()=>{};this.stop=()=>{};this.abort=()=>{};};c.U.view='add';c.U.draft=c.newDraft('out','p');c.U.draft.amount='123';assert(c.expenseVoiceStart());assert.equal(c.U.expenseVoiceState,'starting');assert.equal(c.U.expenseVoiceDiagnostic.started,false);timers.get(c.U.expenseVoiceTimer)();assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.U.expenseVoiceDiagnostic.code,'NO_START_EVENT');assert.equal(c.U.draft.amount,'123');assert(c.U.expenseVoiceEnding);c.U.expenseVoiceEnding.onend();
 assert(c.expenseVoiceStart());c.U.expenseVoiceRecognition.onstart();assert.equal(c.U.expenseVoiceState,'listening');timers.get(c.U.expenseVoiceTimer)();assert.equal(c.U.expenseVoiceState,'closing');timers.get(c.U.expenseVoiceReleaseTimer)();assert.equal(c.U.expenseVoiceDiagnostic.code,'END_TIMEOUT');assert.equal(c.U.draft.amount,'123');assert(!c.expenseVoiceDiagnosticText().includes('123'));assert(!('transcript' in c.U.expenseVoiceDiagnostic));
});
test('explicit monetary amounts win over dimensions, quantities, dates and phone numbers',()=>{
 for(const [text,amount] of [['ซื้อเหล็ก 12 มม. 50 เส้น ยอด 4,500 บาท','4500'],['วันที่ 15 จ่าย 1200 บาท ร้านทดสอบ','1200'],['โทร 000-9876543 ยอดเงิน 6,430.00 บาท','6430'],['จ่าย ๑,๒๐๐ บาท ร้านสมใจ','1200'],['จ่าย950บาทร้านทดสอบ','950'],['จ่ายหนึ่งพันสองร้อยบาท','1200'],['ยอดสองหมื่นห้าพันบาทห้าสิบสตางค์','25000.5'],['จำนวนเงินเก้าร้อยเก้าสิบเก้าบาท','999'],['จ่าย 300 ร้านสมใจ','300'],['฿ 320.50','320.5']])assert.equal(c.expenseVoiceParse(text).amount,amount,text);
 for(const text of ['เหล็ก 12 มม. 50 เส้น','วันที่ 15/10/2569','โทร 000-9876543','ยอด 000-9876543','จ่าย 12 เส้น','จ่าย -500 บาท','ราคา 100 บาท อีก 200 บาท'])assert.equal(c.expenseVoiceParse(text).amount,'',text);
 assert.equal(c.S.tx.length,0);
});
test('ten voice sessions, repeated errors, stop, navigation and stale callbacks preserve draft ownership',()=>{
 let instance,aborts=0;c.window.SpeechRecognition=function(){instance=this;this.start=()=>{};this.abort=()=>{aborts++;this.onend?.();};};
 c.U.draft=c.newDraft('out','p');
 for(let i=0;i<10;i++){assert(c.expenseVoiceStart());instance.onresult({results:[[{transcript:`จ่าย ${100+i} บาท`}]]});instance.onend();assert.equal(c.U.draft.amount,String(100+i));assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.U.expenseVoiceTimer,null);}
 for(const error of ['no-speech','not-allowed','network']){c.expenseVoiceStart();instance.onerror({error});assert(c.U.expenseVoiceEnding);instance.onend();assert.equal(c.U.expenseVoiceRecognition,null);}
 c.expenseVoiceStart();const stale=instance.onresult;const old=c.U.draft;c.U.draft=c.newDraft('out','p');stale({results:[[{transcript:'จ่าย 999 บาท'}]]});assert.equal(c.U.draft.amount,'');assert.equal(old.amount,'109');
 c.expenseVoiceStart();const late=instance.onresult;c.applyNavState({view:'home'});late({results:[[{transcript:'จ่าย 999 บาท'}]]});assert.equal(c.U.draft.amount,'');assert.equal(c.U.expenseVoiceRecognition,null);
 c.U.view='add';c.expenseVoiceStart();c.document.visibilityState='hidden';listeners.visibilitychange.forEach(f=>f());assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(aborts,3,'only explicit draft/navigation/visibility cancellations abort');assert.equal(c.S.tx.length,0);
 c.U.draft=c.newDraft('out','p');c.U.draft.sub='old expense detail';c.expenseVoiceStart();instance.onresult({results:[[{transcript:'รับเงิน 1200 บาท รับจากลูกค้า รายการงวดงาน'}]]});instance.onend();assert.equal(c.U.draft.type,'in');assert.equal(c.U.draft.cat,c.CAT_IN[1]);assert.equal(c.U.draft.amount,'1200');assert.equal(c.U.draft.sub,'งวดงาน');assert.equal(c.S.tx.length,0);
});
const rows=[1480,2250,2700].map((amount,i)=>({amount,date:'2026-10-14',sub:'วัสดุทดสอบ '+(i+1),partner:'ร้านทดสอบ',cat:'ค่าของ',confidence:.99}));
test('document total survives request validation, normalization, review and mismatch rejection',()=>{
 const validated=c.aiGatewayValidateExpense({rows,documentTotal:6430}),normalized=c.expenseOcrNormalizeRemote(validated),items=c.expenseBatchItemsFromResult(normalized,'test-photo','test.png','p','transfer','g');
 assert.equal(normalized.documentTotal,6430);assert(items.every(x=>x.ocrDocumentTotal===6430));assert.equal(items.reduce((n,x)=>n+x.amount,0),6430);
 assert.equal(c.expenseBatchReconciliation(items)[0].mismatch,false);items[0].amount=999;assert.equal(c.expenseBatchReconciliation(items)[0].mismatch,true);
 assert.equal(c.aiGatewayValidateExpense({amount:100}).documentTotal,null);for(const v of [-1,Infinity,'oops',1000000001])assert.throws(()=>c.aiGatewayValidateExpense({documentTotal:v}));
});
test('diagnostics are bounded, allowlisted metadata without private receipt fields or provider messages',()=>{
 for(let i=0;i<14;i++)c.recordOcrDiagnostic({ok:false,errorCode:'PROVIDER_HTTP_400',requestId:'request-'+i,imageMeta:{mime:'image/jpeg',bytes:1500,width:900,height:1200},text:'private bill',amount:6430,partner:'private vendor'});
 assert.equal(c.S.ops.ocrDiagnosticHistory.length,10);assert.equal(c.S.ops.ocrDiagnostic.imageWidth,900);const serialized=JSON.stringify(c.S.ops.ocrDiagnosticHistory);assert(!/private bill|private vendor|6430/.test(serialized));
 c.recordOcrDiagnostic({errorCode:'provider leaked key secret'});assert.equal(c.S.ops.ocrDiagnostic.errorCode,'OCR_ERROR');
});
test('HTTP400 is not blindly retried; failed local OCR preserves the actual provider error',async()=>{
 let calls=0;c.aiGatewayConfig=()=>({mode:'gateway',remoteOcrConsent:true});c.aiGatewayRequest=async()=>{calls++;const e=Error('PROVIDER_IMAGE_INVALID');e.gatewayCode=e.message;throw e;};c.expenseOcrLocal=async()=>({amount:0,source:'local'});
 await assert.rejects(c.expenseOcrRecognize({width:900,height:1200,toDataURL:()=> 'data:image/jpeg;base64,AA'}),e=>e.gatewayCode==='PROVIDER_IMAGE_INVALID');assert.equal(calls,1);
 c.expenseOcrLocal=async()=>({amount:6430,source:'local'});assert.equal((await c.expenseOcrRecognize({toDataURL:()=> 'data:image/jpeg;base64,AA'})).amount,6430);assert.equal(calls,2);
});
test('scan errors have one actionable alert scoped to the original draft',()=>{
 c.U.view='add';c.U.draft=c.newDraft('out','p');c.U.expenseScanRetryDraft=c.U.draft;c.U.expenseScanRetryFile={name:'private.png'};c.U.expenseScanBusy=false;c.U.expenseScanTone='error';c.U.expenseScanMsg=c.expenseOcrErrorMessage({gatewayCode:'PROVIDER_HTTP_400'});c.U.draft.photo='test';c.U.draft.ocrSource='ai';
 const markup=c.vAdd();assert.equal((markup.match(/expense-scan-result/g)||[]).length,1);assert(markup.includes('role="alert"'));assert(markup.includes('data-act="expenseScanRetry"'));assert(markup.includes('data-act="expenseScanManual"'));assert(!markup.includes('AI/OCR กรอกค่าจากบิลให้แล้ว'));
 c.U.draft=c.newDraft('out','p');assert(!c.expenseScanStatusHtml(c.U.draft).includes('data-act="expenseScanRetry"'));
});
test('provider failures classify safe reasons, keep HTTP400 single-attempt and retry 503 only',async()=>{
 const w={URL,Request,Response,Headers,AbortController,TextEncoder,TextDecoder,setTimeout,clearTimeout,Date,Map,JSON,Math,Number,String,Error,Promise,console,crypto:require('node:crypto').webcrypto};vm.createContext(w);vm.runInContext(fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker='),w);
 const p={provider:'generic',url:'https://provider.test',key:'secret',timeout:1000,retries:2};
 for(const [status,message,expected] of [[400,'Unable to decode image','PROVIDER_IMAGE_INVALID'],[400,'API key not valid','PROVIDER_AUTH_FAILED'],[400,'Unknown name thinkingConfig','PROVIDER_REQUEST_INVALID'],[400,'Unknown provider failure secret','PROVIDER_HTTP_400'],[401,'secret','PROVIDER_AUTH_FAILED']]){let calls=0;w.fetch=async()=>{calls++;return new Response(JSON.stringify({error:{message}}),{status});};await assert.rejects(w.providerFetch(p,{image:'data:image/png;base64,AA'},'id'),e=>e.message===expected);assert.equal(calls,1);}
 let calls=0;w.fetch=async()=>new Response('{}',{status:++calls<3?503:200});assert.equal((await w.providerFetch(p,{},'id')).status,200);assert.equal(calls,3);
 const incomplete=w.cleanExpense({text:'Page 2 of 2',amount:6430,documentTotal:6430,rows:[{amount:2700,sub:'Sand'}]});assert.equal(incomplete.partialDocument,true);assert.equal(incomplete.amount,0);assert.equal(incomplete.documentTotal,null);assert.equal(incomplete.rows[0].amount,2700);
});
test('live receipt gate rejects partial rows, telephone amounts, wrong total and date',async()=>{
 const {verifyExpenseReceipt}=await import('./expense-document-quality.mjs'),data={rows,amount:0,documentTotal:6430};assert(verifyExpenseReceipt(data));
 for(const corrupt of [{...data,documentTotal:9876543},{...data,rows:rows.slice(0,2)},{...data,rows:rows.map((r,i)=>i? r:{...r,amount:12})},{...data,rows:rows.map(r=>({...r,date:''}))}])assert.throws(()=>verifyExpenseReceipt(corrupt));
});
test('expanded receipt gate verifies net adjustments and incomplete-page source rows independently',async()=>{
 const {verifyExpenseCase}=await import('./expense-document-quality.mjs'),net={amount:2889,documentTotal:2889,date:'2026-10-14',cat:'ค่าของ',partialDocument:false,rows:[]},vat={id:'discount-vat',mode:'net',amount:2889};assert(verifyExpenseCase(net,vat));assert.throws(()=>verifyExpenseCase({...net,amount:3000},vat));assert.throws(()=>verifyExpenseCase({...net,rows:[{amount:2700},{amount:189}]},vat));
 const partial={amount:0,documentTotal:null,partialDocument:true,rows:[{amount:1480},{amount:2250}]},item={id:'page-1-of-2',mode:'partial'};assert(verifyExpenseCase(partial,item));assert.throws(()=>verifyExpenseCase({...partial,amount:6430},item));assert.throws(()=>verifyExpenseCase({...partial,partialDocument:false},item));assert.throws(()=>verifyExpenseCase({...partial,rows:[{amount:3730}]},item));
 const manifest=JSON.parse(fs.readFileSync('tests/fixtures/expense-quality/manifest.json','utf8'));assert.equal(manifest.cases.length,7);for(const x of manifest.cases){const bytes=fs.readFileSync(require('node:path').join('tests/fixtures/expense-quality',x.file));assert.equal(bytes.subarray(1,4).toString(),'PNG');}
});
(async()=>{for(const [name,f] of tests){await f();console.log('PASS',name);}console.log('PASS',tests.length,'OCR and voice reliability groups');})().catch(e=>{console.error(e);process.exitCode=1;});
