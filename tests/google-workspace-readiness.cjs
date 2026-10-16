const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker=');
const ctx={URL,Request,Response,Headers,TextEncoder,TextDecoder,crypto:require('node:crypto').webcrypto,console};
vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
  const project={id:'test-project',name:'Test BOQ'},rows=Array.from({length:1500},(_,i)=>({id:String(i),qty:1,unitPrice:10}));
  assert.equal(ctx.googleCleanProject({project,rows}).rows.length,1500);
  assert.throws(()=>ctx.googleCleanProject({project,rows:[...rows,rows[0]]}),/GOOGLE_BOQ_ROW_LIMIT/);
  let networkCalls=0;ctx.fetch=async()=>{networkCalls++;throw Error('Unexpected Google request');};
  const request=new Request('https://example.test/v1/google/sync',{method:'POST',headers:{'Content-Type':'application/json','X-AREA-Gateway-Version':'1','X-AREA-Ledger-Key':'a'.repeat(32)},body:JSON.stringify({project,rows:[...rows,rows[0]]})});
  const env={GOOGLE_CLIENT_ID:'test',GOOGLE_CLIENT_SECRET:'test',GOOGLE_TOKEN_KEY:'k'.repeat(32),LEDGER_DB:{prepare(){throw Error('Unexpected database write');},batch(){}}};
  const response=await ctx.worker.fetch(request,env,{});
  assert.equal(response.status,400);assert.equal((await response.json()).error,'GOOGLE_BOQ_ROW_LIMIT');assert.equal(networkCalls,0);
  console.log('PASS Google BOQ limit: 1500 accepted; 1501 rejected before database/API writes; HTTP 400');
})().catch(e=>{console.error(e);process.exitCode=1;});
