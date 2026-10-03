const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto;

(async()=>{
  let src=fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker=');
  const ctx={URL,Request,Response,Headers,TextEncoder,TextDecoder,AbortController,setTimeout,clearTimeout,Date,Map,Set,JSON,Math,Number,String,Error,Promise,console,crypto,fetch:async()=>new Response('{}',{status:200})};
  vm.createContext(ctx);vm.runInContext(src+';globalThis.GatewayState=GatewayState;',ctx);

  const ledgerKey='P'.repeat(43),ledgerHash=await ctx.sha256Hex(ledgerKey),mediaKey=ledgerHash+'/20261003/'+'a'.repeat(32);
  const safe=ctx.sanitizePublicProfileSnapshot({
    brand:'AREA TEST',opening:999999,tx:[{amount:1}],boq:[{price:2}],avatarRef:'bad/private/key',
    posts:[{id:'p1',type:'portfolio',projectName:'งาน A',date:'2026-10-03',text:'ผลงาน',pinned:true,photos:[{ref:mediaKey,mime:'image/jpeg'}]}]
  },ledgerHash);
  assert.equal(safe.brand,'AREA TEST');assert.equal(safe.opening,undefined);assert.equal(safe.tx,undefined);assert.equal(safe.boq,undefined);assert.equal(safe.avatarRef,'');assert.equal(safe.posts.length,1);assert.equal(safe.posts[0].photos[0].ref,mediaKey);

  let row=null;
  const db={
    prepare(sql){
      return {bind(...args){
        return {
          async first(){
            if(sql.includes('WHERE ledger_hash=?')){if(!row||row.ledgerHash!==args[0])return null;return sql.includes('snapshot_json')?row:{publicId:row.publicId,active:row.active,publishedAt:row.publishedAt,updatedAt:row.updatedAt};}
            if(sql.includes('WHERE public_id=?')){if(!row||row.publicId!==args[0])return null;if(sql.includes('active=1')&&row.active!==1)return null;return row;}
            return null;
          },
          async run(){
            if(sql.startsWith('INSERT INTO public_profiles')){
              const [publicId,lh,snapshotJson,active,publishedAt,updatedAt]=args;
              if(row&&row.ledgerHash===lh){row.snapshotJson=snapshotJson;row.active=1;row.updatedAt=updatedAt;}
              else row={publicId,ledgerHash:lh,snapshotJson,active,publishedAt,updatedAt};
            }else if(sql.startsWith('UPDATE public_profiles SET active=0')){if(row&&row.ledgerHash===args[1]){row.active=0;row.updatedAt=args[0];}}
            return {success:true};
          },
          async all(){return {results:[]};}
        };
      }};
    },
    async batch(){return [];}
  };
  const state={idFromName(x){return x;},get(){return {fetch:async()=>new Response(JSON.stringify({allowed:true}),{headers:{'Content-Type':'application/json'}})}}};
  const r2={
    async put(){},async delete(){},
    async get(key){if(key!==mediaKey)return null;return {body:new Uint8Array([1,2,3]),size:3,httpMetadata:{contentType:'image/jpeg'},httpEtag:'etag-1'};}
  };
  const env={LEDGER_DB:db,GATEWAY_STATE:state,LEDGER_FILES:r2};
  const headers={'Origin':'https://gateway.test','Content-Type':'application/json','X-AREA-Gateway-Version':'1','X-AREA-Ledger-Key':ledgerKey};

  let res=await ctx.worker.fetch(new Request('https://gateway.test/v1/profile/publish',{method:'POST',headers,body:JSON.stringify({snapshot:{brand:'AREA TEST',legalName:'บริษัททดสอบ',phone:'0640000000',avatarRef:mediaKey,stats:{activeProjects:2,deliveredProjects:1},posts:[{id:'p1',type:'portfolio',projectName:'งาน A',date:'2026-10-03',text:'ผลงานลูกค้า',pinned:true,photos:[{ref:mediaKey,mime:'image/jpeg'}]}],opening:123,tx:[{amount:9}]}})}),env);
  let body=await res.json();assert.equal(res.status,200);assert.equal(body.ok,true);assert(/^[0-9a-f]{32}$/.test(body.publicId));const id=body.publicId;

  res=await ctx.worker.fetch(new Request('https://gateway.test/v1/public/profile?id='+id),env);body=await res.json();assert.equal(res.status,200);assert.equal(body.snapshot.brand,'AREA TEST');assert.equal(body.snapshot.opening,undefined);assert.equal(body.snapshot.tx,undefined);assert.equal(body.snapshot.posts[0].text,'ผลงานลูกค้า');

  res=await ctx.worker.fetch(new Request('https://gateway.test/v1/public/profile-media?id='+id+'&key='+encodeURIComponent(mediaKey)),env);assert.equal(res.status,200);assert.equal(res.headers.get('Content-Type'),'image/jpeg');
  res=await ctx.worker.fetch(new Request('https://gateway.test/v1/public/profile-media?id='+id+'&key='+encodeURIComponent(ledgerHash+'/20261003/'+'b'.repeat(32))),env);assert.equal(res.status,403);

  res=await ctx.worker.fetch(new Request('https://gateway.test/v1/profile/revoke',{method:'POST',headers,body:'{}'}),env);body=await res.json();assert.equal(res.status,200);assert.equal(body.published,false);
  res=await ctx.worker.fetch(new Request('https://gateway.test/v1/public/profile?id='+id),env);assert.equal(res.status,404);

  console.log('PASS public portfolio privacy/runtime');
})().catch(e=>{console.error(e);process.exitCode=1});
