/* Browser layout regression; synthetic data only, no live ledger writes.
 * PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE may point to a local runtime.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.LAYOUT_OUTPUT||path.join(root,'layout-evidence'));
fs.mkdirSync(out,{recursive:true});
const current=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8');
const before=cp.execFileSync('git',['show','86b5c5948fba70ee8e839036160fb4d9dcb0a075:gateway/public/index.html'],{cwd:root,encoding:'utf8',maxBuffer:8e6});
const prepare=html=>html.replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
async function fixture(page,view,count){
 await page.evaluate(({view,count})=>{
  S=emptyState();S.ui.wallpaper=false;S.projects=[{id:'p',name:'โครงการก่อสร้างอาคารอเนกประสงค์และปรับปรุงภูมิทัศน์ ชื่อโครงการยาวสำหรับตรวจจอเล็ก',contract:99999999.99,budget:329236.80,status:'active',endDate:'2027-10-31'}];
  S.tx=[{id:'t',pid:'p',type:'in',amount:329236.80,paid:true,date:'2026-10-04',cat:'รายรับ',sub:'รายรับทดสอบ',pay:'transfer'},{id:'paid-fixture',pid:'p',type:'out',amount:237711.80,paid:true,date:'2026-10-04',cat:'ค่าของ',sub:'ทดสอบยอดจ่ายแล้ว',pay:'transfer'},{id:'pending-fixture',pid:'p',type:'out',amount:66775.00,paid:false,date:'2026-10-04',cat:'ค่าของ',sub:'ทดสอบยอดค้างจ่าย',pay:'transfer'}];
  S.boq=[{id:'b',pid:'p',name:'รายการก่อสร้างสำหรับทดสอบรายละเอียดข้อความยาว',qty:10,unit:'ตร.ม.',price:32923.68,cat:'ค่าของ'}];
  U.view=view;U.pid='p';U.boqProjectPid='p';U.sheet=null;render();
  if(view==='print'){const header='ว/ด/ป รายการ / ค่าแรง จำนวน ราคา/หน่วย รวม หมายเหตุ';S.tx=Array.from({length:17},(_,i)=>({id:'report-'+i,pid:'p',type:'out',amount:54600+i*125.50,paid:i%2===0,date:'2026-09-'+String(15+i).padStart(2,'0'),cat:'ค่าประกัน/ค่างาน',sub:i===0?header:'รายละเอียดรายการวัสดุก่อสร้างที่มีข้อความยาวเพื่อยืนยันว่าการ์ดไม่ล้นขอบจอ',partner:i===0?header:'ร้านวัสดุก่อสร้างทดสอบชื่อยาว',pay:'transfer'}));U.exportPid='';render();}
  if(count){U.expenseScanBusy=false;U.expenseBatchBusy=false;U.expenseBatchProgress=100;U.expenseBatchDone=count;U.expenseBatchTotal=count;U.expenseBatch=Array.from({length:count},(_,i)=>({include:true,amount:329236.80,date:'2026-10-04',pid:'p',pay:'transfer',cat:'ค่าของ',sub:'รายละเอียดวัสดุก่อสร้างยาวมาก '.repeat(12),partner:'ร้านค้าทดสอบ',photo:'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="58"><rect width="56" height="58" fill="#eee"/><text x="4" y="30" font-size="10">TEST</text></svg>'),ocrConfidence:.8,ocrSource:'local'}));U.sheet={kind:'expenseBatch'};render();}
 },{view,count});
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const evidence=[];
 try{
 for(const version of ['before','after']){
  for(const mode of ['browser','safe-area-simulation'])for(const [width,height] of [[320,640],[375,812],[390,844],[430,932],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
   const page=await context.newPage();await page.route('**/*',r=>r.abort());let html=prepare(version==='before'?before:current);
   if(mode==='safe-area-simulation')html=html.replace(/env\(safe-area-inset-top(?:,\s*0px)?\)/g,'44px').replace(/env\(safe-area-inset-bottom(?:,\s*0px)?\)/g,'34px');
   await page.setContent(html);
   for(const [view,count] of [['home',0],['projects',0],['boq',0],['print',0],['add',0],['add',1],['add',11],['add',60]]){
    await fixture(page,view,count);
    const result=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!e.closest('.wrapx,.acct-table');}).slice(0,12).map(e=>e.className),handles:document.querySelectorAll('.master-sheet-handle').length}));
    evidence.push({version,mode,width,height,view,count,...result});
    if(view==='home'&&width===390&&version==='before'){
     const baseline=await page.evaluate(()=>({columns:getComputedStyle(document.querySelector('.expense-status-grid')).gridTemplateColumns,amounts:[...document.querySelectorAll('.expense-status-copy>b')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length;})}));
     assert.equal(baseline.columns.split(' ').length,2,JSON.stringify(baseline));assert(baseline.amounts.some(lines=>lines>1),JSON.stringify(baseline));
    }
    if(version==='after'){
     assert(result.scrollWidth<=result.width+1,JSON.stringify(evidence.at(-1)));
     if(view==='add'&&!count){
      const amount=await page.locator('.add-amount .amt').evaluate(el=>{const s=getComputedStyle(el),i=getComputedStyle(el.querySelector('input')),r=el.getBoundingClientRect();return {height:r.height,outlineStyle:s.outlineStyle,borderWidth:s.borderTopWidth,boxShadow:s.boxShadow,inputOutlineStyle:i.outlineStyle,inputBoxShadow:i.boxShadow};});
      assert(amount.height<=72&&amount.outlineStyle==='none'&&amount.borderWidth==='2px'&&amount.boxShadow==='none'&&amount.inputOutlineStyle==='none'&&amount.inputBoxShadow==='none',JSON.stringify(amount));
     }
     if(view==='home'){
      const finance=await page.evaluate(()=>({innerWidth,media:matchMedia('(max-width:600px)').matches,view:document.body.dataset.view,columns:getComputedStyle(document.querySelector('.expense-status-grid')).gridTemplateColumns,labels:[...document.querySelectorAll('.expense-status-copy small')].map(e=>e.textContent.trim()),amounts:[...document.querySelectorAll('.expense-status-copy>b')].map(e=>({text:e.textContent,whiteSpace:getComputedStyle(e).whiteSpace,rects:(()=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length;})()}))}));
      if(width<=960)assert.equal(finance.columns.split(' ').length,1,JSON.stringify(finance));
      assert.deepEqual(finance.labels,['จ่ายแล้ว','ค้างจ่าย']);
      assert.deepEqual(finance.amounts.map(x=>x.text),['฿237,711.80','฿66,775.00']);
      assert(finance.amounts.every(x=>(width>960||x.whiteSpace==='nowrap')&&x.rects===1),JSON.stringify(finance));
     }
     if(view==='print'&&width<=900){
      const report=await page.evaluate(()=>{const table=document.querySelector('.tx-report-table'),rows=table?[...table.querySelectorAll('tbody tr')]:[],first=rows[0],date=first&&first.querySelector('.tx-report-date'),item=first&&first.querySelector('.tx-report-item'),amount=first&&first.querySelector('.tx-report-paid:not(.tx-report-empty)'),textRects=el=>{const r=document.createRange();r.selectNodeContents(el);return r.getClientRects().length};return {tableExists:!!table,tableWidth:table?.getBoundingClientRect().width,appWidth:document.querySelector('#app')?.getBoundingClientRect().width,columns:first?getComputedStyle(first).gridTemplateColumns.split(' ').length:0,rows:rows.length,dateLines:date?textRects(date):0,dateWhiteSpace:date?getComputedStyle(date).whiteSpace:'',itemFits:!!item&&item.getBoundingClientRect().right<=first.getBoundingClientRect().right+1,amountFits:!!amount&&amount.getBoundingClientRect().right<=first.getBoundingClientRect().right+1,warning:document.querySelector('.tx-report-ocr-warning')?.textContent||''};});
      assert.equal(report.rows,17);assert(report.tableWidth<=report.appWidth+1,JSON.stringify(report));assert.equal(report.columns,2);assert.equal(report.dateLines,1);assert.equal(report.dateWhiteSpace,'nowrap');assert(report.itemFits&&report.amountFits,JSON.stringify(report));assert(report.warning.includes('ควรตรวจสอบ'));
     }
     if(view==='projects')assert(await page.evaluate(()=>[...document.querySelectorAll('.project-hub-actions button')].every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;})));
     assert(await page.evaluate(()=>[...document.querySelectorAll('.project-finance-kpis b,.project-hub-glance b,.expense-batch-summary b,.expense-batch-actions-summary b')].every(e=>!e.textContent.includes('฿')||getComputedStyle(e).whiteSpace==='nowrap')));
     if(count){
      const checks=await page.evaluate(()=>{
       const sheet=document.querySelector('.master-sheet'),last=document.querySelectorAll('.expense-batch-row');sheet.scrollTop=sheet.scrollHeight;
       const action=document.querySelector('.expense-batch-actions'),date=last[last.length-1].querySelector('[type=date]'),row=date.closest('.expense-batch-row');
       const evidence=[...sheet.querySelectorAll('.expense-batch-evidence')];
       return {dateFits:date.getBoundingClientRect().right<=row.getBoundingClientRect().right,actionFits:action.getBoundingClientRect().bottom<=sheet.getBoundingClientRect().bottom+1,oneHandle:getComputedStyle(sheet,'::before').display==='none',font:parseFloat(getComputedStyle(date).fontSize),evidenceCount:evidence.length,evidenceImages:evidence.every(x=>x.querySelector('img')?.src.startsWith('data:image/')),evidenceTargets:evidence.every(x=>x.querySelector('summary').getBoundingClientRect().height>=44)};
      });assert(checks.dateFits&&checks.actionFits&&checks.oneHandle&&checks.font>=16&&checks.evidenceCount===count&&checks.evidenceImages&&checks.evidenceTargets,JSON.stringify(checks));
      await page.locator('[data-exp-batch="0"][data-k="sub"]').fill('แก้ไขรายละเอียด');
      await page.locator('[data-exp-batch="0"][data-k="include"]').uncheck();
      assert.equal(await page.evaluate(()=>U.expenseBatch[0].sub),'แก้ไขรายละเอียด');assert.equal(await page.evaluate(()=>U.expenseBatch[0].include),false);
     }
    }
    if(width===390&&view==='home'){
     await page.locator('.expense-status-overview').evaluate(el=>el.scrollIntoView({block:'start'}));
     await page.locator('.expense-status-overview').screenshot({animations:'disabled',path:path.join(out,`${version}-${mode}-dashboard-expenses-390.png`)});
    }
    if(width===390||width===320){
     if(version==='after'&&mode==='browser'&&width===390&&view==='add'&&!count)await page.screenshot({path:path.join(out,'after-browser-390-add-amount.png'),fullPage:true});
     if(count){await page.evaluate(()=>document.querySelector('.master-sheet').scrollTop=0);await page.screenshot({path:path.join(out,`${version}-${mode}-${width}-${view}-${count}-top.png`)});await page.evaluate(()=>{const s=document.querySelector('.master-sheet');s.scrollTop=s.scrollHeight;});}
     if(version==='after'&&mode==='browser'&&width===390&&view==='add'&&count===11){const summary=page.locator('.expense-batch-evidence summary').first();await summary.click();const image=page.locator('.expense-batch-evidence img').first();assert(await image.isVisible());assert(await image.evaluate(el=>el.src.startsWith('data:image/')));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));await page.screenshot({path:path.join(out,'after-browser-390-add-11-evidence-open.png')});await summary.click();}
     if(view==='print'){await page.evaluate(()=>{const table=document.querySelector('.tx-report-table')||[...document.querySelectorAll('.pv table')].at(-1);if(table)table.scrollIntoView({block:'start'});});await page.screenshot({path:path.join(out,`${version}-${mode}-${width}-print-list-viewport.png`)});}
     await page.screenshot({path:path.join(out,`${version}-${mode}-${width}-${view}-${count}.png`),fullPage:!count});
    }
   }
   if(version==='after'){
    await fixture(page,'projects',0);await page.evaluate(()=>{S.projects=Array.from({length:20},(_,i)=>({...S.projects[0],id:'p'+i}));render();window.scrollTo({left:0,top:400,behavior:'instant'});});
    const y=await page.evaluate(()=>scrollY);assert.equal(y,400);await page.evaluate(()=>{U.sheet={kind:'settings'};render();});
    assert.equal(await page.evaluate(()=>sheetScrollLock.y),y);await page.evaluate(()=>{U.sheet=null;render();});assert.equal(await page.evaluate(()=>scrollY),y);
    await fixture(page,'add',11);await page.setViewportSize({width,height:Math.min(height,360)});
    await page.waitForFunction(()=>Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--ledger-vvh'))-visualViewport.height)<1);
    await page.locator('[data-exp-batch="10"][data-k="partner"]').focus();
    assert(await page.evaluate(()=>document.querySelector('.master-sheet').getBoundingClientRect().height<=visualViewport.height));
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.master-sheet')).touchAction),'auto');
    const draft=await page.evaluate(()=>JSON.stringify(U.expenseBatch));
    await page.setViewportSize({width:height,height:width});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
    await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>JSON.stringify(U.expenseBatch)),draft);
   }
   await context.close();
  }
 }
 fs.writeFileSync(path.join(out,'layout-results.json'),JSON.stringify(evidence,null,2));console.log('PASS Chromium layout: 5 viewports, browser/safe-area simulation, 4 screens, batches 1/11/60, edit/selection, viewport shrink and scroll restoration');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
