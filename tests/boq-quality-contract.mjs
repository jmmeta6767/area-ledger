import assert from 'node:assert/strict';
import {verifyPr4} from './boq-document-quality.mjs';
const rows=[['ฉาบปูนเสาโครงสร้าง','ค่าของ',27.25],['ฉาบปูนเสาโครงสร้าง','ค่าแรง',109],['ทาสีน้ำพลาสติกเสาโครงสร้าง','ค่าของ',50.64],['ทาสีน้ำพลาสติกเสาโครงสร้าง','ค่าแรง',35]].map(([name,category,unitPrice])=>({name,category,qty:48,unit:'ตร.ม.',unitPrice}));
rows.forEach(r=>{r.amount=Math.round(r.qty*r.unitPrice*100)/100;r.sectionCode='1.2.2';});
assert.equal(verifyPr4({rows}).total,10650.72);
for(const mutate of [r=>delete r[0].amount,r=>r[0].amount=6540,r=>r[0].sectionCode='1.2.1']){const bad=structuredClone(rows);mutate(bad);assert.throws(()=>verifyPr4({rows:bad}));}
for(const mutate of [r=>r.pop(),r=>r.push({...r[0]}),r=>r[0].unitPrice=17,r=>r[1].qty=31,r=>r[2].unitPrice=50,r=>r[3].category='ค่าของ',r=>r[0].name='หัวหมวด',r=>r[0].unit='กก.']){
  const bad=structuredClone(rows);mutate(bad);assert.throws(()=>verifyPr4({rows:bad}));
}
assert.throws(()=>verifyPr4({rows:[]}));
console.log('PASS actual Pr4 quality gate rejects missing, extra, mislabeled and handwritten values');
