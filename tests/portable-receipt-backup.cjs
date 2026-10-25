'use strict';
/* Exercise actual app backup functions with synthetic receipt media only. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n').replace(/\nboot\(\);/,'\n');
const storage=new Map(),messages=[],elements={};
const node=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){},appendChild(){},focus(){},innerHTML:''});
const ctx={console,Date,Math,JSON,Number,String,Array,Object,Promise,Set,Map,RegExp,URL,Blob,
 parseFloat,isFinite,isNaN,setTimeout:()=>0,clearTimeout(){},navigator:{},
 location:{origin:'https://ledger.test',protocol:'https:',hostname:'ledger.test',reload(){}},
 history:{pushState(){},replaceState(){}},
 window:{addEventListener(){},scrollTo(){}},
 document:{addEventListener(){},getElementById:id=>elements[id]||null,querySelector(){return null},querySelectorAll(){return []},documentElement:node(),body:node(),createElement:node},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 sessionStorage:{getItem(){return null},setItem(){},removeItem(){}}
};
vm.createContext(ctx);vm.runInContext(code,ctx);ctx.render=()=>{};ctx.toast=x=>messages.push(String(x));
const png='data:image/png;base64,'+Buffer.from('synthetic original evidence').toString('base64');
const jpg='data:image/jpeg;base64,'+Buffer.from('synthetic second receipt').toString('base64');
let originals,downloaded,readCount;
function fixture(referenced=true){
 storage.clear();messages.length=0;downloaded=null;readCount=0;originals=new Map();
 ctx.S=ctx.emptyState();ctx.S.projects=[{id:'p',name:'Synthetic project'}];
 ctx.S.tx=[{id:'r1',pid:'p',type:'out',amount:500,photo:referenced?'':png,
   photoRef:referenced?'r2/ref1':'',photoHash:ctx.expensePhotoFingerprint(png)}];
 ctx.S.auditLog=[{id:'log',action:'keep'}];
 ctx.U.portableBackupBusy=false;ctx.U.storageReadBlocked=false;
 ctx.committedState=JSON.stringify(ctx.S);storage.set(ctx.KEY,ctx.committedState);
 originals.set('receipt-original-v1:r1',png);
 ctx.idbRead=async k=>{readCount++;return originals.get(k)||null;};
 ctx.saveFile=async(name,blob)=>{downloaded={name,blob};return true;};
 ctx.persist=()=>true;
 ctx.doCopy=(id,callback)=>{ctx.lastCopy={id,value:elements[id].value};callback();};
 elements.bkbox={value:'',closest(){return null},focus(){},select(){},setSelectionRange(){}};
}
let n=0;async function check(name,fn){await fn();n++;console.log('PASS',name);}
(async()=>{
 await check('no R2 references preserves normal backup and does not query IDB',async()=>{
  fixture(false);const out=JSON.parse(await ctx.backupPortableJson());assert.equal(out.state.tx[0].photo,png);
  assert.equal(readCount,0);assert.equal(ctx.restoreParse(out).ok,true);
 });
 await check('embedded R2 originals create portable, checksum-valid migration JSON without mutations',async()=>{
  fixture();const before=JSON.stringify(ctx.S),out=JSON.parse(await ctx.backupPortableJson());
  assert.equal(out.portableReceiptImages,1);assert.equal(out.state.tx[0].photo,png);
  assert.equal(out.state.tx[0].photoRef,'r2/ref1');const restored=ctx.restoreParse(out);assert.equal(restored.ok,true);assert.equal(restored.state.tx[0].photo,png);const tampered=JSON.parse(JSON.stringify(out));tampered.state.tx[0].photo=jpg;assert.equal(ctx.restoreParse(tampered).error,'BACKUP_CHECKSUM');
  assert.equal(JSON.stringify(ctx.S),before);assert.equal(storage.get(ctx.KEY),before);
 });
 await check('missing local evidence fails closed',async()=>{
  fixture();originals.clear();await assert.rejects(ctx.backupPortableJson(),/RECEIPT_EVIDENCE_MISSING_OR_CHANGED/);
 });
 await check('tampered evidence fails fingerprint',async()=>{
  fixture();originals.set('receipt-original-v1:r1',jpg);
  await assert.rejects(ctx.backupPortableJson(),/RECEIPT_EVIDENCE_MISSING_OR_CHANGED/);
 });
 await check('remote-only legacy references are not misreported as portable',async()=>{
  fixture();ctx.S.tx[0].photoHash='';ctx.committedState=JSON.stringify(ctx.S);storage.set(ctx.KEY,ctx.committedState);
  await assert.rejects(ctx.backupPortableJson(),/RECEIPT_EVIDENCE_MISSING_OR_CHANGED/);
 });
 await check('other-tab write during IDB read fails without losing state',async()=>{
  fixture();const before=JSON.stringify(ctx.S);
  ctx.idbRead=async k=>{storage.set(ctx.KEY,'newer-tab-data');return originals.get(k);};
  await assert.rejects(ctx.backupPortableJson(),/BACKUP_STATE_CHANGED/);
  assert.equal(JSON.stringify(ctx.S),before);assert.equal(storage.get(ctx.KEY),'newer-tab-data');
 });
 await check('current-tab edit during backup fails without undoing edit',async()=>{
  fixture();ctx.idbRead=async k=>{ctx.S.tx[0].amount=501;return originals.get(k);};
  await assert.rejects(ctx.backupPortableJson(),/BACKUP_STATE_CHANGED/);
  assert.equal(ctx.S.tx[0].amount,501);
 });
 await check('two referenced originals are required before export',async()=>{
  fixture();ctx.S.tx.push({id:'r2',pid:'p',type:'out',amount:250,photo:'',photoRef:'r2/ref2',
    photoHash:ctx.expensePhotoFingerprint(jpg)});
  ctx.committedState=JSON.stringify(ctx.S);storage.set(ctx.KEY,ctx.committedState);
  await assert.rejects(ctx.backupPortableJson(),/RECEIPT_EVIDENCE_MISSING_OR_CHANGED/);
  originals.set('receipt-original-v1:r2',jpg);
  const data=JSON.parse(await ctx.backupPortableJson());assert.equal(data.portableReceiptImages,2);
  assert.equal(data.state.tx[1].photo,jpg);assert.equal(ctx.restoreParse(data).ok,true);
 });
 await check('failed download does not mark last backup or mutate ledger',async()=>{
  fixture();originals.clear();const before=JSON.stringify(ctx.S);
  assert.equal(await ctx.backupPortableAction('download'),false);
  assert.equal(JSON.stringify(ctx.S),before);assert.equal(downloaded,null);
  assert(messages.at(-1).includes('สำรองไม่ได้'));
 });
 await check('successful download includes original image and updates backup metadata only after save',async()=>{
  fixture();const old=ctx.S.tx[0].amount;
  assert.equal(await ctx.backupPortableAction('download'),true);
  assert(downloaded.name.endsWith('.json'));
  const doc=JSON.parse(await downloaded.blob.text());assert.equal(doc.state.tx[0].photo,png);
  assert.equal(doc.state.tx[0].amount,old);assert(ctx.S.lastBackup>0);
 });
 await check('clipboard copies the expanded verified portable backup, never stale preview',async()=>{
  fixture();elements.bkbox.value='reference-only incomplete content';
  assert.equal(await ctx.backupPortableAction('copy'),true);
  const doc=JSON.parse(ctx.lastCopy.value);assert.equal(doc.state.tx[0].photo,png);
  assert.equal(ctx.lastCopy.id,'bkbox');assert(ctx.S.lastBackup>0);
 });
 await check('busy guard rejects a simultaneous portable backup',async()=>{
  fixture();ctx.U.portableBackupBusy=true;assert.equal(await ctx.backupPortableAction('download'),false);
  assert.equal(downloaded,null);
 });
 console.log(n+' portable receipt backup safety tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
