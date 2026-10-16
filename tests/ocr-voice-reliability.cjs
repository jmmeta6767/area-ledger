/* Synthetic data only. Exercises the actual client and provider request functions. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8'),code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n').replace(/\nboot\(\);/,'\n');
const listeners={},timers=new Map();let timerId=0;
const node=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){},appendChild(){},innerHTML:''});
const c={console,Date,Math,JSON,Number,String,Array,Object,Promise,Set,Map,RegExp,URL,parseFloat,isFinite,isNaN,AbortController,setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id),navigator:{},location:{protocol:'https:',origin:'https://ledger.test',hostname:'ledger.test'},history:{pushState(){},replaceState(){}},window:{addEventListener(){},scrollTo(){}},document:{addEventListener(k,f){(listeners[k]??=[]).push(f);},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return [];},documentElement:node(),body:node(),createElement:node},localStorage:{getItem(){return null;},setItem(){},removeItem(){}},sessionStorage:{getItem(){return null;},setItem(){},removeItem(){}}};
vm.createContext(c);vm.runInContext(code,c);c.render=()=>{};c.toast=()=>{};c.persist=()=>true;c.S=c.emptyState();c.S.projects=[{id:'p',name:'Test',status:'active'}];c.U.view='add';
const tests=[];function test(name,f){tests.push([name,f]);}
test('explicit monetary amounts win over dimensions, quantities, dates and phone numbers',()=>{
 for(const [text,amount] of [['ซื้อเหล็ก 12 มม. 50 เส้น ยอด 4,500 บาท','4500'],['วันที่ 15 จ่าย 1200 บาท ร้านทดสอบ','1200'],['โทร 064-9893124 ยอดเงิน 6,430.00 บาท','6430'],['จ่าย ๑,๒๐๐ บาท ร้านสมใจ','1200'],['จ่าย950บาทร้านทดสอบ','950'],['จ่ายหนึ่งพันสองร้อยบาท','1200'],['ยอดสองหมื่นห้าพันบาทห้าสิบสตางค์','25000.5'],['จำนวนเงินเก้าร้อยเก้าสิบเก้าบาท','999'],['จ่าย 300 ร้านสมใจ','300'],['฿ 320.50','320.5']])assert.equal(c.expenseVoiceParse(text).amount,amount,text);
 for(const text of ['เหล็ก 12 มม. 50 เส้น','วันที่ 15/10/2569','โทร 000-9876543','ยอด 000-9876543','จ่าย 12 เส้น','จ่าย -500 บาท','ราคา 100 บาท อีก 200 บาท'])assert.equal(c.expenseVoiceParse(text).amount,'',text);
 assert.equal(c.S.tx.length,0);
});
test('ten voice sessions, repeated errors, stop, navigation and stale callbacks preserve draft ownership',()=>{
 let instance,aborts=0;c.window.SpeechRecognition=function(){instance=this;this.start=()=>{};this.abort=()=>{aborts++;this.onend?.();};};
 c.U.draft=c.newDraft('out','p');
 for(let i=0;i<10;i++){assert(c.expenseVoiceStart());instance.onresult({results:[[{transcript:`จ่าย ${100+i} บาท`}]]});assert.equal(c.U.draft.amount,String(100+i));assert.equal(c.U.expenseVoiceRecognition,null);assert.equal(c.U.expenseVoiceTimer,null);}
 for(const error of ['no-speech','not-allowed','network']){c.expenseVoiceStart();instance.onerror({error});assert.equal(c.U.expenseVoiceRecognition,null);}
 c.expenseVoiceStart();const stale=instance.onresult;const old=c.U.draft;c.U.draft=c.newDraft('out','p');stale({results:[[{transcript:'จ่าย 999 บาท'}]]});assert.equal(c.U.draft.amount,'');assert.equal(old.amount,'109');
 c.expenseVoiceStart();const late=instance.onresult;c.applyNavState({view:'home'});late({results:[[{transcript:'จ่าย 999 บาท'}]]});assert.equal(c.U.draft.amount,'');assert.equal(c.U.expenseVoiceRecognition,null);
 c.U.view='add';c.expenseVoiceStart();c.document.visibilityState='hidden';listeners.visibilitychange[0]();assert.equal(c.U.expenseVoiceRecognition,null);assert(aborts>=16);assert.equal(c.S.tx.length,0);
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
});
test('live receipt gate rejects partial rows, telephone amounts, wrong total and date',async()=>{
 const {verifyExpenseReceipt}=await import('./expense-document-quality.mjs'),data={rows,amount:0,documentTotal:6430};assert(verifyExpenseReceipt(data));
 for(const corrupt of [{...data,documentTotal:9876543},{...data,rows:rows.slice(0,2)},{...data,rows:rows.map((r,i)=>i? r:{...r,amount:12})},{...data,rows:rows.map(r=>({...r,date:''}))}])assert.throws(()=>verifyExpenseReceipt(corrupt));
});
(async()=>{for(const [name,f] of tests){await f();console.log('PASS',name);}console.log('PASS',tests.length,'OCR and voice reliability groups');})().catch(e=>{console.error(e);process.exitCode=1;});
