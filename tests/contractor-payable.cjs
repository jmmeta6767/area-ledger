/* Fixed-price contractor payable feature regression (no external dependencies). */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8');
function fn(name,next){
 const from=html.indexOf('function '+name+'('),to=html.indexOf('function '+next+'(',from);
 assert(from>=0&&to>from,'missing contractor function '+name);
 return html.slice(from,to);
}
const source=fn('contractorRows','contractorTotals')+fn('contractorTotals','contractorCard')+fn('contractorCard','contractorCreate')+fn('contractorCreate','txPayments');
const state={projects:[{id:'p',name:'Project'}],tx:[]};
let seq=0,persistOK=true,closed=false;
const cx={S:state,uid:()=>String(++seq),today:()=> '2026-10-13',validIsoDate:x=>/^\d{4}-\d{2}-\d{2}$/.test(x),isPeriodClosed:()=>closed,proj:id=>state.projects.find(x=>x.id===id),persist:()=>persistOK,net:t=>t.amount,txPayments:t=>t.payments||[],txPaidNet:t=>(t.payments||[]).reduce((a,p)=>a+p.amount,0),txOutstandingNet:t=>Math.max(0,t.amount-(t.payments||[]).reduce((a,p)=>a+p.amount,0)),txPaymentState:t=>({paid:(t.payments||[]).reduce((a,p)=>a+p.amount,0),remain:Math.max(0,t.amount-(t.payments||[]).reduce((a,p)=>a+p.amount,0))}),fmt:n=>'฿'+Number(n).toLocaleString('en-US'),esc:s=>String(s)};
vm.createContext(cx);vm.runInContext(source,cx);
state.role='owner';
let t=cx.contractorCreate('p','ช่างสมชาย','เหมาโครงสร้าง','50000','จ่ายเมื่อจบโครงการ','');
assert(t&&t.id&&t.paid===false&&t.contractorPayable===true);
assert.equal(cx.contractorTotals('p').total,50000);assert.equal(cx.contractorTotals('p').paid,0);assert.equal(cx.contractorTotals('p').remain,50000);
t.payments.push({id:'1',date:'2026-10-14',amount:30000,pay:'transfer'});
assert.equal(cx.contractorTotals('p').paid,30000);assert.equal(cx.contractorTotals('p').remain,20000);
assert.equal(cx.contractorCard('p').includes('20,000'),true);
t.payments.push({id:'2',date:'2026-10-15',amount:20000,pay:'cash'});
assert.equal(cx.contractorTotals('p').remain,0);
assert.equal(cx.contractorRows('p').length,1,'paying installments never creates duplicate expense rows');
const before=state.tx.length;
assert.equal(cx.contractorCreate('p','','job',3000,'',''),false);
assert.equal(cx.contractorCreate('missing','ช่าง','job',3000,'',''),false);
closed=true;assert.equal(cx.contractorCreate('p','ช่าง','job',3000,'',''),false);closed=false;
persistOK=false;assert.equal(cx.contractorCreate('p','ช่าง','job',3000,'',''),false);
assert.equal(state.tx.length,before,'persist failure must rollback');
assert(html.includes("data-act=\"contractorSave\""));
assert(html.includes("data-act=\"apPayOpen\""));
assert(html.includes("else if(a==='apPaySave')"),'drawdowns must use existing AP payment engine');
console.log('PASS contractor fixed-price payable and 50,000 → 30,000 → 20,000 drawdown');
