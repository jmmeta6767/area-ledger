const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const code=html.slice(html.indexOf('async function cloudSyncPull(apply)'),html.indexOf('async function cloudSyncEnableCurrent'));
async function check(mode){
 const original={projects:[],tx:[{amount:500}]},remote={projects:[],tx:[{amount:650}]};
 let raw=JSON.stringify(original),key='test-key',writes=0;
 const c={S:original,U:{},KEY:'primary',JSON,cloudLedgerKey:()=>key,
  localStorage:{getItem:()=>{if(mode==='read-blocked')throw Error('blocked');return raw;}},
  workspaceRefreshStatus:()=>{},migrate:x=>x,stateHealth:()=>({ok:true}),
  mirrorQueue:mode==='mirror-rejected'?Promise.reject(Error('mirror failed')):Promise.resolve(),
  storageCompactRecovery:async()=>false,
  cloudGateway:async()=>{if(mode==='network')throw Error('offline');if(mode==='draft-change')c.S.tx.push({amount:20});if(mode==='tab-change')raw='other-tab';if(mode==='key-change')key='other-key';return {ok:true,data:{hit:true,state:remote,meta:{}}};},
  cloudCacheExact:next=>{writes++;c.S=next;return true;}};
 if(mode==='mirror-rejected')c.mirrorQueue.catch(()=>{});
 vm.createContext(c);vm.runInContext(code,c);
 const result=await c.cloudSyncPull(true);
 const success=['success','mirror-rejected'].includes(mode);
 assert.equal(result.ok,success,mode);
 assert.equal(writes,success?1:0,mode+' must not overwrite on failure');
 assert.equal(c.U.cloudSyncBusy,false,mode+' must release busy flag');
 if(mode.endsWith('-change'))assert.equal(result.error,'CONFLICT');
 if(mode==='read-blocked')assert.equal(result.error,'CACHE');
 if(mode==='network')assert.equal(result.error,'NETWORK');
 if(!success)assert.equal(c.S.tx[0].amount,500);
 console.log('PASS cloud pull recovery',mode);
}
(async()=>{for(const mode of ['success','mirror-rejected','draft-change','tab-change','key-change','read-blocked','network'])await check(mode);})().catch(e=>{console.error(e);process.exitCode=1;});

