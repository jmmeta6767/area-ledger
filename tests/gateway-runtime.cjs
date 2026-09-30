const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
(async()=>{
 let src=fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker=');
 const ctx={URL,Request,Response,Headers,AbortController,setTimeout,clearTimeout,Date,Map,JSON,Math,Number,String,Error,Promise,console,crypto:require('node:crypto').webcrypto,fetch:async()=>new Response(JSON.stringify({text:'ร้าน A 123.45',amount:123.45,cat:'ค่าของ'}),{status:200,headers:{'Content-Type':'application/json'}})};
 vm.createContext(ctx);vm.runInContext(src+';globalThis.GatewayState=GatewayState;',ctx);
 const env={ALLOWED_ORIGINS:'https://ledger.test',RATE_LIMIT_PER_MINUTE:'20',OCR_PROVIDER:'generic',OCR_UPSTREAM_URL:'https://provider.test/ocr',OCR_API_KEY:'secret',PROVIDER_RETRIES:'0'};
 let res=await ctx.worker.fetch(new Request('https://gateway.test/health'),env);let body=await res.json();assert.equal(res.status,200);assert.equal(body.protocol,'1');assert.equal(body.providerConfigured,true);assert(!JSON.stringify(body).includes('secret'));
 res=await ctx.worker.fetch(new Request('https://gateway.test/v1/ocr/expense',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json','X-AREA-Gateway-Version':'1','X-AREA-Request-ID':'request-0001'},body:JSON.stringify({image:'data:image/jpeg;base64,AA'})}),env);assert.equal(res.status,403);
 const req=()=>new Request('https://gateway.test/v1/ocr/expense',{method:'POST',headers:{Origin:'https://ledger.test','Content-Type':'application/json','X-AREA-Gateway-Version':'1','X-AREA-Request-ID':'request-0002'},body:JSON.stringify({image:'data:image/jpeg;base64,AA'})});
 res=await ctx.worker.fetch(req(),env);body=await res.json();assert.equal(res.status,200);assert.equal(body.amount,123.45);assert.equal(res.headers.get('X-AREA-Request-ID'),'request-0002');
 res=await ctx.worker.fetch(req(),env);assert.equal(res.status,200);
 const mem=new Map(),storage={async get(k){return mem.get(k)},async put(k,v){mem.set(k,v)}},state=new ctx.GatewayState({storage});
 res=await state.fetch(new Request('https://internal/rate',{method:'POST',body:JSON.stringify({key:'ip',limit:1,windowMs:60000})}));assert.equal((await res.json()).allowed,true);
 res=await state.fetch(new Request('https://internal/rate',{method:'POST',body:JSON.stringify({key:'ip',limit:1,windowMs:60000})}));assert.equal((await res.json()).allowed,false);
 await state.fetch(new Request('https://internal/idem-set',{method:'POST',body:JSON.stringify({key:'x',windowMs:60000,value:{amount:9}})}));
 res=await state.fetch(new Request('https://internal/idem-get',{method:'POST',body:JSON.stringify({key:'x',windowMs:60000})}));body=await res.json();assert.equal(body.hit,true);assert.equal(body.value.amount,9);
 console.log('PASS gateway runtime');
})().catch(e=>{console.error(e);process.exitCode=1});
