const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8');
function fn(name){const p=src.indexOf('function '+name+'(');assert(p>=0,'missing '+name);const n=src.indexOf('\nfunction ',p+10);return src.slice(p,n<0?src.length:n);}

for(const name of ['runtimeReleaseCanvas','runtimeReleaseImage','runtimeReleaseObjectUrl','runtimeReleasePdf','runtimeReleaseCloudPhoto'])assert(src.includes('function '+name+'('),'missing '+name);
assert(src.includes('boqOcrPdf:null'),'active PDF runtime slot missing');

const ai=fn('boqAiReadFile'),read=fn('boqReadImage');
for(const x of [ai,read]){assert(x.includes('runtimeReleaseObjectUrl(url)'),'OCR object URL cleanup missing');assert(x.includes('runtimeReleaseCanvas(cv)'),'OCR canvas cleanup missing');assert(x.includes('runtimeReleaseImage(im)'),'OCR image cleanup missing');}

const cancel=fn('boqCancelImport'),release=fn('boqOcrRelease'),scanPdf=fn('boqImportScannedPdf'),textPdf=fn('boqImportPdf');
assert(cancel.includes('runtimeReleasePdf(pdf)'),'cancel must destroy active PDF');
assert(release.includes('runtimeReleasePdf(pdf)'),'OCR release must destroy active PDF');
assert(scanPdf.includes('U.boqOcrPdf=pdf'),'scanned PDF must register active PDF');
assert(textPdf.includes('finally{runtimeReleasePdf(pdf);}'),'text-layer PDF must destroy PDF in finally');

const single=fn('expenseScanImage'),batch=fn('expenseBatchScan');
assert(single.includes('function cleanup(){runtimeReleaseCanvas(c)'),'single expense scan cleanup missing');
assert(batch.includes('finally{runtimeReleaseCanvas(data&&data.canvas);if(data)data.canvas=null;}'),'batch expense canvas cleanup missing');

const profile=fn('profilePhotoResize'),identity=fn('profileIdentityResize'),thumb=fn('cloudPhotoThumb');
assert(profile.includes('runtimeReleaseCanvas(c)'),'profile post resize canvas cleanup missing');
assert(identity.includes('runtimeReleaseCanvas(c)'),'profile identity canvas cleanup missing');
assert(thumb.includes('runtimeReleaseCanvas(c)'),'cloud thumbnail canvas cleanup missing');

const cloudOpen=fn('cloudFileOpen');
assert(cloudOpen.includes("runtimeReleaseCloudPhoto();U.sheet={kind:'cloudPhoto'"),'cloud photo replacement cleanup missing');
assert(src.includes("else if(a==='closeSheet'){")&&src.includes('runtimeReleaseCloudPhoto();U.sheet=null;'),'cloud photo close cleanup missing');

assert(src.includes("KEY='site-ledger-v1'")||src.includes("const KEY='site-ledger-v1'"),'storage key contract missing');
assert(src.includes("'site-ledger-db'"),'IndexedDB contract missing');
console.log('PASS v1036 runtime memory stability regression');
