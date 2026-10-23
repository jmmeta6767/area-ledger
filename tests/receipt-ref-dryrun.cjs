'use strict';
const assert=require('node:assert/strict');
const {simulateReceiptReferenceCutover:simulate}=require('../scripts/receipt-ref-dryrun.cjs');
const png='data:image/png;base64,'+Buffer.from('A synthetic image payload').toString('base64');
const jpg='data:image/jpeg;base64,'+Buffer.from('Another synthetic receipt').toString('base64');
let n=0;function test(label,fn){fn();n++;console.log('PASS',label);}
test('single image round trips exactly without mutation',()=>{
 const state={tx:[{id:'t1',photo:png,sub:'synthetic'}]};
 const before=JSON.stringify(state),r=simulate(state);
 assert.equal(JSON.stringify(state),before);assert.equal(r.migratedRecords,1);assert.equal(r.distinctEvidenceBlobs,1);assert(r.roundTripExact);
});
test('two distinct images yield two checked copies',()=>{
 const r=simulate({tx:[{photo:png},{photo:jpg}]});assert.equal(r.migratedRecords,2);assert.equal(r.distinctEvidenceBlobs,2);
});
test('identical evidence blobs are deduplicated but both records restored',()=>{
 const r=simulate({tx:[{photo:png},{photo:png}]});assert.equal(r.migratedRecords,2);assert.equal(r.distinctEvidenceBlobs,1);
});
test('pre-existing R2 reference left untouched',()=>{
 const r=simulate({tx:[{photo:png,photoRef:'existing-cloud-key'}]});assert.equal(r.migratedRecords,0);assert.equal(r.estimatedUtf16SavingsBytes,0);
});
test('malformed data URLs fail closed',()=>{
 assert.throws(()=>simulate({tx:[{photo:'data:image/png;base64,NOT=VALID'}]}),/INVALID_BASE64/);
 assert.throws(()=>simulate({tx:[{photo:'data:image/jpeg;base64,'}]}),/INVALID_MEDIA_SIZE/);
});
test('unrelated photo fields are not rewritten',()=>{
 const r=simulate({tx:[{photo:'https://example.test/photo.png'},{receiptImage:png},{photo:''}]});
 assert.equal(r.migratedRecords,0);
});
test('empty state and invalid state are deterministic',()=>{
 const a=simulate({tx:[]}),b=simulate({tx:[]});assert.deepEqual(a,b);
 assert.throws(()=>simulate({}),/INVALID_STATE/);
});
test('Thai descriptions and numeric fields survive round trip',()=>{
 const s={tx:[{photo:jpg,sub:'เครื่องตบดิน',amount:500,category:'ค่าเช่าอื่นๆ'}],auditLog:[{action:'keep'}]};
 const before=JSON.stringify(s),r=simulate(s);assert.equal(before,JSON.stringify(s));assert(r.estimatedUtf16SavingsBytes>0);
});
console.log(n+' simulation tests passed');
