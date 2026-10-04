/* Run from repository root: node tests/boq-quality-provenance.cjs. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('gateway/public/index.html','utf8'),context={};
vm.createContext(context);
for(const name of ['boqImportKey','boqPreviewRowKey','boqRowQuality','boqStrongEvidenceRow','boqQualityRows','boqRowsNeedVision','boqAmount','boqOcrReconcile','boqAiFinancialMissing','boqAiPageTotalCheck','boqAiCoverage']){
  const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);
  assert(start>=0,'Missing production function '+name);vm.runInContext(source.slice(start,end<0?undefined:end),context);
}
const base={name:'งานฉาบปูนเสาโครงสร้าง — ค่าวัสดุ',category:'ค่าของ',qty:48,unit:'ตร.ม.',unitPrice:27.25,sourceAmount:1308,sectionCode:'1.2.2',sectionName:'งานตกแต่งโครงสร้าง',ocrConfidence:.96,ocrNeedsReview:true,ocrEquation:true,sourceKind:'ai-vision'};
const page1={...base,sourcePage:1,sourceFile:'page1.jpg'},page2={...base,sourcePage:2,sourceFile:'page2.jpg'};
assert.equal(context.boqQualityRows([page1,page2]).length,2,'Identical amounts on different pages are independent rows');
assert.equal(context.boqQualityRows([page1,{...page1}]).length,1,'Repeated OCR evidence on same page dedupes');
assert.equal(context.boqQualityRows([base,{...base}]).length,1,'Legacy evidence without provenance still dedupes');
assert.equal(context.boqQualityRows([page1,{...page1,sourceFile:'other-document.jpg'}]).length,2,'Different files remain distinct');
const labor1={...page1,name:'งานฉาบปูนเสาโครงสร้าง — ค่าแรง',category:'ค่าแรง',unitPrice:109,sourceAmount:5232};
const labor2={...labor1,sourcePage:2,sourceFile:'page2.jpg'};
const rows=[page1,labor1,page2,labor2],declared=13080;
assert.equal(context.boqRowsNeedVision(rows,2).good.length,4,'Local quality/vision decision retains both pages');
const checks=[context.boqAiPageTotalCheck([page1,labor1],6540,'page',2),context.boqAiPageTotalCheck([page2,labor2],6540,'page',2)];
const coverage=context.boqAiCoverage(rows,2,declared,[2,2],checks);
assert.equal(coverage.good.length,4);assert.equal(coverage.reconcile.calculated,declared);assert.equal(coverage.reconcile.ok,true);assert.equal(coverage.need,false,'Complete reconciled AI coverage must not lose rows or request false fallback');
assert(coverage.good.every(row=>row.ocrNeedsReview===true));
assert.equal(context.boqQualityRows([page1,{...page1,category:'ค่าแรง'}]).length,2,'Categories remain distinct');
assert.equal(context.boqQualityRows([page1,{...page1,sectionCode:'1.2.3'}]).length,2,'Sections remain distinct');
assert.equal(context.boqQualityRows([page1,{...page1,unitPrice:28}]).length,2,'Different prices remain distinct');
const noisy={...page1,name:'EET unreadable item text'};
const rescued=context.boqQualityRows([noisy,{...noisy,sourcePage:2,sourceFile:'page2.jpg'}]);
assert.equal(rescued.length,2);assert(rescued.every(row=>row.ocrNeedsReview===true&&row.note.includes('ต้องตรวจจากภาพ')));
console.log('PASS BOQ provenance through quality, local vision decision, AI coverage, reconciliation and review-required rescue');
