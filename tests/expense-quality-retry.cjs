'use strict';
// Synthetic-only contract: retry transient OCR transport, never waive accounting values.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function run(){
 const {requestExpenseFixture,verifyExpenseCase}=await import(pathToFileURL(path.join(__dirname,'expense-document-quality.mjs')).href);
 const base='https://area-ledger-ai-gateway-staging.areamaibab.workers.dev';
 const good={amount:1070,documentTotal:1070,partialDocument:false,rows:[],date:'2026-10-14',cat:'ค่าของ'};
 function response(status,data,rid){
  return {status,headers:{get:k=>k==='X-AREA-Request-ID'?rid:k==='X-AREA-Gateway-Version'?'1':null},json:async()=>data};
 }
 const options={base,id:'discount-vat',imageBase64:'c3ludGhldGlj',pause:async()=>{},maxAttempts:3};
 let count=0;
 const expected=['p1','p2','p3'];
 const ok=await requestExpenseFixture({...options,makeRequestId:()=>expected[count],fetchImpl:async(url,req)=>{
  assert.equal(url,base+'/v1/ocr/expense');const rid=req.headers['X-AREA-Request-ID'];const n=count++;
  assert.equal(rid,expected[n]);const payload=JSON.parse(req.body);assert.equal(payload.image,'data:image/png;base64,c3ludGhldGlj');
  if(n===0)return response(502,{error:'PROVIDER_HTTP_503'},rid);
  if(n===1)return response(429,{error:'RATE_LIMITED'},rid);
  return response(200,good,rid);
 }});
 assert.equal(count,3);assert.equal(ok.attempts,3);assert.equal(ok.requestId,'p3');
 assert.deepEqual(ok.history.map(x=>x.status),[502,429,200]);
 assert.equal(verifyExpenseCase(ok.data,{id:'discount-vat',amount:1070}),true);
 // Bad OCR values must fail normally, even after a successful HTTP response.
 assert.throws(()=>verifyExpenseCase({...good,amount:999},{id:'discount-vat',amount:1070}),/net after discount and VAT/);
 let nonTransient=0;
 await assert.rejects(requestExpenseFixture({...options,fetchImpl:async()=>{
  nonTransient++;return response(502,{error:'PROVIDER_HTTP_400'},'p');
 }}),/OCR HTTP 502/);assert.equal(nonTransient,1);
 let gatewayFail=0;
 await assert.rejects(requestExpenseFixture({...options,fetchImpl:async()=>{
  gatewayFail++;return response(500,{error:'GATEWAY_BUG'},'p');
 }}),/OCR HTTP 500/);assert.equal(gatewayFail,1);
 let exhausted=0;
 await assert.rejects(requestExpenseFixture({...options,fetchImpl:async()=>{
  exhausted++;return response(502,{error:'PROVIDER_HTTP_503'},'p');
 }}),/attempts=/);assert.equal(exhausted,3);
 let timeouts=0;
 const recovered=await requestExpenseFixture({...options,makeRequestId:()=>['timeout-1','timeout-2'][timeouts],fetchImpl:async(url,req)=>{
  timeouts++;
  if(timeouts===1)throw Object.assign(new Error('synthetic timeout'),{name:'TimeoutError'});
  return response(200,good,req.headers['X-AREA-Request-ID']);
 }});
 assert.equal(timeouts,2);assert.equal(recovered.attempts,2);
 assert.deepEqual(recovered.history.map(x=>x.error),['TRANSPORT_TIMEOUT',null]);
 let timeoutExhausted=0;
 await assert.rejects(requestExpenseFixture({...options,fetchImpl:async()=>{
  timeoutExhausted++;throw Object.assign(new Error('synthetic timeout'),{name:'TimeoutError'});
 }}),/OCR transport timeout; attempts=/);
 assert.equal(timeoutExhausted,3);
 let unexpected=0;
 await assert.rejects(requestExpenseFixture({...options,fetchImpl:async()=>{
  unexpected++;throw new TypeError('synthetic programming bug');
 }}),/synthetic programming bug/);
 assert.equal(unexpected,1);
 let mismatch=0;
 await assert.rejects(requestExpenseFixture({...options,fetchImpl:async()=>{
  mismatch++;return response(200,good,'bad-id');
 }}),/request identity/);assert.equal(mismatch,1);
 console.log('PASS bounded OCR acceptance retries: transient 503/429 and timeout, strict identity, fail closed on totals, non-transient and exhaustion');
}
run().catch(error=>{console.error(error);process.exitCode=1});
