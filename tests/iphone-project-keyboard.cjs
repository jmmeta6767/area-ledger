/* Synthetic iPhone keyboard test for editing a project; no live ledger data. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8').replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});try{
for(const [width,height,kb] of [[320,640,270],[375,812,300],[390,844,300],[430,932,320]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});await page.route('**/*',r=>r.abort());await page.evaluate(()=>{Object.defineProperty(window,'visualViewport',{configurable:true,value:Object.assign(new EventTarget(),{height:innerHeight,offsetTop:0,scale:1})});});await page.setContent(html);
 await page.evaluate(()=>{S=emptyState();S.ui.wallpaper=false;S.projects=[{id:'p',name:'โครงการทดสอบการพิมพ์บนจอ iPhone',contract:329236.8,budget:300000,status:'active'}];U.view='projects';U.pid='p';U.sheet={kind:'proj',id:'p'};render();});
 const original=await page.evaluate(()=>JSON.stringify(S.projects));
 await page.locator('#pn').fill('แก้ชื่อโครงการที่ยังไม่บันทึก');await page.evaluate(kb=>{visualViewport.height=kb;visualViewport.dispatchEvent(new Event('resize'));},kb);
 await page.waitForFunction(()=>Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--ledger-vvh'))-visualViewport.height)<1);
 await page.locator('#ploc').focus();await page.waitForTimeout(220);
 const state=await page.evaluate(()=>{const f=document.activeElement,s=f.closest('.project-sheet'),save=s.querySelector('.project-form-savebar'),head=s.querySelector('.project-form-head'),r=f.getBoundingClientRect(),sr=s.getBoundingClientRect(),fr=save.getBoundingClientRect(),hr=head.getBoundingClientRect();return {value:f.value,scrollTop:s.scrollTop,inputTop:r.top,inputBottom:r.bottom,headerBottom:hr.bottom,saveTop:fr.top,saveBottom:fr.bottom,visibleBottom:Math.min(sr.bottom,visualViewport.offsetTop+visualViewport.height)-fr.height-16,viewHeight:visualViewport.height,documentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};});
 assert(state.inputTop>=state.headerBottom-1&&state.inputBottom<=state.visibleBottom+1,JSON.stringify(state));assert(state.documentWidth<=state.clientWidth+1,JSON.stringify(state));
 assert(state.saveBottom<=kb+1,JSON.stringify(state));assert.equal(await page.evaluate(()=>JSON.stringify(S.projects)),original);assert.equal(await page.locator('#pn').inputValue(),'แก้ชื่อโครงการที่ยังไม่บันทึก');
 if(width===390)await page.screenshot({path:path.join(root,'layout-evidence','project-edit-keyboard-after-390.png'),fullPage:false});
 await page.close();
}
console.log('PASS project editor keeps focused fields between the sticky heading and save actions at 320/375/390/430 CSS px; edits remain drafts');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

