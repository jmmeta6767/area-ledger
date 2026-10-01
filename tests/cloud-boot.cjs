const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
let code=scripts.join('\n').replace(/\nboot\(\);/,'\n');
const storage=new Map(),listeners={};
const node=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){},appendChild(){},focus(){},innerHTML:''});
const c={console,Date,Math,JSON,Number,String,Array,Object,Promise,Set,Map,RegExp,URL,parseFloat,isFinite,isNaN,TextEncoder,TextDecoder,Uint8Array,crypto:require('node:crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},navigator:{},location:{protocol:'https:',origin:'https://ledger.test',hostname:'ledger.test',href:'https://ledger.test/'},history:{pushState(){},replaceState(){}},window:{addEventListener(k,f){(listeners[k]??=[]).push(f)},scrollTo(){},visualViewport:null},document:{addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},documentElement:node(),body:node(),createElement:node},localStorage:{getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,String(v))},removeItem(k){storage.delete(k)}},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}}};
vm.createContext(c);vm.runInContext(code,c);c.render=()=>{};c.toast=()=>{};
storage.set(c.CLOUD_KEY_NAME,'A'.repeat(43));storage.set(c.CLOUD_ENABLED_NAME,'1');

function state(rev,brand){const x=c.emptyState();x.dataRevision=rev;x.updatedAt=rev*100;x.brand=brand||'AREA';return JSON.parse(JSON.stringify(x));}
function reply(remote){return {ok:true,status:200,data:{hit:!!remote,state:remote||null,meta:remote?{revision:remote.dataRevision,checksum:'a'.repeat(64),updatedAt:remote.updatedAt,savedAt:'2026-10-01T00:00:00.000Z'}:null}};}

(async()=>{
  assert.equal(typeof c.cloudBootResolve,'function');
  let local=state(1,'LOCAL'),remote=state(2,'CLOUD');
  c.cloudGateway=async()=>reply(remote);c.U.cloudConflict=false;
  let r=await c.cloudBootResolve(local);assert.equal(r.fromCloud,true);assert.equal(r.state.brand,'CLOUD');assert.equal(r.reason,'cloud-newer');

  local=state(3,'LOCAL');remote=state(2,'CLOUD');c.cloudGateway=async()=>reply(remote);c.U.cloudConflict=false;
  r=await c.cloudBootResolve(local);assert.equal(r.fromCloud,false);assert.equal(r.pushLocal,true);assert.equal(r.reason,'local-newer');

  local=state(2,'LOCAL');remote=state(2,'CLOUD');c.cloudGateway=async()=>reply(remote);c.U.cloudConflict=false;
  r=await c.cloudBootResolve(local);assert.equal(r.fromCloud,false);assert.equal(r.pushLocal,false);assert.equal(r.reason,'same-revision-diverged');assert.equal(c.U.cloudConflict,true);

  local=state(2,'SAME');remote=JSON.parse(JSON.stringify(local));c.cloudGateway=async()=>reply(remote);c.U.cloudConflict=false;
  r=await c.cloudBootResolve(local);assert.equal(r.reason,'equal');assert.equal(c.U.cloudConflict,false);

  c.cloudGateway=async()=>reply(null);c.U.cloudConflict=false;
  r=await c.cloudBootResolve(local);assert.equal(r.reason,'cloud-empty');assert.equal(r.pushLocal,true);

  c.cloudGateway=async()=>({ok:false,status:0,data:{error:'LEDGER_NETWORK'}});c.U.cloudConflict=false;
  r=await c.cloudBootResolve(local);assert.equal(r.reason,'unreachable');assert.equal(r.state.brand,'SAME');

  assert(code.includes("window.addEventListener('online'"));
  assert(code.includes("navigator.serviceWorker.register('sw.js?v=493'"));
  console.log('PASS cloud-first boot resolver');
})().catch(e=>{console.error(e);process.exit(1)});
