const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

const src=fs.readFileSync('gateway/src/worker.js','utf8')
  .replace('export class GatewayState','class GatewayState')
  .replace('export default','globalThis.worker=');
const ctx={URL,Request,Response,Headers,AbortController,TextEncoder,TextDecoder,setTimeout,clearTimeout,Date,Map,JSON,Math,Number,String,Error,Promise,Array,Object,Uint8Array,console,crypto:require('node:crypto').webcrypto,fetch};
vm.createContext(ctx);vm.runInContext(src+';globalThis.GatewayState=GatewayState;',ctx);

assert.equal(typeof ctx.d1Ready,'function');
assert.equal(typeof ctx.d1MirrorLedger,'function');
assert.equal(typeof ctx.d1ReadLedger,'function');
assert.equal(typeof ctx.d1LedgerStatus,'function');

const sql=fs.readFileSync('gateway/migrations/0001_cloud_ledger.sql','utf8');
assert(sql.includes('CREATE TABLE IF NOT EXISTS ledger_meta'));
assert(sql.includes('CREATE TABLE IF NOT EXISTS ledger_entities'));
assert(sql.includes('FOREIGN KEY (ledger_hash)'));
assert(sql.includes('idx_ledger_entities_pid'));

let batched=[];
function fakeDb(){
  return {
    prepare(sql){
      return {
        sql,args:[],
        bind(...args){this.args=args;return this;},
        async first(){
          if(sql.includes('FROM ledger_meta'))return {revision:3,checksum:'c'.repeat(64),semanticChecksum:'d'.repeat(64),updatedAt:123,savedAt:'2026-10-01T00:00:00.000Z',entityCount:2,schemaVersion:1};
          return null;
        },
        async all(){return {results:[]};}
      };
    },
    async batch(stmts){batched=stmts;return stmts.map(()=>({success:true}));}
  };
}

(async()=>{
  const state={projects:[{id:'p1',name:'A'}],tx:[{id:'t1',pid:'p1',type:'out',amount:100}],boq:[],guarantees:[],materialApprovals:[],siteEvents:[],contractChanges:[],timeExtensions:[],accountingPeriods:[],bankReconciliations:[],auditLog:[],manualJournals:[],chartAccounts:[],quotes:[],bills:[],receipts:[],dataRevision:3,updatedAt:123,brand:'AREA'};
  const env={LEDGER_DB:fakeDb()};
  assert.equal(ctx.d1Ready(env),true);
  const mirrored=await ctx.d1MirrorLedger(env,'a'.repeat(64),state,{revision:3,checksum:'c'.repeat(64),savedAt:'2026-10-01T00:00:00.000Z'});
  assert.equal(mirrored.ok,true);
  assert.equal(mirrored.meta.entityCount,2);
  assert(batched.some(x=>x.sql.includes('DELETE FROM ledger_entities')));
  assert(batched.some(x=>x.sql.includes('INSERT INTO ledger_entities')));
  const status=await ctx.d1LedgerStatus(env,'a'.repeat(64));
  assert.equal(status.ok,true);assert.equal(status.hit,true);assert.equal(status.meta.revision,3);
  assert.equal(ctx.d1Ready({}),false);
  console.log('PASS D1 ledger shadow contract');
})().catch(e=>{console.error(e);process.exit(1)});
