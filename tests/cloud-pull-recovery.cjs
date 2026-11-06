const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const code=html.slice(html.indexOf('async function cloudSyncPull(apply)'),html.indexOf('async function cloudSyncEnableCurrent'));
const storageReader=html.match(/function storageCurrentRaw\(\)\{[^\n]+/)[0];
async function check(mode){
 const original={projects:[],tx:[{amount:500}]},remote={projects:[],tx:[{amount:650}]};
 let raw=JSON.stringify(original),key='test-key',writes=0,releaseWrite,enteredWrite;
 const writeEntered=new Promise(resolve=>enteredWrite=resolve);
 const writeGate=new Promise(resolve=>releaseWrite=resolve);
 const c={S:original,U:{},KEY:'primary',JSON,primaryActive:false,cloudLedgerKey:()=>key,
  localStorage:{getItem:()=>{if(mode==='read-blocked')throw Error('blocked');return raw;}},
  workspaceRefreshStatus:()=>{},migrate:x=>x,stateHealth:()=>({ok:true}),
  mirrorQueue:mode==='mirror-rejected'?Promise.reject(Error('mirror failed')):Promise.resolve(),
  storageCompactRecovery:async()=>false,
  cloudGateway:async()=>{if(mode==='network')throw Error('offline');if(mode==='draft-change')c.S.tx.push({amount:20});if(mode==='tab-change')raw='other-tab';if(mode==='key-change')key='other-key';return {ok:true,data:{hit:true,state:remote,meta:{}}};},
  cloudCacheExact:async next=>{if(mode.startsWith('deferred-')){enteredWrite();await writeGate;}if(['write-failed','deferred-failed'].includes(mode))return false;writes++;c.S=next;return true;}};
 if(mode==='mirror-rejected')c.mirrorQueue.catch(()=>{});
 vm.createContext(c);vm.runInContext(storageReader+'\n'+code,c);
 let settled=false;
 const pending=c.cloudSyncPull(true).then(result=>{settled=true;return result;});
 if(mode.startsWith('deferred-')){await writeEntered;await Promise.resolve();assert.equal(settled,false,'pull waits for durable write');assert.equal(c.U.cloudSyncBusy,true);assert.equal(writes,0);assert.equal(c.S.tx[0].amount,500);releaseWrite();}
 const result=await pending;
 const success=['success','mirror-rejected','deferred-success'].includes(mode);
 assert.equal(result.ok,success,mode);
 assert.equal(writes,success?1:0,mode+' must not overwrite on failure');
 assert.equal(c.U.cloudSyncBusy,false,mode+' must release busy flag');
 if(mode.endsWith('-change'))assert.equal(result.error,'CONFLICT');
 if(mode==='read-blocked')assert.equal(result.error,'CACHE');
 if(['write-failed','deferred-failed'].includes(mode))assert.equal(result.error,'CACHE');
 if(mode==='network')assert.equal(result.error,'NETWORK');
 if(!success)assert.equal(c.S.tx[0].amount,500);
 console.log('PASS cloud pull recovery',mode);
}
(async()=>{for(const mode of ['success','mirror-rejected','draft-change','tab-change','key-change','read-blocked','network','write-failed','deferred-success','deferred-failed'])await check(mode);})().catch(e=>{console.error(e);process.exitCode=1;});

