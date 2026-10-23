import assert from 'node:assert/strict';
import {waitForExactAppBuild} from './wait-exact-app-build.mjs';
const sha='a'.repeat(40),old='b'.repeat(40);
let checks=0;
const mockBuild=(build)=>({ok:true,status:200,async text(){return '<html>\nvar APP_BUILD='+JSON.stringify(build)+';\n</html>';}});
async function test(label,fn){await fn();checks++;console.log('PASS',label);}
await test('stale build then exact staged SHA succeeds on second attempt',async()=>{
  let calls=0,waits=0;
  const result=await waitForExactAppBuild({origin:'https://example.test',sha,environment:'staging',attempts:3,delayMs:0,sleeper:async()=>{waits++},fetcher:async url=>{
    assert(new URL(url).searchParams.has('edge-probe'));return mockBuild({sha:++calls===1?old:sha,environment:'staging'});
  }});
  assert.equal(result.attempt,2);assert.equal(calls,2);assert.equal(waits,1);
});
await test('permanent stale SHA fails closed',async()=>{
  await assert.rejects(waitForExactAppBuild({origin:'https://example.test',sha,environment:'staging',attempts:2,delayMs:0,sleeper:async()=>{},fetcher:async()=>mockBuild({sha:old,environment:'staging'})}),/Exact app build never appeared/);
});
await test('correct SHA on wrong environment fails closed',async()=>{
  await assert.rejects(waitForExactAppBuild({origin:'https://example.test',sha,environment:'staging',attempts:1,fetcher:async()=>mockBuild({sha,environment:'production'})}),/never appeared/);
});
await test('missing build marker is not a pass',async()=>{
  await assert.rejects(waitForExactAppBuild({origin:'https://example.test',sha,environment:'staging',attempts:1,fetcher:async()=>({ok:true,text:async()=>'<html></html>'})}),/missing build marker/);
});
await test('HTTP error eventually recovers, otherwise fails',async()=>{
  let n=0;
  const result=await waitForExactAppBuild({origin:'https://example.test',sha,environment:'staging',attempts:3,delayMs:0,sleeper:async()=>{},fetcher:async()=>++n===1?{ok:false,status:503}:mockBuild({sha,environment:'staging'})});
  assert.equal(result.attempt,2);
});
await test('invalid SHA, environment and excessive attempts rejected',async()=>{
  await assert.rejects(waitForExactAppBuild({origin:'https://example.test',sha:'bad',environment:'staging'}),/Invalid exact-build SHA/);
  await assert.rejects(waitForExactAppBuild({origin:'https://example.test',sha,environment:'bad'}),/Invalid exact-build environment/);
  await assert.rejects(waitForExactAppBuild({origin:'https://example.test',sha,environment:'staging',attempts:100}),/Invalid exact-build attempts/);
});
console.log(checks+' propagation tests passed');
