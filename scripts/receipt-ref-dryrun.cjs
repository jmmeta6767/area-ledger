'use strict';
// Synthetic copy/rehydrate acceptance for future IndexedDB/R2 cutover.
// NO mutation of input, localStorage, IndexedDB, R2, Drive or accounts.
const fs=require('node:fs'), crypto=require('node:crypto');
const {auditBackup}=require('./backup-audit.cjs');
const LIMIT=64*1024*1024;
function sha(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function simulateReceiptReferenceCutover(state){
  if(!state||!Array.isArray(state.tx))throw Error('INVALID_STATE');
  const original=JSON.stringify(state);
  const candidate=JSON.parse(original);
  const photos=new Map(), changes=[];let totalEvidenceChars=0;
  for(let i=0;i<candidate.tx.length;i++){
    const tx=candidate.tx[i];if(!tx||typeof tx!=='object')continue;
    const photo=tx.photo;
    if(typeof photo!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,/i.test(photo))continue;
    // Existing R2-bound photoRef must not be overwritten or duplicated.
    if(typeof tx.photoRef==='string'&&tx.photoRef)continue;
    const idx=photo.indexOf(','),enc=photo.slice(idx+1);
    if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(enc))throw Error('INVALID_BASE64');
    const bytes=Buffer.from(enc,'base64');
    if(!bytes.length||bytes.length>16*1024*1024)throw Error('INVALID_MEDIA_SIZE');
    const ref='simulation:'+sha(Buffer.from(photo,'utf8'));
    if(!photos.has(ref))photos.set(ref,photo);
    changes.push({index:i,ref,hadRef:Object.prototype.hasOwnProperty.call(tx,'photoRef'),originalRef:tx.photoRef});
    totalEvidenceChars+=photo.length;
    tx.photo='';
    tx.photoRef=ref;
  }
  const withoutEvidence=JSON.stringify(candidate);
  // Rehydrate from all *independently mapped* local image copies.
  const restored=JSON.parse(withoutEvidence);
  for(const change of changes){
    const image=photos.get(change.ref);
    if(typeof image!=='string'||sha(Buffer.from(image,'utf8'))!==change.ref.slice('simulation:'.length))throw Error('MEDIA_DIGEST_MISMATCH');
    const row=restored.tx[change.index];
    if(row.photoRef!==change.ref||row.photo!=='')throw Error('REFERENCE_MISMATCH');
    row.photo=image;
    if(change.hadRef)row.photoRef=change.originalRef;
    else delete row.photoRef;
  }
  const exact=JSON.stringify(restored)===original;
  if(!exact)throw Error('ROUNDTRIP_MISMATCH');
  return {
    mode:'offline-read-only-simulation',wroteLiveData:false,roundTripExact:true,
    migratedRecords:changes.length,distinctEvidenceBlobs:photos.size,
    originalStateUtf16Bytes:original.length*2,referenceStateUtf16Bytes:withoutEvidence.length*2,
    estimatedUtf16SavingsBytes:(original.length-withoutEvidence.length)*2,
    totalEvidenceChars,referenceFormat:'simulation-only-not-importable'
  };
}
if(require.main===module){
  const file=process.argv[2];
  if(!file){console.error('Usage: node scripts/receipt-ref-dryrun.cjs /private/backup.json');process.exitCode=2;}
  else try{
    const stat=fs.statSync(file);
    if(stat.size>LIMIT)throw Error('FILE_TOO_LARGE');
    const buffer=fs.readFileSync(file),report=auditBackup(buffer);
    if(report.errors.length){console.error(JSON.stringify({ok:false,reason:'BACKUP_INTEGRITY_FAILED',codes:report.errors.map(x=>x.code)}));process.exitCode=1;}
    else console.log(JSON.stringify(simulateReceiptReferenceCutover(JSON.parse(buffer.toString('utf8')).state),null,2));
  }catch(e){console.error('Simulation failed:',e?.message?.startsWith('INVALID_')?e.message:'NOT_VERIFIED');process.exitCode=1;}
}
module.exports={simulateReceiptReferenceCutover};
