/* Transactional storage candidate. Not activated in the app until all save paths use async commits. */
(function(root){
'use strict';
const PREFIX='primary-v2:', DB='site-ledger-primary-v2';
function error(code){const e=new Error(code);e.code=code;return e;}
function valid(state){if(!state||!Array.isArray(state.projects)||!Array.isArray(state.tx))throw error('INVALID_STATE');}
function current(options){if(options.signal&&options.signal.aborted)throw error('CANCELLED');if(options.isCurrent&&!options.isCurrent())throw error('SOURCE_CHANGED');}
function progress(options,phase,done,total){try{if(options.onProgress)options.onProgress({phase,done,total});}catch(_){/* UI callbacks cannot turn a durable commit into a reported failure. */}}
async function hash(value){const bytes=new TextEncoder().encode(value),digest=await root.crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
function atPath(object,path,value){let target=object;for(let i=0;i<path.length-1;i++){if(!Object.prototype.hasOwnProperty.call(target,path[i]))throw error('INVALID_MEDIA_PATH');target=target[path[i]];}const last=path[path.length-1];if(!Object.prototype.hasOwnProperty.call(target,last))throw error('INVALID_MEDIA_PATH');Object.defineProperty(target,last,{value,writable:true,enumerable:true,configurable:true});}
function split(state){const copy=JSON.parse(JSON.stringify(state)),images=[];
 function walk(value,path){if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){const x=value[key],p=path.concat(key);if(typeof x==='string'&&/^data:image\/[a-z0-9.+-]+;base64,/i.test(x)){images.push({path:p,value:x});value[key]='';}else if(x&&typeof x==='object')walk(x,p);}}
 walk(copy,[]);return {copy,images};
}
function indexedDriver(name){
 function open(){return new Promise((resolve,reject)=>{let settled=false;const timer=setTimeout(()=>{settled=true;reject(error('OPEN_TIMEOUT'));},5000);const req=root.indexedDB.open(name||DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('kv'))req.result.createObjectStore('kv');};req.onsuccess=()=>{clearTimeout(timer);if(settled){req.result.close();return;}settled=true;req.result.onversionchange=()=>req.result.close();resolve(req.result);};function fail(){clearTimeout(timer);if(!settled){settled=true;reject(req.error||error('OPEN_BLOCKED'));}}req.onerror=fail;req.onblocked=fail;});}
 async function run(mode,body){const db=await open();return new Promise((resolve,reject)=>{let result,failure,finished=false;const tx=db.transaction('kv',mode),store=tx.objectStore('kv');const timer=setTimeout(()=>{failure=error('TRANSACTION_TIMEOUT');try{tx.abort();}catch(_){}},15000);function end(ok){if(finished)return;finished=true;clearTimeout(timer);db.close();ok?resolve(result):reject(failure||tx.error||error('TRANSACTION_FAILED'));}tx.oncomplete=()=>end(true);tx.onabort=()=>end(false);tx.onerror=()=>{failure=tx.error;};try{body(store,v=>{result=v;},e=>{failure=e;tx.abort();});}catch(e){failure=e;tx.abort();}});}
 return {get:key=>run('readonly',(s,done)=>{const r=s.get(key);r.onsuccess=()=>done(r.result);}),put:(key,value)=>run('readwrite',(s,done)=>{s.put(value,key);done(true);}),
  activate:(id,expected,guard)=>run('readwrite',(s,done,abort)=>{const r=s.get(PREFIX+'head');r.onsuccess=()=>{const head=r.result||null;if((head&&head.id||null)!==expected){abort(error('CONFLICT'));return;}const snapshot=s.get(PREFIX+'snapshot:'+id);snapshot.onsuccess=()=>{try{if(!snapshot.result||snapshot.result.id!==id)throw error('STAGE_MISSING');if(guard&&!guard())throw error('SOURCE_CHANGED');const next={id,previous:head&&head.id||null,revision:(head&&head.revision||0)+1,checksum:snapshot.result.checksum};s.put(next,PREFIX+'head');done(next);}catch(e){abort(e);}};};})};
}
function create(options){options=options||{};const driver=options.driver||indexedDriver(options.name);let busy=false;
 async function readSnapshot(id){const snapshot=await driver.get(PREFIX+'snapshot:'+id);if(!snapshot||snapshot.id!==id||!Array.isArray(snapshot.media))throw error('SNAPSHOT_MISSING');const state=JSON.parse(snapshot.json);valid(state);const cache=new Map();for(const item of snapshot.media){let value=cache.get(item.key);if(value===undefined){value=await driver.get(PREFIX+'media:'+item.key);if(typeof value!=='string'||await hash(value)!==item.key)throw error('MEDIA_CORRUPT');cache.set(item.key,value);}atPath(state,item.path,value);}if(await hash(JSON.stringify(state))!==snapshot.checksum)throw error('STATE_CORRUPT');return {snapshot,state};}
 async function load(){const head=await driver.get(PREFIX+'head');if(!head)return null;const loaded=await readSnapshot(head.id);if(loaded.snapshot.checksum!==head.checksum)throw error('HEAD_CORRUPT');return {state:loaded.state,head};}
 async function stage(state,opts){opts=opts||{};current(opts);valid(state);const raw=JSON.stringify(state),checksum=await hash(raw),parts=split(JSON.parse(raw)),media=[],written=new Set();current(opts);progress(opts,'images',0,parts.images.length);
 for(let i=0;i<parts.images.length;i++){current(opts);const item=parts.images[i],key=await hash(item.value);if(!written.has(key)){const existing=await driver.get(PREFIX+'media:'+key);if(existing!==item.value){await driver.put(PREFIX+'media:'+key,item.value);if(await driver.get(PREFIX+'media:'+key)!==item.value)throw error('MEDIA_WRITE_FAILED');}written.add(key);}media.push({path:item.path,key});progress(opts,'images',i+1,parts.images.length);}
 current(opts);const id=root.crypto.randomUUID(),snapshot={id,checksum,json:JSON.stringify(parts.copy),media,createdAt:Date.now(),counts:{projects:state.projects.length,tx:state.tx.length,boq:Array.isArray(state.boq)?state.boq.length:0}};await driver.put(PREFIX+'snapshot:'+id,snapshot);progress(opts,'verify',0,1);const checked=await readSnapshot(id);if(JSON.stringify(checked.state)!==raw)throw error('VERIFY_FAILED');current(opts);progress(opts,'verify',1,1);return {id,checksum,counts:snapshot.counts};
 }
 async function commit(staged,expected,opts){opts=opts||{};current(opts);const verified=await readSnapshot(staged.id);if(verified.snapshot.checksum!==staged.checksum)throw error('STAGE_CHANGED');current(opts);progress(opts,'commit',0,1);const head=await driver.activate(staged.id,expected==null?null:expected,()=>{current(opts);return true;});progress(opts,'commit',1,1);return {head,state:verified.state};}
 async function save(state,expected,opts){if(busy)throw error('BUSY');busy=true;try{return await commit(await stage(state,opts),expected,opts);}finally{busy=false;}}
 async function exportState(){const result=await load();if(!result)throw error('EMPTY');return result.state;}
 return {load,stage,commit,save,exportState,readSnapshot,isBusy:()=>busy};
}
const api={create,indexedDriver,hash,split};if(typeof module==='object'&&module.exports)module.exports=api;else root.AreaLedgerPrimaryStore=api;
})(typeof globalThis!=='undefined'?globalThis:this);

