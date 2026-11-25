/* V12 handover synthetic iPhone + A4 print acceptance. No live ledger data. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8')
  .replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
const out=process.env.LAYOUT_OUTPUT||path.join(root,'layout-evidence');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,640],[375,812],[390,844],[430,932],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
   await page.route('**/*',route=>route.abort());
   await page.evaluate(()=>{Object.defineProperty(window,'visualViewport',{configurable:true,value:Object.assign(new EventTarget(),{width:innerWidth,height:innerHeight,offsetLeft:0,offsetTop:0,scale:1})});});
   await page.setContent(source);
   await page.evaluate(()=>{
    S=emptyState();S.role='owner';S.ui.wallpaper=false;
    S.business={legalName:'ห้างหุ้นส่วนจำกัด ทดสอบการส่งงาน',address:'แม่สาย จ.เชียงราย',phone:'0800000000'};
    S.projects=[{id:'p',name:'โครงการทดสอบส่งมอบอาคารอเนกประสงค์ ชื่อยาว',location:'อำเภอแม่สาย',client:'หน่วยงานทดสอบ',
      contractNo:'กส-123/2569',contractDate:'2026-09-01',contract:495000,budget:420000,status:'active',retAmt:24750,retDue:''}];
    U.view='project';U.pid='p';U.sheet={kind:'projectHandover',id:'p'};render();
   });
   const modal=page.locator('.project-sheet');
   assert.equal(await modal.count(),1,'Handover sheet must render');
   const m=await page.evaluate(()=>{
    const el=document.querySelector('.project-sheet'),r=el.getBoundingClientRect();
    return {viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
      sheetLeft:r.left,sheetRight:r.right,form:!!el.querySelector('#handoverInspectionStatus'),
      print:!!el.querySelector('[data-act="handoverPrintOpen"]')};
   });
   assert(m.form&&m.print,JSON.stringify(m));
   assert(m.scrollWidth<=m.viewport+1,'Horizontal overflow in modal: '+JSON.stringify(m));
   assert(m.sheetLeft>=-2&&m.sheetRight<=width+2,'Modal offscreen: '+JSON.stringify(m));
   await page.evaluate(()=>{
    S.projects[0].handover={stage:'submitted',submittedDate:'2026-11-20',letterNo:'SW-123/2569',
      recipient:'หน่วยงานทดสอบ',evidenceRef:'ใบส่งงานลงรับ 1'};
    U.view='handoverprint';U.sheet=null;U.handoverPrintPid='p';render();
   });
   const letter=page.locator('#handoverLetterPaper');
   assert.equal(await letter.count(),1);
   assert((await letter.textContent()).includes('SW-123/2569'));
   const paper=await letter.boundingBox();
   const metrics=await page.evaluate(()=>({vw:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert(metrics.scrollWidth<=metrics.vw+1,'A4 preview overflow: '+JSON.stringify(metrics)+' '+JSON.stringify(paper));
   if(width===390){
    await page.screenshot({path:path.join(out,'handover-v12-preview-390.png'),fullPage:false});
    const pdf=await page.pdf({format:'A4',printBackground:true});
    assert(pdf.byteLength>1500&&pdf.toString('utf8',0,5)==='%PDF-','Native A4 print must produce PDF bytes');
    fs.writeFileSync(path.join(out,'handover-v12-synthetic-a4.pdf'),pdf);
   }
   await page.close();
  }
  console.log('PASS V12 handover form and A4 PDF print at 320/375/390/430/844 CSS widths (synthetic Chromium, not physical iPhone Safari)');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
