/* AREA Ledger subcontractor withdrawals · executable regression with no external dependencies. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
for(const script of scripts)new vm.Script(script);
const start=html.indexOf('/* Subcontractor progress payments');
const end=html.indexOf('function vProject(){',start);
assert(start>0&&end>start,'subcontractor helpers are bundled in Cloudflare app');
const S={role:'owner',projects:[{id:'p1',name:'Project 1'},{id:'p2',name:'Project 2'}],tx:[],auditLog:[]};
const U={saveLock:false};
let persistOK=true,writes=0,serial=0;
const messages=[];
const ctx={S,U,console,Date,Math,isFinite,Number,String,Error,
  uid:()=> 'sub-'+(++serial),
  proj:id=>S.projects.find(p=>p.id===id),
  today:()=> '2026-10-13',
  validIsoDate:x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x,
  isPeriodClosed:()=>false,periodKey:x=>x.slice(0,7),
  persist:()=>{writes++;return persistOK;},
  toast:x=>messages.push(x),
  accountingAudit:(action,entity,id,before,after,note)=>S.auditLog.push({action,entity,id,note}),
  txPayments:t=>t.payments||[],
  txPaidNet:t=>Math.min(+t.amount||0,(t.payments||[]).reduce((v,p)=>v+(+p.amount||0),0)),
  txOutstandingNet:t=>Math.max(0,Math.round(((+t.amount||0)-Math.min(+t.amount||0,(t.payments||[]).reduce((v,p)=>v+(+p.amount||0),0)))*100)/100),
  fmt:n=>'฿'+Number(n).toLocaleString('en-US'),
  esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
};
vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
function expectThrow(fn,substr){assert.throws(fn,e=>e.message.includes(substr));}
const t=ctx.subcontractCreateRecord('p1','ทีมช่างสมชาย','งานโครงสร้าง',50000,'2026-10-13','จ่ายเมื่อจบโครงการ');
assert.equal(t.subcontract,true);
assert.equal(t.subcontractDueMode,'completion');
assert.equal(t.due,'');
assert.equal(t.type,'out');
assert.equal(t.cat,'ค่าแรง');
assert.equal(t.paid,false);
assert.equal(t.wht,false);
assert.equal(ctx.subcontractCommit(t),true);
assert.equal(writes,1);
assert.equal(S.tx.length,1,'commit a single expense/AP transaction');
assert.equal(ctx.subcontractSummary('p1').agreed,50000);
assert.equal(ctx.subcontractSummary('p1').paid,0);
assert.equal(ctx.subcontractSummary('p1').remaining,50000);
assert.equal(ctx.subcontractSummary('p2').count,0,'project isolation');

const advance=ctx.subcontractPaymentDraft(t,30000,'2026-10-13','transfer','เบิกค่าแรงงวดที่ 1');
t.payments.push(advance);
assert.equal(S.tx.length,1,'no duplicate expense when paying subcontractor');
assert.equal(ctx.subcontractSummary('p1').paid,30000);
assert.equal(ctx.subcontractSummary('p1').remaining,20000);
assert.equal(advance.note,'เบิกค่าแรงงวดที่ 1');
assert.equal(advance.pay,'transfer');
assert.equal(ctx.subcontractProjectSection('p1').includes('20,000'),true);
assert.equal(ctx.subcontractProjectSection('p1').includes('เบิกค่าแรงงวดที่ 1'),true);
expectThrow(()=>ctx.subcontractPaymentDraft(t,20000.01,'2026-10-13','cash',''),'ไม่เกินยอดค้างจ่าย');
expectThrow(()=>ctx.subcontractPaymentDraft(t,0,'2026-10-13','cash',''),'มากกว่า 0');
expectThrow(()=>ctx.subcontractPaymentDraft(t,500,'2026-02-30','cash',''),'วันที่เบิกเงิน');
expectThrow(()=>ctx.subcontractPaymentDraft(t,100,'2026-10-13','crypto',''),'ช่องทาง');

const last=ctx.subcontractPaymentDraft(t,20000,'2026-10-14','cash','ปิดยอดเมื่อส่งงาน');
t.payments.push(last);
assert.equal(ctx.subcontractSummary('p1').remaining,0,'fully paid after final installment');
assert.equal(ctx.subcontractSummary('p1').paid,50000);
expectThrow(()=>ctx.subcontractPaymentDraft(t,1,'2026-10-15','cash',''),'ยอดค้างจ่าย');
assert.equal(ctx.subcontractProjectSection('p1').includes('ประวัติการเบิก 2 ครั้ง'),true);
assert.equal(S.tx.length,1);

expectThrow(()=>ctx.subcontractCreateRecord('p1','','งานโครงสร้าง',50000,'2026-10-13',''),'ชื่อช่าง');
expectThrow(()=>ctx.subcontractCreateRecord('p1','ช่าง','',50000,'2026-10-13',''),'ประเภทงาน');
expectThrow(()=>ctx.subcontractCreateRecord('p1','ช่าง','งาน',-50,'2026-10-13',''),'ค่าเหมา');
expectThrow(()=>ctx.subcontractCreateRecord('p1','ช่าง','งาน',50000,'not a date',''),'วันที่');
expectThrow(()=>ctx.subcontractCreateRecord('unlisted','ช่าง','งาน',50000,'2026-10-13',''),'โครงการ');

const second=ctx.subcontractCreateRecord('p1','ทีมช่างใหม่','งานหลังคา',15000,'2026-10-13','');
persistOK=false;
assert.equal(ctx.subcontractCommit(second),false,'storage failure blocks the new payable');
assert.equal(S.tx.length,1,'rollback a failed save');
assert.equal(S.auditLog.length,1,'rollback audit when write fails');
persistOK=true;
assert.equal(ctx.subcontractCommit(second),true);
assert.equal(ctx.subcontractSummary('p1').remaining,15000);
assert.equal(ctx.subcontractCommit(second),false,'prevent accidental duplicate contract');
assert.equal(S.tx.length,2);
S.role='foreman';
assert.equal(ctx.subcontractCommit(ctx.subcontractCreateRecord('p1','ทีมพิเศษ','โครงเหล็ก',1000,'2026-10-13','')),false);
assert.equal(ctx.subcontractProjectSection('p1'),'','foreman cannot see owner-only payable details');
S.role='owner';

for(const contract of [
  'data-act="subcontractNew"',
  'data-act="subcontractSave"',
  "a==='subcontractSave'",
  'subcontractPaymentDraft(apt1,amtAP,dateAP,payAP,noteAP)',
  'if(t2.subcontract)',
  'if(dtx.subcontract&&txPayments(dtx).length)',
  'if(t.subcontract){toast',
  "a==='apPaySave'",
  'data-act="apPayOpen"',
  "accountingAudit('subcontract-create'"
])assert(html.includes(contract),'missing subcontract UI or safety guard '+contract);
assert(html.includes("subcontractProjectSection(p.id)"),'project page must render payable records');
assert(html.includes("if(accountingPeriodLocked(dateAP"),'advance must respect closed accounting periods');
assert(html.includes("value=\"'+(subcontract?'':aps.remain)+'\""),'progress advance must require explicit amount, no auto-full-pay');
assert(html.includes("if(d.id&&(S.tx||[]).some(function(x){return x.id===d.id&&x.subcontract===true;}))"),'generic transaction save must not edit subcontract payables');
assert.equal(html.includes("var KEY='site-ledger-v1'"),true,'localStorage schema must remain frozen');
assert.equal(html.includes("'site-ledger-db'"),true,'IndexedDB schema must remain frozen');
console.log('PASS subcontractor commitments, progress withdrawals, balance, anti-duplication, role and storage safety');
