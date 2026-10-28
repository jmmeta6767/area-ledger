// Synthetic isolated payroll UI; external requests blocked, no real ledger data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const html=fs.readFileSync('gateway/public/payroll.html','utf8'),out=path.resolve(process.env.LAYOUT_OUTPUT||'layout-evidence');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});const findings=[];
 try{for(const width of [320,375,390,430,768,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await ctx.newPage();
  await page.route('**/*',r=>r.request().url()==='https://payroll.test/'?r.fulfill({contentType:'text/html; charset=utf-8',body:html}):r.abort());
  await page.addInitScript(()=>{
   const d=new Date(),day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
   const db={version:1,employees:[{id:'id-worker001',name:'พนักงานทดสอบชื่อยาวสำหรับตรวจหน้าจอมือถือและรายการค่าแรง',rate:650,active:true},{id:'id-worker002',name:'พนักงานทดสอบยอดเบิกเกิน',rate:550,active:true}],attendance:{['id-worker001__'+day]:{employeeId:'id-worker001',date:day,status:'work',wage:650}},advances:[{id:'id-advance001',employeeId:'id-worker001',date:day,amount:300,note:'ข้อมูลจำลอง'},{id:'id-advance002',employeeId:'id-worker002',date:day,amount:200,note:'ข้อมูลจำลอง'}]};
   localStorage.setItem('area-ledger-payroll-v1',JSON.stringify(db));localStorage.setItem('site-ledger-v1','main-ledger-sentinel');
  });
  await page.goto('https://payroll.test/');const before=await page.evaluate(()=>localStorage.getItem('area-ledger-payroll-v1'));
  if(process.env.AXE_SOURCE&&width===390)await page.addScriptTag({path:process.env.AXE_SOURCE});
  async function inspect(label){
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label} overflow at ${width}`);
   assert(await page.evaluate(()=>[...document.querySelectorAll('input:not([type=file]),textarea')].filter(e=>e.getClientRects().length).every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)),`${label} iPhone input font size`);
   assert(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=43.5)),`${label} 44px tap height`);
   if(process.env.AXE_SOURCE&&width===390){
    const violations=await page.evaluate(async()=>{
     const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
     return result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
    });if(violations.length)findings.push({label,width,violations});
   }
   if(width===390)await page.screenshot({path:path.join(out,'payroll-'+label+'.png')});
  }
  for(const tab of ['day','month','people','tools']){
   await page.locator(`[data-tab="${tab}"]`).click();await page.evaluate(()=>scrollTo(0,0));assert(await page.locator('#'+tab+'-view').isVisible());
   assert.equal(await page.locator('[role=tab][aria-selected=true]').count(),1);assert.equal(await page.locator(`[data-tab="${tab}"]`).getAttribute('aria-selected'),'true');assert.equal(await page.locator(`[data-tab="${tab}"]`).getAttribute('tabindex'),'0');assert.equal(await page.locator('#'+tab+'-view').getAttribute('role'),'tabpanel');assert.equal(await page.locator('#'+tab+'-view').getAttribute('aria-labelledby'),'payroll-tab-'+tab);assert.equal(await page.locator('#payrollViewStatus').textContent(),'เปิดมุมมอง'+({day:'รายวัน',month:'สรุปเดือน',people:'พนักงาน',tools:'ตั้งค่า'})[tab]);await inspect(tab);
   if(tab==='month')assert((await page.locator('#monthlyBody tr').first().innerText()).includes('350'),'650 earned minus 300 advanced remains 350');
  }
  // Tabs expose one selected view and support keyboard activation without touching payroll.
  await page.locator('[data-tab=day]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-tab=month]').getAttribute('aria-selected'),'true');assert(await page.locator('[data-tab=month]').evaluate(el=>el===document.activeElement));await page.keyboard.press('End');assert.equal(await page.locator('[data-tab=tools]').getAttribute('aria-selected'),'true');await page.keyboard.press('Home');assert.equal(await page.locator('[data-tab=day]').getAttribute('aria-selected'),'true');await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('[data-tab=tools]').getAttribute('aria-selected'),'true');
  await page.locator('[data-tab=people]').click();await page.locator('[data-action=edit-employee]').first().click();assert(await page.locator('#modal').isVisible());await page.waitForFunction(()=>document.activeElement?.id==='empName');await inspect('employee-dialog');
  assert.equal(await page.locator('#modal').getAttribute('aria-describedby'),'modalDesc');assert(await page.evaluate(()=>document.querySelector('main.shell').inert&&document.querySelector('header.topbar').inert));
  await page.locator('#modal .modal-head [data-action=close-modal]').focus();await page.keyboard.press('Shift+Tab');assert(await page.locator('#modal button[type=submit]').evaluate(el=>el===document.activeElement));await page.keyboard.press('Tab');assert(await page.locator('#modal .modal-head [data-action=close-modal]').evaluate(el=>el===document.activeElement));
  await page.evaluate(()=>document.querySelector('.back-to-ledger').focus());assert(await page.evaluate(()=>!!document.activeElement.closest('#modal')),'modal prevents background focus');
  // Rendering after a save can replace the launcher's DOM node. Return by stable action/id.
  await page.evaluate(()=>{const old=document.querySelector('[data-action=edit-employee]');old.replaceWith(old.cloneNode(true));});await page.keyboard.press('Escape');assert(await page.locator('#modal').isHidden());assert(await page.locator('[data-action=edit-employee]').first().evaluate(el=>el===document.activeElement));assert(await page.evaluate(()=>!document.querySelector('main.shell').inert&&!document.querySelector('header.topbar').inert));
  // A read-only detail dialog has no input: focus the panel and contain Tab there too.
  await page.locator('[data-tab=month]').click();await page.locator('[data-action=detail]').first().click();await page.waitForFunction(()=>document.activeElement?.classList.contains('modal-panel'));await page.keyboard.press('Tab');assert(await page.locator('#modal .modal-head [data-action=close-modal]').evaluate(el=>el===document.activeElement));await page.keyboard.press('Escape');assert(await page.locator('[data-action=detail]').first().evaluate(el=>el===document.activeElement));
  await page.locator('[data-tab=day]').click();await page.locator('[data-action=add-advance]').first().click();await page.waitForFunction(()=>document.activeElement?.id==='advanceAmount');await inspect('advance-dialog');await page.locator('#modal .modal-head [data-action=close-modal]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('area-ledger-payroll-v1')),before,'browsing cannot mutate payroll');assert.equal(await page.evaluate(()=>localStorage.getItem('site-ledger-v1')),'main-ledger-sentinel');
  await page.locator('[data-tab=month]').click();await page.emulateMedia({media:'print'});assert(await page.locator('#month-view').isVisible());assert.equal(await page.locator('.topbar').evaluate(e=>getComputedStyle(e).display),'none');assert.equal(await page.locator('#month-view .panel').evaluate(e=>getComputedStyle(e).boxShadow),'none');assert.equal(await page.locator('#payrollViewStatus').evaluate(e=>getComputedStyle(e).display),'none');
  await ctx.close();console.log('PASS payroll semantic keyboard tabs, trapped dialogs and focus return, totals, 44px actions, 16px inputs, print and data isolation at',width);
 }
 fs.writeFileSync(path.join(out,'payroll-audit.json'),JSON.stringify(findings,null,2));assert.equal(findings.length,0,'See payroll-audit.json');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
