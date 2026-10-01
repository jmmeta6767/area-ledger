const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker=');
const ctx={URL,Request,Response,Headers,AbortController,TextEncoder,TextDecoder,setTimeout,clearTimeout,Date,Map,JSON,Math,Number,String,Error,Promise,Array,Object,Uint8Array,console,crypto:require('node:crypto').webcrypto,fetch,atob:s=>Buffer.from(s,'base64').toString('binary')};
vm.createContext(ctx);vm.runInContext(src+';globalThis.GatewayState=GatewayState;',ctx);

assert.equal(typeof ctx.r2Ready,'function');
assert.equal(typeof ctx.r2Upload,'function');
assert.equal(typeof ctx.r2Get,'function');
assert.equal(typeof ctx.r2Delete,'function');
const sql=fs.readFileSync('gateway/migrations/0002_ledger_files.sql','utf8');
assert(sql.includes('CREATE TABLE IF NOT EXISTS ledger_files'));
assert(sql.includes('idx_ledger_files_entity'));

function fakeR2(){
  const store=new Map();
  return {
    store,
    async put(key,value,opt){const bytes=value instanceof Uint8Array?value:new Uint8Array(value);store.set(key,{bytes,opt});return {etag:'e1'};},
    async get(key){const x=store.get(key);if(!x)return null;return {body:x.bytes,size:x.bytes.byteLength,httpMetadata:x.opt&&x.opt.httpMetadata||{},customMetadata:x.opt&&x.opt.customMetadata||{},etag:'e1'};},
    async delete(key){store.delete(key);}
  };
}

(async()=>{
  const bucket=fakeR2(),env={LEDGER_FILES:bucket},hash='a'.repeat(64);
  assert.equal(ctx.r2Ready(env),true);
  const dataUrl='data:image/png;base64,'+Buffer.from('abc').toString('base64');
  const up=await ctx.r2Upload(env,hash,{dataUrl,entityType:'tx',entityId:'t1',name:'receipt.png'});
  assert.equal(up.ok,true);assert.equal(up.mime,'image/png');assert.equal(up.size,3);assert.match(up.key,/^[0-9a-f]{64}\/[0-9]{8}\/[0-9a-f]{32}$/);assert.equal(up.indexed,false);
  const got=await ctx.r2Get(env,hash,up.key);assert.equal(got.ok,true);assert.equal(got.size,3);
  const denied=await ctx.r2Get(env,'b'.repeat(64),up.key);assert.equal(denied.ok,false);assert.equal(denied.status,403);
  const del=await ctx.r2Delete(env,hash,up.key);assert.equal(del.ok,true);assert.equal(bucket.store.size,0);
  assert.throws(()=>ctx.parseFileDataUrl('data:image/svg+xml;base64,PHN2Zz4='));
  assert.throws(()=>ctx.parseFileDataUrl('data:image/png;base64,'));
  console.log('PASS R2 attachment vault contract');
})().catch(e=>{console.error(e);process.exit(1)});
