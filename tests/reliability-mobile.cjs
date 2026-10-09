const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const html=fs.readFileSync('gateway/public/index.html','utf8').replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
const out=path.resolve('layout-evidence');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});try{
for(const standalone of [false,true])for(const [width,height] of [[320,640],[375,812],[390,844],[430,932],[844,390]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});await page.route('**/*',r=>r.abort());
 await page.evaluate(standalone=>{Object.defineProperty(navigator,'standalone',{value:standalone,configurable:true});Object.defineProperty(window,'visualViewport',{value:Object.assign(new EventTarget(),{width:innerWidth,height:innerHeight,offsetTop:0,offsetLeft:0,scale:1}),configurable:true});},standalone);
 await page.setContent(html);await page.evaluate(()=>{visualViewport.width=innerWidth;visualViewport.height=innerHeight;visualViewport.dispatchEvent(new Event('resize'));});
 await page.evaluate(()=>{S=emptyState();S.projects=[{id:'p',name:'โครงการทดสอบข้อความภาษาไทยยาวสำหรับจอมือถือ',status:'active'}];U.view='list';U.sheet={kind:'expenseBatch'};U.expenseBatchBusy=false;U.expenseBatch=Array.from({length:11},(_,i)=>({include:true,amount:i?17000:6000,date:'2026-08-04',pid:'p',sub:'รายละเอียดวัสดุและค่าแรงที่ตรวจแล้ว',partner:'',cat:'ค่าแรง',paymentStatus:i?'unpaid':'paid',pay:i?'':'cash',photo:'',sourceRowIndex:i+1,sourceRowCount:11,ocrUncertainFields:[]}));render();});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
 if(width===390)await page.screenshot({path:path.join(out,'v1049-ocr-'+(standalone?'standalone-sim':'browser')+'.png')});
 const field=page.locator('[data-exp-batch="10"][data-k="partner"]');await field.fill('ร้านที่ตรวจแล้ว');
 await page.evaluate(standalone=>{if(!standalone)visualViewport.height=Math.min(360,innerHeight-100);visualViewport.dispatchEvent(new Event('resize'));},standalone);
 await page.waitForTimeout(450);
 const m=await field.evaluate(f=>{const sheet=f.closest('.master-sheet'),r=f.getBoundingClientRect(),sr=sheet.getBoundingClientRect(),bar=sheet.querySelector('.expense-batch-actions').getBoundingClientRect();return {left:sr.left,right:sr.right,viewport:innerWidth,top:r.top,bottom:r.bottom,sheetTop:sr.top,barTop:bar.top,scroll:sheet.scrollTop,width:document.documentElement.scrollWidth,client:document.documentElement.clientWidth};});
 assert(m.left>=-1&&m.right<=m.viewport+1,JSON.stringify({standalone,width,height,m}));assert(m.top>=m.sheetTop-1&&m.bottom<=m.barTop+1,JSON.stringify({standalone,width,height,m}));assert(m.width<=m.client+1);assert.equal(await field.inputValue(),'ร้านที่ตรวจแล้ว');
 if(width===390)await page.screenshot({path:path.join(out,'v1049-ocr-keyboard-'+(standalone?'standalone-sim':'browser')+'.png')});
 await page.evaluate(()=>{U.sheet={kind:'settings'};render();});assert(await page.getByRole('button',{name:'ตรวจเวอร์ชันล่าสุด',exact:true}).count());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
 if(width===390)await page.screenshot({path:path.join(out,'v1049-settings-'+(standalone?'standalone-sim':'browser')+'.png')});
 await page.evaluate(()=>{S.tx=[{id:'legacy',pid:'p',type:'out',amount:54600,date:'2026-09-25',ocrSource:'ai',sourceRowCount:3,partner:'ว/ด/ป รายการ ค่าแรง จำนวน ราคา/หน่วย รวม หมายเหตุ'}];U.sheet={kind:'ocrReviewQueue'};render();});assert(await page.getByRole('button',{name:'สำรองข้อมูลก่อนแก้',exact:true}).count());
 if(width===390)await page.screenshot({path:path.join(out,'v1049-review-queue.png')});await page.close();
}
console.log('PASS v1049 mobile: 5 viewports, browser + standalone simulation, last OCR field above keyboard/actions, settings and review queue');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
