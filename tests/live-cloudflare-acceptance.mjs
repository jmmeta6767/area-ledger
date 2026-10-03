import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const base=(process.env.AREA_LEDGER_LIVE_BASE||'https://area-ledger-ai-gateway-staging.areamaibab.workers.dev').replace(/\/$/,'');
const declaredTarget=String(process.env.AREA_LEDGER_ACCEPTANCE_TARGET||'').trim().toLowerCase();
const target=declaredTarget||(base.includes('-staging.')?'staging':'production');
const sourceSha=String(process.env.AREA_LEDGER_ACCEPTANCE_SHA||'').trim();
const workflowRun=String(process.env.AREA_LEDGER_ACCEPTANCE_RUN||'').trim();
const appBase=(process.env.AREA_LEDGER_APP_BASE||'https://g.areamaibab.workers.dev').replace(/\/$/,'');
const key=crypto.randomBytes(32).toString('base64url');
const common={'X-AREA-Gateway-Version':'1','X-AREA-Ledger-Key':key,'Content-Type':'application/json'};
async function req(path,opt={}){
  const r=await fetch(base+path,{...opt,headers:{...common,...(opt.headers||{})}});
  let data=null; const ct=r.headers.get('content-type')||'';
  if(ct.includes('application/json')) data=await r.json(); else data=await r.arrayBuffer();
  if(!r.ok){const e=new Error(path+' HTTP '+r.status+' '+JSON.stringify(data));e.status=r.status;e.data=data;throw e;}
  return {r,data};
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitForGateway(){
  let last=null;
  for(let attempt=1;attempt<=5;attempt++){
    try{return {health:await req('/health',{method:'GET'}),attempt};}
    catch(e){
      last=e;
      const retryable=!e?.status||[429,500,502,503,504].includes(e.status);
      if(!retryable||attempt===5)throw e;
      await sleep(1000*attempt);
    }
  }
  throw last||new Error('gateway readiness failed');
}
const evidence={base,target,sourceSha:sourceSha||null,workflowRun:workflowRun||null,at:new Date().toISOString(),checks:{}};
try{
  assert(['staging','production'].includes(target),'acceptance target must be staging or production');
  if(declaredTarget==='staging')assert.equal(base,'https://area-ledger-ai-gateway-staging.areamaibab.workers.dev');
  if(declaredTarget==='production')assert.equal(base,'https://area-ledger-ai-gateway.areamaibab.workers.dev');
  if(sourceSha)assert.match(sourceSha,/^[0-9a-f]{40}$/i);
  if(workflowRun)assert.match(workflowRun,/^[0-9]+$/);
  evidence.checks.provenance=true;
  const warmup=await waitForGateway(); const health=warmup.health; assert.equal(health.data.productionReady,true);evidence.checks.health=true;evidence.checks.healthAttempts=warmup.attempt;
  const ready=await req('/ready',{method:'GET'}); assert.equal(ready.data.ok,true);evidence.checks.ready=true;
  if(target==='production'){
    const browserReady=await fetch(base+'/ready',{method:'GET',headers:{Origin:appBase},cache:'no-store'});
    assert.equal(browserReady.ok,true);assert.equal(browserReady.headers.get('access-control-allow-origin'),appBase);
    const browserData=await browserReady.json();assert.equal(browserData.ok,true);evidence.checks.browserOriginReady=true;
    const legacyHealth=await fetch(appBase+'/legacy-health',{method:'GET',cache:'no-store'});assert.equal(legacyHealth.ok,true);
    const legacyData=await legacyHealth.json();assert.equal(legacyData.service,'area-ledger-legacy-app');assert.equal(legacyData.canonicalGateway,base);evidence.checks.legacyAppHealth=true;
    const legacyReady=await fetch(appBase+'/ready',{method:'GET',cache:'no-store'});assert.equal(legacyReady.ok,true);const legacyReadyData=await legacyReady.json();assert.equal(legacyReadyData.ok,true);evidence.checks.legacyGatewayProxy=true;
    const app=await fetch(appBase+'/?contract=v1005',{method:'GET',cache:'no-store'});assert.equal(app.ok,true);const html=await app.text();
    assert(html.includes('area-ledger-client-contract'));assert(html.includes('v1005-canonical-gateway'));assert(html.includes('https://area-ledger-ai-gateway.areamaibab.workers.dev'));evidence.checks.legacyAppCurrent=true;
    const canaryRid='acceptance-vision-'+crypto.randomBytes(8).toString('hex');
    const canaryRes=await fetch(base+'/v1/ocr/expense',{method:'POST',headers:{Origin:appBase,'Content-Type':'application/json','X-AREA-Gateway-Version':'1','X-AREA-Request-ID':canaryRid},body:JSON.stringify({image:'data:image/png;base64,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',lang:'tha+eng'})});
    assert.equal(canaryRes.ok,true);assert.equal(canaryRes.headers.get('x-area-gateway-version'),'1');assert.equal(canaryRes.headers.get('x-area-request-id'),canaryRid);
    const canaryData=await canaryRes.json();assert(canaryData.amount===1300||/1300/.test(String(canaryData.text||'')));evidence.checks.visionIntegerTotal=true;
  }
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
