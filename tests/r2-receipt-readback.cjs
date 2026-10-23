'use strict';
/* Real production app handlers, entirely synthetic media and browser state. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n').replace(/\nboot\(\);/,'\n');
const elements={},events={},storage=new Map(),localEvidence=new Map(),messages=[];
const node=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){},appendChild(){},focus(){},innerHTML:''});
const pixel=Buffer.from('synthetic receipt payload, not a customer receipt!');
const png='data:image/png;base64,'+pixel.toString('base64');
const ctx={console,Date,Math,JSON,Number,String,Array,Object,Promise,Set,Map,RegExp,URL,Uint8Array,ArrayBuffer,
  parseFloat,isFinite,isNaN,setTimeout:()=>0,clearTimeout(){},atob:s=>Buffer.from(s,'base64').toString('binary'),
  navigator:{},location:{protocol:'https:',origin:'https://ledger.test',hostname:'ledger.test',reload(){}},
  history:{pushState(){},replaceState(){}},
  window:{addEventListener(){},scrollTo(){}},
  document:{addEventListener(k,f){(events[k]??=[]).push(f)},getElementById(id){return elements[id]||null},querySelector(){return null},querySelectorAll(){return []},documentElement:node(),body:node(),createElement:node},
  localStorage:{getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}},
  sessionStorage:{getItem(){return null},setItem(){},removeItem(){}}
};
vm.createContext(ctx);vm.runInContext(code,ctx);
ctx.render=()=>{};ctx.toast=t=>messages.push(String(t));
ctx.cloudPhotoThumb=async()=>'';ctx.expensePhotoFingerprint=()=> 'synthetic-photo-fp';
ctx.gatewayApiUrl=p=>'https://ledger.test'+p;
ctx.cloudHeaders=()=>({'Content-Type':'application/json','X-AREA-Ledger-Key':'synthetic-key'});
ctx.idbSet=async()=>true;
let enabled,ledgerKey,uploadCalls,objectBytes,fetchStatus,putWorks,readWorks,saveBlock;
function init(){
  storage.clear();localEvidence.clear();messages.length=0;
  enabled=true;ledgerKey='synthetic-ledger';uploadCalls=0;objectBytes=Buffer.from(pixel);fetchStatus=200;putWorks=true;readWorks=true;saveBlock=false;
  ctx.S=ctx.emptyState();
  ctx.S.projects=[{id:'project',name:'Synthetic project'}];
  ctx.S.tx=[{id:'synthetic-1',pid:'project',type:'out',date:'2026-10-23',amount:500,photo:png,photoRef:''}];
  ctx.U.receiptOffloadBusy=false;ctx.U.storageReadBlocked=false;ctx.U.storageWriteError='';ctx.U.storageConflict=false;
  ctx.cloudSyncEnabled=()=>enabled;ctx.cloudLedgerKey=()=>ledgerKey;
  ctx.cloudFileStatus=async()=>({ok:true,data:{configured:true}});
  ctx.cloudFileUpload=async()=>{uploadCalls++;return {ok:true,data:{key:'r2/synthetic',mime:'image/png'}}};
  ctx.idbPut=async(k,v)=>{if(!putWorks)return false;localEvidence.set(k,v);return true;};
  ctx.idbRead=async k=>readWorks?localEvidence.get(k):null;
  ctx.fetch=async()=>({ok:fetchStatus===200,status:fetchStatus,arrayBuffer:async()=>Uint8Array.from(objectBytes).buffer});
  ctx.mirrorQueue=Promise.resolve();
  const stored=JSON.stringify(ctx.S);storage.set(ctx.KEY,stored);ctx.committedState=stored;
  ctx.localStorage.setItem=(k,v)=>{if(saveBlock&&k===ctx.KEY){const e=Error('quota');e.name='QuotaExceededError';throw e;}storage.set(k,v);};
}
let passed=0;
async function test(label,fn){init();await fn();passed++;console.log('PASS',label);}
(async()=>{
await test('cloud disabled cannot offload',async()=>{
 enabled=false;
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(uploadCalls,0);assert.equal(ctx.S.tx[0].photo,png);
});
await test('IDB write failure retains embedded original',async()=>{
 putWorks=false;
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(uploadCalls,0);assert.equal(ctx.S.tx[0].photo,png);
});
await test('IDB readback mismatch does not upload',async()=>{
 readWorks=false;
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(uploadCalls,0);assert.equal(ctx.S.tx[0].photo,png);
});
await test('R2 upload failure retains image and IDB recovery copy',async()=>{
 ctx.cloudFileUpload=async()=>{uploadCalls++;return {ok:false}};
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(ctx.S.tx[0].photo,png);assert.equal(localEvidence.get('receipt-original-v1:synthetic-1'),png);
});
await test('R2 byte mismatch cannot remove local receipt',async()=>{
 objectBytes=Buffer.from('different synthetic bytes');
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(ctx.S.tx[0].photo,png);assert.equal(storage.get(ctx.KEY),ctx.committedState);
});
await test('R2 request failure cannot clear evidence',async()=>{
 fetchStatus=404;
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(ctx.S.tx[0].photo,png);
});
await test('verified R2 bytes and IDB copy permit one persisted reference',async()=>{
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),true);
 assert.equal(ctx.S.tx[0].photo,'');assert.equal(ctx.S.tx[0].photoRef,'r2/synthetic');
 assert.equal(ctx.S.tx[0].amount,500);
 assert.equal(localEvidence.get('receipt-original-v1:synthetic-1'),png);
 assert.equal(JSON.parse(storage.get(ctx.KEY)).tx[0].photoRef,'r2/synthetic');
});
await test('cloud ledger identity change blocks commit',async()=>{
 ctx.cloudFileUpload=async()=>{ledgerKey='another-ledger';return {ok:true,data:{key:'r2/synthetic'}}};
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(ctx.S.tx[0].photo,png);
});
await test('changed local state during upload blocks commit',async()=>{
 ctx.cloudFileUpload=async()=>{ctx.S.tx[0].amount=501;return {ok:true,data:{key:'r2/synthetic'}}};
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(ctx.S.tx[0].photo,png);
});
await test('concurrent tab localStorage update blocks stale offload',async()=>{
 ctx.cloudFileUpload=async()=>{storage.set(ctx.KEY,JSON.stringify({...ctx.S,updatedAt:Date.now()+30000}));return {ok:true,data:{key:'r2/synthetic'}}};
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(ctx.S.tx[0].photo,png);
});
await test('persist quota failure restores original data and keeps IDB copy',async()=>{
 saveBlock=true;
 assert.equal(await ctx.cloudOffloadOneTxPhoto('synthetic-1',true),false);
 assert.equal(ctx.S.tx[0].photo,png);
 assert.equal(localEvidence.get('receipt-original-v1:synthetic-1'),png);
});
await test('double migration command cannot run concurrently',async()=>{
 let unblock,entered;const pending=new Promise(r=>unblock=r),seen=new Promise(r=>entered=r);
 ctx.cloudFileUpload=async()=>{uploadCalls++;entered();await pending;return {ok:true,data:{key:'r2/synthetic'}}};
 const running=ctx.cloudOffloadAllTxPhotos();await seen;
 const duplicate=await ctx.cloudOffloadAllTxPhotos();assert.equal(duplicate.error,'IN_PROGRESS');
 unblock();const done=await running;
 assert.equal(done.moved,1);assert.equal(uploadCalls,1);
});
console.log(passed+' receipt offload integrity tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
