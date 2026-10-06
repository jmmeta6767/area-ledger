/* Synthetic Chromium viewport tests: no physical iPhone or native keyboard claim. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.LAYOUT_OUTPUT||'layout-evidence');fs.mkdirSync(out,{recursive:true});
const before=process.env.CARD_BASELINE?fs.readFileSync(process.env.CARD_BASELINE,'utf8'):cp.execFileSync('git',['show','36fb56792c11297d71965a2dbb8bf0b171efab97:gateway/public/index.html'],{cwd:root,encoding:'utf8',maxBuffer:8e6});
const prepare=s=>s.replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});const results=[];
try{for(const version of ['before','after'])for(const [width,height] of [[320,640],[375,812],[390,844],[430,932],[844,390]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});await page.route('**/*',r=>r.abort());
await page.evaluate(()=>{Object.defineProperty(window,'visualViewport',{configurable:true,value:Object.assign(new EventTarget(),{height:innerHeight,offsetTop:0,scale:1})});});
await page.setContent(prepare(version==='before'?before:fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8')));
await page.evaluate(()=>{S=emptyState();S.ui.wallpaper=false;S.projects=[{id:'p',name:'ก่อสร้างหลังคาคลุมลานเอนกประสงค์ หมู่ที่7 บ้านท่าศาลา',budget:9999999,contract:99999999.99,status:'active'}];S.tx=[{id:'t',pid:'p',type:'out',amount:261776,paid:true,date:'2026-10-06',cat:'ค่าของ'}];S.guarantees=[24750,99839,99999999.99].map((amount,i)=>({id:'g'+i,pid:'p',type:'ประกันสัญญา',amount,holder:'องค์การบริหารส่วนตำบลศรีเมืองชุม',method:'เงินสด/โอน',returned:false}));U.view='guarantees';U.sheet=null;render();});
const cards=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,amounts:[...document.querySelectorAll('.gm-side strong')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,lines:r.getClientRects().length};})}));
if(version==='after'){assert(!cards.overflow);assert(cards.amounts.every(x=>x.lines===1),JSON.stringify(cards));}
if(width===390)await page.screenshot({path:path.join(out,`${version}-guarantees-390.png`),fullPage:true});
await page.evaluate(()=>{U.view='projects';render();});
const grid=await page.locator('.project-hub-glance').first().evaluate(e=>({height:e.getBoundingClientRect().height,columns:getComputedStyle(e).gridTemplateColumns}));
if(version==='after'&&width<=600)assert(grid.height<150,JSON.stringify(grid));
if(width===390)await page.screenshot({path:path.join(out,`${version}-projects-390.png`),fullPage:true});
await page.evaluate(()=>{U.view='profile';U.sheet={kind:'profileEdit'};render();});
const state=await page.evaluate(()=>JSON.stringify(S));await page.locator('#profileBrand').fill('ชื่อที่แก้แต่ยังไม่บันทึก');
await page.evaluate(()=>{visualViewport.height=300;visualViewport.offsetTop=40;visualViewport.dispatchEvent(new Event('resize'));});
const keyboard=await page.evaluate(()=>{const s=document.querySelector('.master-sheet').getBoundingClientRect(),b=document.querySelector('.master-scrim').getBoundingClientRect();return {sheetTop:s.top,sheetBottom:s.bottom,scrimHeight:b.height};});
if(version==='before'&&width===390)assert(keyboard.scrimHeight>300,'Baseline must reproduce layout/visual viewport conflict');
if(version==='after'){
assert(Math.abs(keyboard.scrimHeight-300)<1&&keyboard.sheetTop>=40&&keyboard.sheetBottom<=341,JSON.stringify(keyboard));
for(const selector of ['#profileBrand','#profileTikTok','[data-act="profileSaveCompany"]']){
await page.locator(selector).evaluate(e=>{e.focus();e.scrollIntoView({block:'center',behavior:'instant'});});
assert(await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=40&&r.bottom<=341;}),selector);
}
assert.equal(await page.locator('#profileBrand').inputValue(),'ชื่อที่แก้แต่ยังไม่บันทึก');assert.equal(await page.evaluate(()=>JSON.stringify(S)),state);
await page.setViewportSize({width:height,height:width});await page.evaluate(()=>{visualViewport.height=250;visualViewport.offsetTop=0;visualViewport.dispatchEvent(new Event('resize'));});
assert.equal(await page.locator('#profileBrand').inputValue(),'ชื่อที่แก้แต่ยังไม่บันทึก');await page.setViewportSize({width,height});await page.evaluate(()=>{visualViewport.height=300;visualViewport.offsetTop=40;visualViewport.dispatchEvent(new Event('resize'));});
}
await page.locator('#profileBrand').evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
if(width===390)await page.screenshot({path:path.join(out,`${version}-profile-keyboard-390.png`),clip:{x:0,y:40,width,height:300}});
results.push({version,width,height,cards,grid,keyboard});await page.close();
}fs.writeFileSync(path.join(out,'card-keyboard-results.json'),JSON.stringify(results,null,2));console.log('PASS card and visualViewport keyboard regression, 5 viewports, draft retained, accounting state unchanged');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
