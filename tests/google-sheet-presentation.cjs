/* Synthetic snapshots and in-memory Sheets model; no real Google writes. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const w={URL,URLSearchParams,Request,Response,Headers,AbortController,TextEncoder,TextDecoder,crypto:webcrypto,console,setTimeout,clearTimeout};
vm.createContext(w);vm.runInContext(fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker='),w);
const copy=x=>JSON.parse(JSON.stringify(x));
const headers=['วันที่','หมวด','รายการ','ผู้รับเงิน','ยอดรวม','ยอดก่อน VAT','VAT','หัก ณ ที่จ่าย','ยอดสุทธิ','จ่ายแล้ว','ยังค้าง','สถานะ','ช่องทาง','หมายเหตุ','Ledger ID'];
const expense=[headers,['2026-10-17','ค่าของ','=unsafe text','ร้านทดสอบ',1070,1000,70,30,1040,300,740,'จ่ายบางส่วน','โอน','หมายเหตุ','tx-1'],['2026-02-30','ค่าแรง','งานโครงหลังคา','ช่าง',500,500,0,0,500,500,0,'จ่ายแล้ว','เงินสด','','tx-2']];
const finance={version:1,expenses:expense,income:[headers.map(x=>x==='ผู้รับเงิน'?'ผู้จ่ายเงิน':x)],costs:[['รายการต้นทุน','จำนวนเงิน','คำอธิบาย'],['เงินประกันรอคืนทั้งหมด',50,'อ้างอิง'],['ต้นทุนรวม',1500,'รวม']],profit:[['รายการ','จำนวนเงิน','คำอธิบาย'],['มูลค่าสัญญารวมอนุมัติ',5000,'สัญญา'],['รายรับที่ได้รับจริง',0,'รับจริง'],['ต้นทุนรวม',1500,'รวม'],['กำไรคาดการณ์',3500,'คาดการณ์'],['กำไร/ขาดทุนสุทธิ','','รอรับรายได้'],['รายจ่ายที่จ่ายจริง',800,'จ่ายจริง'],['กระแสเงินสดสุทธิ',-800,'รับลบจ่าย'],['ค้างจ่าย',740,'ค้าง'],['ค้างรับ',0,'ค้าง']]};
finance.costs.splice(1,0,['ค่าของ',1000,'ก่อน VAT'],['ค่าแรง',500,'ก่อน VAT'],['รายจ่ายที่บันทึก',1500,'ยอดตามแอป']);
const project={id:'p',name:'โครงการตัวอย่างสำหรับตรวจรูปแบบ',finance},original=JSON.stringify(finance);
const boq=w.googleSheetRows(project,[{id:'b',sectionCode:'01',sectionName:'งานโครงสร้าง',name:'คอนกรีต',qty:2,unitPrice:500,unit:'คิว'}]);
const input=[{title:'BOQ',values:boq.boq},{title:'สรุปหมวด',values:boq.summary},{title:'ค่าวัสดุ',values:boq.material},{title:'ค่าแรง',values:boq.labor},...Object.entries({expenses:'ค่าใช้จ่าย',income:'รายรับ',costs:'ต้นทุน',profit:'กำไร'}).map(([k,title])=>({title,values:finance[k]}))];
const tabs=copy(w.googlePresentationTabs(project,input,new Date('2026-10-17T18:30:00Z')));
assert.equal(tabs.length,9);assert.equal(tabs[0].title,'ภาพรวมโครงการ');assert.equal(tabs[0].values[2][1],'2026-10-18 01:30');
assert.deepEqual(tabs.map(t=>t.title),['ภาพรวมโครงการ','กำไร','ต้นทุน','ค่าใช้จ่าย','รายรับ','BOQ','สรุปหมวด','ค่าวัสดุ','ค่าแรง']);
assert.equal(tabs[0].values.find(r=>r[0]==='กำไร/ขาดทุนสุทธิ')[1],'รอรับรายได้');
for(const row of finance.profit.slice(1))if(typeof row[1]==='number')assert.equal(tabs[0].values.find(r=>r[0]===row[0])[1],row[1]);
const mapped=tabs.find(t=>t.title==='ค่าใช้จ่าย');assert.deepEqual(mapped.values[0].slice(0,7),['วันที่','หมวด','รายการ','ผู้รับเงิน','ยอดรวม','สถานะ','ช่องทาง']);
for(let i=0;i<headers.length;i++)assert.equal(mapped.values[1][mapped.values[0].indexOf(headers[i])],expense[1][i]);assert.equal(JSON.stringify(finance),original);
let model=[...input.map((t,i)=>({properties:{sheetId:i+1,title:t.title,gridProperties:{rowCount:1000,columnCount:30}},...(t.title==='ค่าใช้จ่าย'?{basicFilter:{range:{sheetId:i+1,startRowIndex:0,endRowIndex:3,startColumnIndex:0,endColumnIndex:15},criteria:{11:{hiddenValues:['ยังค้าง']}},sortSpecs:[{dimensionIndex:11,sortOrder:'ASCENDING'}]},conditionalFormats:[{booleanRule:{condition:{type:'NUMBER_GREATER',values:[{userEnteredValue:'100'}]}}}]}:{})})),{properties:{sheetId:99,title:'บันทึกส่วนตัว',gridProperties:{rowCount:1000,columnCount:30}}}];
let batches=[],positions=new Map(model.map(s=>[s.properties.sheetId,Array.from({length:30},(_,i)=>i)]));
w.googleJson=async(url,opt)=>{
 if(url.includes('?fields='))return {sheets:copy(model)};
 const {requests}=JSON.parse(opt.body);batches.push(requests);
 for(const r of requests){
  assert.equal(Object.keys(r).length,1);
  for(const key of ['repeatCell','updateCells','setBasicFilter']){const a=r[key]?.range||r[key]?.filter?.range;if(a){assert(a.endRowIndex>a.startRowIndex);assert(a.endColumnIndex>a.startColumnIndex);assert.notEqual(a.sheetId,99);}}
  if(r.addSheet){assert(!model.some(s=>s.properties.title===r.addSheet.properties.title));model.push({properties:r.addSheet.properties});}
  if(r.moveDimension){const a=r.moveDimension,p=positions.get(a.source.sheetId);p.splice(a.destinationIndex,0,p.splice(a.source.startIndex,1)[0]);}
  if(r.addBanding){const b=r.addBanding.bandedRange,s=model.find(s=>s.properties.sheetId===b.range.sheetId);assert(!s.bandedRanges?.length);(s.bandedRanges??=[]).push({...b,bandedRangeId:100+s.properties.sheetId});}
  if(r.updateBanding){const b=r.updateBanding.bandedRange,s=model.find(s=>s.bandedRanges?.some(x=>x.bandedRangeId===b.bandedRangeId));Object.assign(s.bandedRanges.find(x=>x.bandedRangeId===b.bandedRangeId),b);}
  if(r.setBasicFilter){const f=r.setBasicFilter.filter;model.find(s=>s.properties.sheetId===f.range.sheetId).basicFilter=f;}
  if(r.createDeveloperMetadata){const d=r.createDeveloperMetadata.developerMetadata;(model.find(s=>s.properties.sheetId===d.location.sheetId).developerMetadata??=[]).push(d);}
  if(r.addDimensionGroup){const a=r.addDimensionGroup.range;(model.find(s=>s.properties.sheetId===a.sheetId).columnGroups??=[]).push({range:a,depth:1,collapsed:false});}
  if(r.updateDimensionGroup){const a=r.updateDimensionGroup.dimensionGroup;Object.assign(model.find(s=>s.properties.sheetId===a.range.sheetId).columnGroups.find(g=>g.range.startIndex===a.range.startIndex),a);}
  if(r.deleteConditionalFormatRule){const a=r.deleteConditionalFormatRule;model.find(s=>s.properties.sheetId===a.sheetId).conditionalFormats.splice(a.index,1);}
  if(r.addConditionalFormatRule){const a=r.addConditionalFormatRule;(model.find(s=>s.properties.sheetId===a.rule.ranges[0].sheetId).conditionalFormats??=[]).splice(a.index,0,a.rule);}
  if(r.addChart){const c=r.addChart.chart;(model.find(s=>s.properties.sheetId===c.position.overlayPosition.anchorCell.sheetId).charts??=[]).push({...c,chartId:2000+model.flatMap(s=>s.charts||[]).length});}
  if(r.updateChartSpec){const a=r.updateChartSpec;const c=model.flatMap(s=>s.charts||[]).find(c=>c.chartId===a.chartId);assert(c);c.spec=a.spec;}
  if(r.deleteEmbeddedObject){for(const s of model)if(s.charts)s.charts=s.charts.filter(c=>c.chartId!==r.deleteEmbeddedObject.objectId);}
 }
 return {};
};
(async()=>{
 await w.googleWriteProjectSnapshot('synthetic','sheet',tabs,project);
 const first=batches[0],txSheet=model.find(s=>s.properties.title==='ค่าใช้จ่าย');
 assert.equal(first.filter(r=>r.addSheet).length,1);assert(txSheet.basicFilter.criteria[5]);assert.equal(txSheet.basicFilter.sortSpecs[0].dimensionIndex,5);
 assert.equal(positions.get(txSheet.properties.sheetId).indexOf(11),5);assert.equal(positions.get(txSheet.properties.sheetId)[15],15);assert(first.findIndex(r=>r.moveDimension?.source.sheetId===txSheet.properties.sheetId)<first.findIndex(r=>r.updateCells?.range.sheetId===txSheet.properties.sheetId));
 assert.equal(txSheet.columnGroups.length,1);assert.equal(txSheet.columnGroups[0].range.startIndex,7);assert.equal(txSheet.columnGroups[0].collapsed,true);
 const overview=model.find(s=>s.properties.title==='ภาพรวมโครงการ');assert.equal(overview.charts.length,3);const categories=overview.charts.find(c=>c.spec.altText==='AREA_LEDGER_CHART_CATEGORIES');assert.equal(categories.spec.basicChart.domains[0].domain.sourceRange.sources[0].endRowIndex,3);assert.equal(categories.spec.basicChart.series[0].series.sourceRange.sources[0].sheetId,model.find(s=>s.properties.title==='ต้นทุน').properties.sheetId);assert(overview.charts.find(c=>c.spec.altText==='AREA_LEDGER_CHART_PROFIT').spec.subtitle.includes('ยังไม่มีรายรับจริง'));
 const positionsBefore=JSON.stringify(overview.charts.map(c=>c.position));
 const write=first.find(r=>r.updateCells?.range.sheetId===txSheet.properties.sheetId).updateCells;
 assert.equal(write.rows[1].values[0].userEnteredValue.numberValue,Date.parse('2026-10-17')/86400000+25569);assert.equal(write.rows[2].values[0].userEnteredValue.stringValue,'2026-02-30');assert.equal(write.rows[1].values[2].userEnteredValue.stringValue,'=unsafe text');assert(!JSON.stringify(first).includes('formulaValue'));
 const beforeCounts=model.map(s=>[s.properties.sheetId,s.bandedRanges?.length||0,s.columnGroups?.length||0,s.conditionalFormats?.length||0,s.developerMetadata?.length||0]);
 await w.googleWriteProjectSnapshot('synthetic','sheet',tabs,project);
 assert.deepEqual(model.map(s=>[s.properties.sheetId,s.bandedRanges?.length||0,s.columnGroups?.length||0,s.conditionalFormats?.length||0,s.developerMetadata?.length||0]),beforeCounts);assert(txSheet.basicFilter.criteria[5]);assert(!batches[1].some(r=>r.addSheet||r.addDimensionGroup||r.createDeveloperMetadata||r.moveDimension));
 assert(txSheet.conditionalFormats.some(r=>r.booleanRule.condition.type==='NUMBER_GREATER'));
 assert.equal(overview.charts.length,3);assert.equal(JSON.stringify(overview.charts.map(c=>c.position)),positionsBefore);assert.equal(batches[1].filter(r=>r.updateChartSpec).length,3);assert(!batches[1].some(r=>r.addChart));
 const resolved=model.map(s=>({sheet:s.properties,detail:s,tab:tabs.find(t=>t.title===s.properties.title)})).filter(x=>x.tab),ov=resolved.find(x=>x.tab.title==='ภาพรวมโครงการ'),cost=resolved.find(x=>x.tab.title==='ต้นทุน');
 const custom={chartId:9999,spec:{altText:'user chart'},position:{overlayPosition:{anchorCell:{rowIndex:80},heightPixels:400}}};ov.detail={...ov.detail,charts:[custom]};const added=copy(w.googleProjectChartRequests(resolved));assert.equal(added.filter(r=>r.addChart).length,3);assert(added.filter(r=>r.addChart).every(r=>r.addChart.chart.position.overlayPosition.anchorCell.rowIndex>=102));assert(!added.some(r=>r.deleteEmbeddedObject?.objectId===9999));
 ov.detail={...overview,charts:[...overview.charts,custom,{...categories,chartId:9998}]};cost.tab={...cost.tab,values:[cost.tab.values[0],['รายจ่ายที่บันทึก',0,''],['ต้นทุนรวม',0,'']]};const removed=copy(w.googleProjectChartRequests(resolved));assert(removed.some(r=>r.deleteEmbeddedObject?.objectId===categories.chartId));assert(!removed.some(r=>r.deleteEmbeddedObject?.objectId===9999));assert.equal(w.googleProjectChartRequests([]).length,0);
 await w.googleWriteProjectSnapshot('synthetic','sheet',tabs.filter(t=>t.title!=='ภาพรวมโครงการ').map(t=>({...t,values:t.values.slice(0,1)})),project);
 assert(batches[2].filter(r=>r.updateCells).every(r=>r.updateCells.rows.length===1));
 const large={...mapped,values:[mapped.values[0],...Array(10000).fill(mapped.values[1])]};const style=w.googleSheetStyleRequests(large,{sheetId:200,gridProperties:{rowCount:10001,columnCount:26}},{});assert(style.length<60,'formatting must not produce one request per transaction');
 assert.equal(JSON.stringify(finance),original);
 console.log('PASS 9 tabs, all metric values, no-revenue state, timezone, column mapping, numeric dates, literal text, filters, repeated sync, empty/10000 rows, custom rules/tabs and accounting immutability; 3 linked charts, stable chart IDs/positions, total exclusion, empty-category cleanup and user-chart preservation');
 if(process.env.SHEET_PREVIEW_DATA)fs.writeFileSync(process.env.SHEET_PREVIEW_DATA,JSON.stringify({tabs,requests:first},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
