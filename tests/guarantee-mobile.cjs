/* Retention register mobile regression; synthetic ledger data only. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.LAYOUT_OUTPUT||path.join(root,'layout-evidence','v1053'));
const html=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8').replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  for(const [width,height] of [[320,640],[375,812],[390,844],[430,932],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'}),page=await context.newPage();
   await page.route('**/*',r=>r.abort());await page.setContent(html);
   await page.evaluate(()=>{S=emptyState();S.ui.wallpaper=false;const sourceRows=legacyRetentionImportRows();S.projects=[{id:'p',name:'โครงการทดสอบติดตามเงินประกันผลงาน ชื่อยาว',contract:329236.80,status:'closed',client:'หน่วยงาน'}].concat(sourceRows.map((r,i)=>({id:'legacy-'+i,name:r.name,contract:360000,status:'closed'})));S.guarantees=[{id:'g',pid:'p',type:'ประกันผลงาน',holder:'หน่วยงาน',amount:16461.84,paidDate:'2026-08-04',followupBase:'income',followupBaseDate:'2026-08-04',dueDate:'2028-08-04',returned:false,note:'ทดสอบ'}];U.view='guarantees';U.guaranteeProjectPid='';U.guaranteeFilter='all';U.guaranteeQuery='';render();});
   const metrics=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,tool:document.querySelector('.guarantee-register-tools').getBoundingClientRect().toJSON(),searchFont:getComputedStyle(document.querySelector('#guaranteeQuickSearch')).fontSize,targets:[...document.querySelectorAll('.guarantee-mobile-tabs button,.guarantee-command button')].map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]}),amounts:[...document.querySelectorAll('.guarantee-mobile-row .gm-side strong')].map(e=>({text:e.textContent,whiteSpace:getComputedStyle(e).whiteSpace,rects:(()=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length})()}))}));
   assert(metrics.scroll<=metrics.client+1,'horizontal overflow at '+width+'x'+height+': '+JSON.stringify(metrics));
   assert(metrics.tool.right<=metrics.client+1,'register tools exceed viewport at '+width);
   assert(parseFloat(metrics.searchFont)>=16,'mobile search should avoid focus zoom');
   assert(metrics.targets.every(x=>x[0]>=44&&x[1]>=44),'controls should meet touch target at '+width);
   assert.equal(metrics.amounts[0].rects,1,'money amount should remain a single unbroken text run');
   if(width===390&&height===844)await page.screenshot({path:path.join(out,'retention-register-after-390x844.png')});
   await page.evaluate(()=>{U.sheet={kind:'guarantee',id:'g'};render();});
   const modal=page.locator('.master-sheet');
   assert.equal(await modal.count(),1,'edit modal opens');
   const before=await page.evaluate(()=>JSON.stringify(S.guarantees));
   await page.locator('#gfollowupDate').focus();
   await page.evaluate(()=>{visualViewport.height=360;visualViewport.dispatchEvent(new Event('resize'));syncProjectViewport();});
   const form=await page.evaluate(()=>{const s=document.querySelector('.master-sheet'),f=document.activeElement.getBoundingClientRect(),r=s.getBoundingClientRect();return {client:s.clientWidth,scroll:s.scrollWidth,left:r.left,right:r.right,focusLeft:f.left,focusRight:f.right,viewport:visualViewport.width,doc:document.documentElement.clientWidth,docScroll:document.documentElement.scrollWidth};});
   assert(form.scroll<=form.client+1,'modal content should not scroll sideways at '+width+': '+JSON.stringify(form));
   assert(form.focusLeft>=form.left-1&&form.focusRight<=form.right+1,'focused date field stays in modal at '+width);
   assert(form.docScroll<=form.doc+1,'keyboard layout should not add horizontal overflow');
   if(width===390&&height===844)await page.screenshot({path:path.join(out,'retention-edit-keyboard-simulated-390x844.png')});
   assert.equal(await page.evaluate(()=>JSON.stringify(S.guarantees)),before,'opening/editing does not alter saved guarantee data');
   await page.evaluate(()=>{U.sheet=null;render();});await page.locator('[data-act="newLegacyRetentionImport"]').click();
   const importView=await page.evaluate(()=>({rows:document.querySelectorAll('.legacy-retention-row').length,selected:[...document.querySelectorAll('[data-legacy-key="pid"]')].map(e=>e.value),amounts:[...document.querySelectorAll('[data-legacy-key="amount"]')].map(e=>e.value),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
   assert.equal(importView.rows,5);assert(importView.selected.every(Boolean),'all exact matching project names are preselected');assert.equal(importView.amounts[0],'18000');assert(importView.scrollWidth<=importView.clientWidth+1,'import review should not overflow horizontally');
   await page.locator('[data-legacy-row="0"][data-legacy-key="amount"]').fill('17500');assert.equal(await page.evaluate(()=>U.sheet.rows[0].amount),'17500','edited import values stay in the review draft');await page.locator('[data-legacy-row="0"][data-legacy-key="amount"]').fill('18000');
   if(width===390&&height===844)await page.screenshot({path:path.join(out,'retention-import-review-390x844.png')});
   const savedBeforeImport=await page.evaluate(()=>JSON.stringify({guarantees:S.guarantees,tx:S.tx}));
   await page.locator('[data-legacy-row="4"][data-legacy-key="paymentDate"]').focus();
   await page.evaluate(()=>{visualViewport.height=360;visualViewport.dispatchEvent(new Event('resize'));syncProjectViewport();});
   const importKeyboard=await page.evaluate(()=>{const s=document.querySelector('.master-sheet');s.scrollTop=s.scrollHeight;const f=document.activeElement.getBoundingClientRect(),actions=s.querySelector('.stack:last-child').getBoundingClientRect(),b=s.querySelector('[data-act="saveLegacyRetentionImport"]').getBoundingClientRect(),r=s.getBoundingClientRect();return {fieldBottom:f.bottom,actionsTop:actions.top,top:r.top,bottom:r.bottom,scroll:s.scrollTop,saveBottom:b.bottom,client:s.clientWidth,width:s.scrollWidth,viewport:visualViewport.height};});
   assert(importKeyboard.fieldBottom<=importKeyboard.viewport+1,'last import date field should be visible in simulated keyboard viewport: '+JSON.stringify(importKeyboard));
   assert(importKeyboard.width<=importKeyboard.client+1,'import sheet stays within width on small screens');
   assert(importKeyboard.fieldBottom<=importKeyboard.actionsTop+1,'last date field remains above the modal action bar');
   assert(importKeyboard.saveBottom<=importKeyboard.bottom+1,'import save action is reachable at the end of the modal');
   if(width===390&&height===844)await page.screenshot({path:path.join(out,'retention-import-last-field-keyboard-simulated-390x844.png')});
   assert.equal(await page.evaluate(()=>JSON.stringify({guarantees:S.guarantees,tx:S.tx})),savedBeforeImport,'reviewing import does not write records or accounting entries');
   await context.close();
  }
  console.log('PASS retention register/edit mobile simulation: 320, 375, 390, 430 portrait and 844x390 landscape; modal keyboard layout, touch targets, money wrapping, no auto-save');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
