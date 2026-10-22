// Browser emulation, synthetic backup and mocked recognition; no customer data/audio.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),web=path.resolve('gateway/public'),out=path.resolve(process.env.LAYOUT_OUTPUT||'layout-evidence');fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(web,'index.html'),'utf8').replace(/\nboot\(\);/,'\n');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{for(const width of [320,375,390,430,768,1280]){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!=='https://reliability.test')return r.abort();if(u.pathname==='/')return r.fulfill({contentType:'text/html;charset=utf-8',body:html});if(/^\/assets\/[\w.-]+\.(css|webp)$/.test(u.pathname)){const f=path.join(web,u.pathname);return r.fulfill({contentType:f.endsWith('.css')?'text/css':'image/webp',body:fs.readFileSync(f)});}return r.abort();});
  await page.goto('https://reliability.test/');await page.evaluate(()=>{
   S=emptyState();S.ui.wallpaper=false;S.projects=[{id:'p',name:'โครงการเดิมที่ต้องรักษา',status:'active'}];U.view='add';U.draft=newDraft('out','p');
   const incoming=emptyState();incoming.projects=Array.from({length:6},(_,i)=>({id:'p'+i,name:'ข้อมูลสมมติโครงการชื่อยาวสำหรับตรวจหน้าจอ '+i}));incoming.tx=incoming.projects.map((p,i)=>({id:'t'+i,pid:p.id,type:'out',amount:1000,paid:false,date:today(),cat:'ค่าแรง',payments:[{amount:300,date:today(),pay:'transfer'}]}));
   U.rsText=JSON.stringify({backupFormat:2,stateChecksum:backupStateChecksum(incoming),state:incoming});U.sheet={kind:'restore'};localStorage.setItem(KEY,JSON.stringify(S));committedState=localStorage.getItem(KEY);window.originalLedger=JSON.stringify(S);render();
  });
  await page.locator('[data-act=restorePreview]').click();await page.locator('.restore-comparison details').evaluate(e=>e.open=true);
  assert.equal(await page.locator('.restore-comparison li').count(),7);assert(await page.locator('.restore-comparison').textContent().then(t=>t.includes('4,200')));
  await page.locator('[data-act=doRestore]').click();assert.equal(await page.evaluate(()=>JSON.stringify(S)),await page.evaluate(()=>originalLedger));assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),await page.evaluate(()=>originalLedger));
  assert(await page.locator('[data-act=doRestore]').textContent().then(t=>t.includes('ยืนยัน')));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width===390){await page.locator('.restore-comparison').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'reliability-restore-review.png')});}
  if(process.env.AXE_SOURCE&&width===390){await page.addScriptTag({path:process.env.AXE_SOURCE});const violations=await page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return result.violations.map(x=>x.id);});assert.deepEqual(violations,[]);}
  await page.evaluate(()=>{U.sheet=null;U.draft=newDraft('out','p');U.runtimeActionStamps=Object.create(null);window.recognizers=[];window.SpeechRecognition=function(){recognizers.push(this);this.stops=0;this.start=()=>this.onstart();this.stop=()=>{this.stops++;};this.abort=()=>{throw Error('A successful manual stop must not abort');};};render();});
  for(const text of ['ค่าทราย500','แก้ยอดเป็น 700']){
   await page.waitForFunction(()=>Object.values(U.runtimeActionStamps||{}).every(t=>Date.now()-t>800));await page.locator('[data-act=expenseVoiceStart]').click();await page.waitForFunction(()=>U.expenseVoiceState==='listening');
   const previous=await page.locator('#amt').inputValue();await page.evaluate(text=>{const row=[{transcript:text}];row.isFinal=false;recognizers.at(-1).onresult({results:[row]});},text);
   assert.equal(await page.locator('#amt').inputValue(),previous);assert(await page.locator('#expenseVoiceStatus').textContent().then(t=>t.includes(text)));
   await page.locator('[data-act=expenseVoiceStart]').click();assert.equal(await page.evaluate(()=>U.expenseVoiceState),'closing');
   await page.locator('[data-act=save]').click();assert.equal(await page.evaluate(()=>S.tx.length),0,'saving waits for pending speech results');
   await page.evaluate(text=>recognizers.at(-1).onresult({results:[[{transcript:text}]]}),text);assert.equal(await page.locator('#amt').inputValue(),previous);
   await page.evaluate(()=>recognizers.at(-1).onend());await page.waitForFunction(()=>!U.expenseVoiceRecognition&&!U.expenseVoiceEnding);
   assert.equal(await page.evaluate(()=>recognizers.at(-1).stops),1);assert.equal(await page.locator('#amt').inputValue(),text.includes('700')?'700':'500');
  }
  assert.equal(await page.locator('#amt').inputValue(),'700');assert.equal(await page.evaluate(()=>recognizers.length),2);assert.equal(await page.evaluate(()=>S.tx.length),0);
  if(width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'reliability-voice-correction.png')});}
  await page.locator('[data-act=expenseVoiceUndo]').click();assert.equal(await page.locator('#amt').inputValue(),'500');assert.equal(await page.evaluate(()=>S.tx.length),0);
  await page.evaluate(()=>{expenseVoiceStop();U.draft=null;U.sheet={kind:'settings'};render();});assert(await page.locator('.release-builds').textContent().then(t=>t.includes('รุ่นที่กำลังใช้อยู่')));
  console.log('PASS reliability review, original ledger retained, two fresh mic taps/undo and release identity at',width);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
