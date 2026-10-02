import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const base=(process.env.AREA_LEDGER_LIVE_BASE||'https://area-ledger-ai-gateway-staging.areamaibab.workers.dev').replace(/\/$/,'');
const declaredTarget=String(process.env.AREA_LEDGER_ACCEPTANCE_TARGET||'').trim().toLowerCase();
const target=declaredTarget||(base.includes('-staging.')?'staging':'production');
const sourceSha=String(process.env.AREA_LEDGER_ACCEPTANCE_SHA||'').trim();
const workflowRun=String(process.env.AREA_LEDGER_ACCEPTANCE_RUN||'').trim();
const key=crypto.randomBytes(32).toString('base64url');
const common={'X-AREA-Gateway-Version':'1','X-AREA-Ledger-Key':key,'Content-Type':'application/json'};
async function req(path,opt={}){
  const r=await fetch(base+path,{...opt,headers:{...common,...(opt.headers||{})}});
  let data=null; const ct=r.headers.get('content-type')||'';
  if(ct.includes('application/json')) data=await r.json(); else data=await r.arrayBuffer();
  if(!r.ok){const e=new Error(path+' HTTP '+r.status+' '+JSON.stringify(data));e.status=r.status;e.data=data;throw e;}
  return {r,data};
}
const evidence={base,target,sourceSha:sourceSha||null,workflowRun:workflowRun||null,at:new Date().toISOString(),checks:{}};
try{
  assert(['staging','production'].includes(target),'acceptance target must be staging or production');
  if(declaredTarget==='staging')assert.equal(base,'https://area-ledger-ai-gateway-staging.areamaibab.workers.dev');
  if(declaredTarget==='production')assert.equal(base,'https://area-ledger-ai-gateway.areamaibab.workers.dev');
  if(sourceSha)assert.match(sourceSha,/^[0-9a-f]{40}$/i);
  if(workflowRun)assert.match(workflowRun,/^[0-9]+$/);
  evidence.checks.provenance=true;
  const health=await req('/health',{method:'GET'}); assert.equal(health.data.productionReady,true);evidence.checks.health=true;
  const ready=await req('/ready',{method:'GET'}); assert.equal(ready.data.ok,true);evidence.checks.ready=true;
  const platform=await req('/v1/platform/status',{method:'GET'});assert.equal(platform.data.productionReady,true);evidence.checks.platform=true;
  const now=Date.now(),state1={projects:[{id:'acceptance-p1',name:'Live Acceptance'}],tx:[],boq:[],guarantees:[],materialApprovals:[],siteEvents:[],contractChanges:[],timeExtensions:[],accountingPeriods:[],bankReconciliations:[],auditLog:[],manualJournals:[],chartAccounts:[],quotes:[],bills:[],receipts:[],dataRevision:1,updatedAt:now,acceptanceMarker:'synthetic-no-user-data'};
  const put1=await req('/v1/ledger/state',{method:'PUT',body:JSON.stringify({state:state1,expectedRevision:0,expectedChecksum:''})});assert.equal(put1.data.ok,true);assert.match(put1.data.meta.checksum,/^[0-9a-f]{64}$/);evidence.checks.durableCreate=true;
  const rec1=await req('/v1/ledger/reconcile',{method:'POST',body:'{}'});assert.equal(rec1.data.matched,true);assert.equal(rec1.data.diff.mismatchCount,0);evidence.checks.d1Reconcile=true;
  const probe=await req('/v1/files/probe',{method:'POST',body:'{}'});assert.equal(probe.data.ok,true);evidence.checks.r2Probe=true;
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const up=await req('/v1/files/upload',{method:'POST',body:JSON.stringify({dataUrl:png,entityType:'acceptance',entityId:'live',name:'acceptance.png'})});assert.equal(up.data.ok,true);assert.equal(up.data.indexed,true);const objectKey=up.data.key;evidence.checks.r2UploadIndex=true;
  const list=await req('/v1/files/list',{method:'GET'});assert(list.data.files.some(x=>x.key===objectKey));evidence.checks.r2List=true;
  const obj=await req('/v1/files/object?key='+encodeURIComponent(objectKey),{method:'GET',headers:{'Content-Type':undefined}});assert(obj.data.byteLength>0);evidence.checks.r2Read=true;
  await req('/v1/files/delete',{method:'POST',body:JSON.stringify({key:objectKey})});const list2=await req('/v1/files/list',{method:'GET'});assert(!list2.data.files.some(x=>x.key===objectKey));evidence.checks.r2DeleteIndex=true;
  const state2={...state1,tx:[{id:'acceptance-t1',pid:'acceptance-p1',type:'out',amount:1,date:'2026-10-01'}],dataRevision:2,updatedAt:now+1};
  const put2=await req('/v1/ledger/state',{method:'PUT',body:JSON.stringify({state:state2,expectedRevision:1,expectedChecksum:put1.data.meta.checksum})});assert.equal(put2.data.ok,true);evidence.checks.casUpdate=true;
  const hist=await req('/v1/ledger/history',{method:'GET'});assert.equal(hist.data.current.revision,2);assert.equal(hist.data.previous.revision,1);evidence.checks.history=true;
  const restore=await req('/v1/ledger/restore-previous',{method:'POST',body:'{}'});assert.equal(restore.data.ok,true);evidence.checks.restorePrevious=true;
  const rec2=await req('/v1/ledger/reconcile',{method:'POST',body:'{}'});assert.equal(rec2.data.matched,true);assert.equal(rec2.data.diff.mismatchCount,0);evidence.checks.postRestoreReconcile=true;
  evidence.ok=true;
} catch(e){
  evidence.ok=false;evidence.error=String(e&&e.message||e);console.error(evidence);fs.writeFileSync('live-acceptance.json',JSON.stringify(evidence,null,2));process.exit(1);
}
fs.writeFileSync('live-acceptance.json',JSON.stringify(evidence,null,2));
console.log('PASS live Cloudflare acceptance',JSON.stringify(evidence.checks));
