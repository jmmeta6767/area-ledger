/* Synthetic iPhone standalone keyboard test. No physical keyboard or ledger persistence is used. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8').replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  for(const [width,height] of [[320,640],[375,812],[390,844],[430,932],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
   await page.route('**/*',r=>r.abort());
   await page.evaluate(({width,height})=>{
    Object.defineProperty(window,'visualViewport',{configurable:true,value:Object.assign(new EventTarget(),{height,width,offsetTop:0,offsetLeft:0,scale:1})});
    Object.defineProperty(navigator,'standalone',{configurable:true,value:true});
   },{width,height});
   await page.setContent(html);
   await page.evaluate(()=>{
    S=emptyState();S.ui.wallpaper=false;S.projects=[{id:'existing',name:'โครงการเดิม',contract:100000,budget:80000,status:'active'}];
    U.view='projects';U.sheet={kind:'proj',id:null};render();
    window.readGeometry=function(field){
     const sheet=field.closest('.project-sheet'),scrim=document.querySelector('.project-edit-scrim'),head=sheet.querySelector('.project-form-head'),save=sheet.querySelector('.project-form-savebar');
     const r=field.getBoundingClientRect(),sr=sheet.getBoundingClientRect(),cr=scrim.getBoundingClientRect(),hr=head.getBoundingClientRect(),fr=save.getBoundingClientRect();
     return {fieldTop:r.top,fieldBottom:r.bottom,headerBottom:hr.bottom,saveTop:fr.top,saveBottom:fr.bottom,sheetTop:sr.top,sheetBottom:sr.bottom,
      scrimTop:cr.top,scrimBottom:cr.bottom,viewportTop:visualViewport.offsetTop,viewportBottom:visualViewport.offsetTop+parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ledger-vvh')),
      effectiveHeight:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ledger-vvh')),documentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
      saveButtons:[...save.querySelectorAll('button')].map(b=>{const q=b.getBoundingClientRect();return {width:q.width,height:q.height};})};
    };
   });
   assert((await page.locator('.project-form-head h3').innerText()).includes('เพิ่มโครงการ'));
   const before=await page.evaluate(()=>JSON.stringify(S.projects));
   const fullHeight=height;
   await page.locator('#pn').fill('ร่างชื่อโครงการที่ยังไม่บันทึก');
   await page.waitForTimeout(450);
   const first=await page.evaluate(()=>readGeometry(document.activeElement));
   assert(first.effectiveHeight<fullHeight-140,`standalone fallback did not reserve keyboard area: ${JSON.stringify(first)}`);
   assertVisible(first);
   assert(first.headerBottom<first.saveTop,JSON.stringify(first));
   assert(first.saveBottom<=first.viewportBottom+1,JSON.stringify(first));
   assert(first.sheetTop>=first.viewportTop-1&&first.sheetBottom<=first.viewportBottom+1,JSON.stringify(first));
   assert(first.documentWidth<=first.clientWidth+1,JSON.stringify(first));
   assert(first.saveButtons.every(b=>b.width>=44&&b.height>=44),JSON.stringify(first));
   if(width===390)await page.screenshot({path:path.join(root,'layout-evidence','project-create-keyboard-after-390.png')});
   await page.locator('#ploc').focus();await page.waitForTimeout(450);
   assertVisible(await page.evaluate(()=>readGeometry(document.activeElement)));
   await page.evaluate(()=>{document.querySelectorAll('.project-form-fold').forEach(d=>d.open=true);});
   await page.locator('#pdel').focus();await page.waitForTimeout(450);
   const last=await page.evaluate(()=>readGeometry(document.activeElement));assertVisible(last);
   assert(last.saveBottom<=last.viewportBottom+1,JSON.stringify(last));
   assert.equal(await page.locator('#pn').inputValue(),'ร่างชื่อโครงการที่ยังไม่บันทึก');
   assert.equal(await page.evaluate(()=>JSON.stringify(S.projects)),before,'opening/focusing the form must not auto-save a draft');
   await page.close();
  }
  console.log('PASS standalone project-create keyboard fallback, focused first/middle/last fields, 44px save controls, no horizontal overflow, and no draft auto-save at 320/375/390/430 portrait plus 844 landscape CSS px');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

function assertVisible(s){
 assert(s.fieldTop>=s.headerBottom-1&&s.fieldBottom<=s.saveTop+1,JSON.stringify(s));
 assert(s.fieldTop>=s.viewportTop-1&&s.fieldBottom<=s.viewportBottom+1,JSON.stringify(s));
}

