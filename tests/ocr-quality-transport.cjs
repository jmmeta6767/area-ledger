const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const {requestOcrFixture}=await import('./ocr-quality-request.mjs');let calls=0,pauses=[];
 const options={base:'https://synthetic.test',kind:'boq',mime:'image/jpeg',imageBase64:'AA',id:'boq',pause:async n=>pauses.push(n),makeRequestId:()=>String(calls+1)};
 const result=await requestOcrFixture({...options,fetchImpl:async(url,req)=>{assert(url.endsWith('/boq'));assert(JSON.parse(req.body).image.startsWith('data:image/jpeg;'));calls++;return new Response(JSON.stringify(calls<3?{error:'PROVIDER_HTTP_503'}:{rows:[]}),{status:calls<3?502:200,headers:{'X-AREA-Gateway-Version':'1','X-AREA-Request-ID':req.headers['X-AREA-Request-ID']}});}});assert.equal(result.attempts,3);assert.deepEqual(pauses,[2500,5000]);
 for(const [status,error] of [[400,'INVALID_IMAGE'],[502,'PROVIDER_AUTH_FAILED'],[502,'PROVIDER_INVALID_RESPONSE']]){calls=0;await assert.rejects(requestOcrFixture({...options,fetchImpl:async()=>{calls++;return new Response(JSON.stringify({error}),{status});}}));assert.equal(calls,1);}
 calls=0;await assert.rejects(requestOcrFixture({...options,fetchImpl:async()=>{calls++;return new Response(JSON.stringify({error:'PROVIDER_HTTP_503'}),{status:502});}}),/attempts=/);assert.equal(calls,3);
 const source=fs.readFileSync('gateway/src/worker.js','utf8'),config=source.match(/^function providerConfig\(env\).*$/m)[0],run=source.match(/^async function providerFetch\(p,payload,rid\).*$/m)[0];
 const ctx={URL,AbortController,setTimeout,clearTimeout,Number,String,Math,Error,fetch:async()=>{calls++;return new Response('{}',{status:503});},providerRequest:()=>({url:'https://synthetic.test',headers:{},body:'{}'}),providerError:async r=>Object.assign(Error('PROVIDER_HTTP_'+r.status),{providerStatus:r.status}),retryableStatus:s=>s===408||s===429||s>=500};vm.createContext(ctx);vm.runInContext(config+'\n'+run,ctx);
 assert.equal(ctx.providerConfig({OCR_PROVIDER:'gemini',PROVIDER_RETRIES:'0'}).retries,0);assert.equal(ctx.providerConfig({OCR_PROVIDER:'gemini',PROVIDER_RETRIES:'1'}).retries,1);
 calls=0;await assert.rejects(ctx.providerFetch({retries:0,timeout:5000},{},'test'));assert.equal(calls,1);
 calls=0;await assert.rejects(ctx.providerFetch({retries:1,timeout:5000},{},'test'));assert.equal(calls,2);
 console.log('PASS BOQ bounded transient retry, strict non-transient failure, exhaustion evidence and provider zero-retry setting');
})().catch(e=>{console.error(e);process.exitCode=1;});
