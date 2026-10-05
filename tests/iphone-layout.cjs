/* Browser layout regression; synthetic data only, no live ledger writes.
 * PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE may point to a local runtime.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.LAYOUT_OUTPUT||path.join(root,'layout-evidence'));
fs.mkdirSync(out,{recursive:true});
const current=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8');
const before=cp.execFileSync('git',['show','5dac2923285352bf5be0602b8050a303f0931ae5:gateway/public/index.html'],{cwd:root,encoding:'utf8',maxBuffer:8e6});
const prepare=html=>html.replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
async function fixture(page,view,count){
 await page.evaluate(({view,count})=>{
  S=emptyState();S.ui.wallpaper=false;S.projects=[{id:'p',name:'โครงการก่อสร้างอาคารอเนกประสงค์และปรับปรุงภูมิทัศน์ ชื่อโครงการยาวสำหรับตรวจจอเล็ก',contract:99999999.99,budget:329236.80,status:'active',endDate:'2027-10-31'}];
  S.tx=[{id:'t',pid:'p',type:'in',amount:329236.80,paid:true,date:'2026-10-04',cat:'รายรับ',sub:'รายรับทดสอบ',pay:'transfer'}];
  S.boq=[{id:'b',pid:'p',name:'รายการก่อสร้างสำหรับทดสอบรายละเอียดข้อความยาว',qty:10,unit:'ตร.ม.',price:32923.68,cat:'ค่าของ'}];
  U.view=view;U.pid='p';U.boqProjectPid='p';U.sheet=null;render();
  if(count){U.expenseScanBusy=false;U.expenseBatchBusy=false;U.expenseBatchProgress=100;U.expenseBatchDone=count;U.expenseBatchTotal=count;U.expenseBatch=Array.from({length:count},(_,i)=>({include:true,amount:329236.80,date:'2026-10-04',pid:'p',pay:'transfer',cat:'ค่าของ',sub:'รายละเอียดวัสดุก่อสร้างยาวมาก '.repeat(12),partner:'ร้านค้าทดสอบ',photo:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="58"><rect width="56" height="58" fill="%23eee"/><text x="4" y="30" font-size="10">TEST</text></svg>',ocrConfidence:.8,ocrSource:'local'}));U.sheet={kind:'expenseBatch'};render();}
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
   for(const [view,count] of [['home',0],['projects',0],['boq',0],['add',1],['add',11],['add',60]]){
    await fixture(page,view,count);
    const result=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!e.closest('.wrapx,.acct-table');}).slice(0,12).map(e=>e.className),handles:document.querySelectorAll('.master-sheet-handle').length}));
    evidence.push({version,mode,width,height,view,count,...result});
    if(version==='after'){
     assert(result.scrollWidth<=result.width+1,JSON.stringify(evidence.at(-1)));
     if(view==='projects')assert(await page.evaluate(()=>[...document.querySelectorAll('.project-hub-actions button')].every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;})));
     assert(await page.evaluate(()=>[...document.querySelectorAll('.project-finance-kpis b,.project-hub-glance b,.expense-batch-summary b,.expense-batch-actions-summary b')].every(e=>!e.textContent.includes('฿')||getComputedStyle(e).whiteSpace==='nowrap')));
     if(count){
      const checks=await page.evaluate(()=>{
       const sheet=document.querySelector('.master-sheet'),last=document.querySelectorAll('.expense-batch-row');sheet.scrollTop=sheet.scrollHeight;
       const action=document.querySelector('.expense-batch-actions'),date=last[last.length-1].querySelector('[type=date]'),row=date.closest('.expense-batch-row');
       return {dateFits:date.getBoundingClientRect().right<=row.getBoundingClientRect().right,actionFits:action.getBoundingClientRect().bottom<=sheet.getBoundingClientRect().bottom+1,oneHandle:getComputedStyle(sheet,'::before').display==='none',font:parseFloat(getComputedStyle(date).fontSize)};
      });assert(checks.dateFits&&checks.actionFits&&checks.oneHandle&&checks.font>=16,JSON.stringify(checks));
      await page.locator('[data-exp-batch="0"][data-k="sub"]').fill('แก้ไขรายละเอียด');
      await page.locator('[data-exp-batch="0"][data-k="include"]').uncheck();
      assert.equal(await page.evaluate(()=>U.expenseBatch[0].sub),'แก้ไขรายละเอียด');assert.equal(await page.evaluate(()=>U.expenseBatch[0].include),false);
     }
    }
    if(width===390||width===320){
     if(count){await page.evaluate(()=>document.querySelector('.master-sheet').scrollTop=0);await page.screenshot({path:path.join(out,`${version}-${mode}-${width}-${view}-${count}-top.png`)});await page.evaluate(()=>{const s=document.querySelector('.master-sheet');s.scrollTop=s.scrollHeight;});}
     await page.screenshot({path:path.join(out,`${version}-${mode}-${width}-${view}-${count}.png`),fullPage:!count});
    }
   }
   if(version==='after'){
    await fixture(page,'projects',0);await page.evaluate(()=>{S.projects=Array.from({length:20},(_,i)=>({...S.projects[0],id:'p'+i}));render();window.scrollTo(0,400);});
    const y=await page.evaluate(()=>scrollY);await page.evaluate(()=>{U.sheet={kind:'settings'};render();});
    assert.equal(await page.evaluate(()=>sheetScrollLock.y),y);await page.evaluate(()=>{U.sheet=null;render();});assert.equal(await page.evaluate(()=>scrollY),y);
    await fixture(page,'add',11);await page.setViewportSize({width,height:Math.min(height,360)});
    await page.locator('[data-exp-batch="10"][data-k="partner"]').focus();
    assert(await page.evaluate(()=>document.querySelector('.master-sheet').getBoundingClientRect().height<=visualViewport.height));
   }
   await context.close();
  }
 }
 fs.writeFileSync(path.join(out,'layout-results.json'),JSON.stringify(evidence,null,2));console.log('PASS Chromium layout: 5 viewports, browser/safe-area simulation, 4 screens, batches 1/11/60, edit/selection, viewport shrink and scroll restoration');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
