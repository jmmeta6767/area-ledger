import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Actual user-supplied upright Pr.4 image. Connectivity alone cannot pass this gate.
const base=(process.env.AREA_LEDGER_LIVE_BASE||'https://area-ledger-ai-gateway-staging.areamaibab.workers.dev').replace(/\/$/,'');
assert(['https://area-ledger-ai-gateway-staging.areamaibab.workers.dev','https://area-ledger-ai-gateway.areamaibab.workers.dev'].includes(base),'unsupported quality-gate target');
const expected=[
  {name:'ฉาบปูนเสาโครงสร้าง',category:'ค่าของ',price:27.25,amount:1308},
  {name:'ฉาบปูนเสาโครงสร้าง',category:'ค่าแรง',price:109,amount:5232},
  {name:'ทาสีน้ำพลาสติกเสาโครงสร้าง',category:'ค่าของ',price:50.64,amount:2430.72},
  {name:'ทาสีน้ำพลาสติกเสาโครงสร้าง',category:'ค่าแรง',price:35,amount:1680}
];
export function verifyPr4(data){
  assert(Array.isArray(data.rows),'missing BOQ rows');
  assert.equal(data.rows.length,4,'expected two items split into material and labor');
  const compact=s=>String(s||'').replace(/[\s\-–—]/g,'');
  for(const e of expected){
    const candidates=data.rows.filter(r=>compact(r.name).includes(e.name)&&r.category===e.category);
    assert.equal(candidates.length,1,'missing or duplicate '+e.name+' '+e.category);
    const r=candidates[0];assert.equal(Number(r.qty),48);assert.equal(compact(r.unit),'ตร.ม.');
    assert(Math.abs(Number(r.unitPrice)-e.price)<.005,'incorrect printed unit price');
    assert(Math.abs(Number(r.qty)*Number(r.unitPrice)-e.amount)<.01,'incorrect row amount');
    assert(Math.abs(Number(r.amount)-e.amount)<.01,'missing or incorrect printed amount');
    assert.equal(r.sectionCode,'1.2.2','incorrect printed section');
  }
  assert(data.rows.every(r=>![17,18,31,32].includes(Number(r.unitPrice))),'handwritten references became prices');
  return {rows:4,material:3738.72,labor:6912,total:10650.72,uprightFixture:true};
}

if(process.argv[1]&&new URL(import.meta.url).pathname.endsWith(process.argv[1].replace(/\\/g,'/').split('/').pop())){
  const evidence={base,sourceSha:process.env.AREA_LEDGER_ACCEPTANCE_SHA||null,workflowRun:process.env.AREA_LEDGER_ACCEPTANCE_RUN||null,at:new Date().toISOString(),fixture:'boq-pr4-field.jpeg'};
  try{
    const shell=await fetch(base+'/',{signal:AbortSignal.timeout(20000),cache:'no-store'});
    assert(shell.ok,'app shell unavailable');
    const match=(await shell.text()).match(/var APP_BUILD=(\{[^;]+\});/);
    assert(match,'missing deployed build identity');
    evidence.deployedBuild=JSON.parse(match[1]);
    const target=base.includes('-staging.')?'staging':'production';
    assert.equal(evidence.deployedBuild.environment,target,'wrong deployment environment');
    if(evidence.sourceSha)assert.equal(evidence.deployedBuild.sha,evidence.sourceSha,'wrong deployed source');
    const image=fs.readFileSync(new URL('./fixtures/boq-pr4-field.jpeg',import.meta.url));
    evidence.fixtureSha256=crypto.createHash('sha256').update(image).digest('hex');
    const rid='pr4-quality-'+crypto.randomBytes(12).toString('hex');
    const res=await fetch(base+'/v1/ocr/boq',{method:'POST',signal:AbortSignal.timeout(60000),headers:{Origin:base,'Content-Type':'application/json','X-AREA-Gateway-Version':'1','X-AREA-Request-ID':rid},body:JSON.stringify({image:'data:image/jpeg;base64,'+image.toString('base64'),lang:'tha+eng'})});
    evidence.status=res.status;const data=await res.json();
    assert(res.ok,'BOQ provider failed: '+JSON.stringify(data));
    assert.equal(res.headers.get('x-area-request-id'),rid);assert.equal(res.headers.get('x-area-gateway-version'),'1');
    evidence.actualRows=data.rows;evidence.checks=verifyPr4(data);evidence.ok=true;
  }catch(e){evidence.ok=false;evidence.error=String(e.message||e);process.exitCode=1;}
  fs.writeFileSync('boq-document-quality.json',JSON.stringify(evidence,null,2));
  console.log(JSON.stringify(evidence,null,2));
}
