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
   await page.locator(`[data-tab="${tab}"]`).click();await page.evaluate(()=>scrollTo(0,0));assert(await page.locator('#'+tab+'-view').isVisible());await inspect(tab);
   if(tab==='month')assert((await page.locator('#monthlyBody tr').first().innerText()).includes('350'),'650 earned minus 300 advanced remains 350');
  }
  await page.locator('[data-tab=people]').click();await page.locator('[data-action=edit-employee]').first().click();assert(await page.locator('#modal').isVisible());await inspect('employee-dialog');await page.locator('#modal .modal-head [data-action=close-modal]').click();
  await page.locator('[data-tab=day]').click();await page.locator('[data-action=add-advance]').first().click();await inspect('advance-dialog');await page.locator('#modal .modal-head [data-action=close-modal]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('area-ledger-payroll-v1')),before,'browsing cannot mutate payroll');assert.equal(await page.evaluate(()=>localStorage.getItem('site-ledger-v1')),'main-ledger-sentinel');
  await page.locator('[data-tab=month]').click();await page.emulateMedia({media:'print'});assert(await page.locator('#month-view').isVisible());assert.equal(await page.locator('.topbar').evaluate(e=>getComputedStyle(e).display),'none');assert.equal(await page.locator('#month-view .panel').evaluate(e=>getComputedStyle(e).boxShadow),'none');
  await ctx.close();console.log('PASS payroll four tabs, dialogs, totals, 44px actions, 16px inputs, print and data isolation at',width);
 }
 fs.writeFileSync(path.join(out,'payroll-audit.json'),JSON.stringify(findings,null,2));assert.equal(findings.length,0,'See payroll-audit.json');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
