/* Visual navigation smoke test with synthetic data only.
   Uses real CSS/WebP from repository, no network, no ledger writes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),web=path.join(root,'gateway/public');
const html=fs.readFileSync(path.join(web,'index.html'),'utf8').replace(/\nboot\(\);/,'\n');
const css=fs.readFileSync(path.join(web,'assets/area-ledger-menu-icons.css'),'utf8');
const image=fs.readFileSync(path.join(web,'assets/area-ledger-menu-icons.webp'));
const all=['accounting','contract','house-materials','documents','boq','overview','projects','transactions','due','guarantee','equipment','scaffolding','materials','procurement','schedule'];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  for(const width of [320,375,390,430,768]){
   const ctx=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
   const page=await ctx.newPage();
   await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.hostname!=='ledger-icons.test')return route.abort();
    if(u.pathname==='/')return route.fulfill({status:200,contentType:'text/html;charset=utf-8',body:html});
    if(u.pathname==='/assets/area-ledger-menu-icons.css')return route.fulfill({status:200,contentType:'text/css',body:css});
    if(u.pathname==='/assets/area-ledger-menu-icons.webp')return route.fulfill({status:200,contentType:'image/webp',body:image});
    return route.abort();
   });
   await page.goto('https://ledger-icons.test/',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{S=emptyState();S.ui.wallpaper=false;U.view='home';U.appMenu=true;render();document.querySelector('.area-shortcuts').open=true;});
   await page.waitForFunction(()=>performance.getEntriesByType('resource').some(x=>x.name.includes('area-ledger-menu-icons.webp')),null,{timeout:15000});
   // Existing drawer animation translates the panel off-screen for 180ms.
   // Measure only after the CSS transition finishes, not during its entrance.
   await page.waitForFunction(()=>{const d=document.querySelector('.app-drawer');return d&&d.getAnimations().every(a=>a.playState==='finished');},null,{timeout:3000});
   const state=await page.evaluate(()=>{
    const list=[...document.querySelectorAll('.app-drawer .area-menu-art')],names=new Set(list.map(el=>[...el.classList].find(x=>x.startsWith('area-menu-art--')).replace('area-menu-art--',''))),sprite=getComputedStyle(list[0],'::after');
    const drawer=document.querySelector('.app-drawer'),rect=drawer.getBoundingClientRect();
    return {names:[...names],count:list.length,sprite:sprite.backgroundImage,drawerRight:rect.right,drawerLeft:rect.left,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,shortcuts:[...document.querySelectorAll('.area-shortcuts-grid button')].length};
   });
   assert.equal(state.shortcuts,6);
   assert(state.count>=15,'main navigation and shortcuts must contain icon art');
   for(const icon of all)assert(state.names.includes(icon),'missing artwork '+icon);
   assert(state.sprite.includes('area-ledger-menu-icons.webp'),'real WebP must be loaded via CSS');
   assert(state.scroll<=state.client+1,'page must not overflow '+width+': '+JSON.stringify(state));
   assert(state.drawerRight<=width+2&&state.drawerLeft>=-2,'menu fits device '+width);
   await page.locator('[data-act="menuExpenseShortcut"][data-cat="ค่าเช่าอื่นๆ"]').first().click();
   const nav=await page.evaluate(()=>({view:U.view,cat:U.filter.cat,type:U.filter.type,open:U.appMenu}));
   assert.deepEqual(nav,{view:'list',cat:'ค่าเช่าอื่นๆ',type:'out',open:false},'equipment shortcut routes to existing expense filter');
   const out=path.resolve(process.env.LAYOUT_OUTPUT||path.join(root,'layout-evidence'));
   fs.mkdirSync(out,{recursive:true});
   if(width===390){await page.evaluate(()=>{U.appMenu=true;render();});await page.screenshot({path:path.join(out,'area-ledger-icons-drawer-390.png')});}
   await ctx.close();
  }
  // A missing bitmap must leave labelled navigation and its native SVG usable.
  const fallbackCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const fallbackPage=await fallbackCtx.newPage();let failedImage=false;
  await fallbackPage.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.hostname!=='ledger-icons.test')return route.abort();
   if(u.pathname==='/')return route.fulfill({status:200,contentType:'text/html;charset=utf-8',body:html});
   if(u.pathname==='/assets/area-ledger-menu-icons.css')return route.fulfill({status:200,contentType:'text/css',body:css});
   if(u.pathname.endsWith('.webp'))failedImage=true;
   return route.abort();
  });
  await fallbackPage.goto('https://ledger-icons.test/',{waitUntil:'domcontentloaded'});
  await fallbackPage.evaluate(()=>{S=emptyState();U.view='home';U.appMenu=true;render();});
  const fallback=fallbackPage.locator('.app-drawer .area-menu-art svg').first();
  assert(await fallback.isVisible(),'native SVG remains visible if bitmap cannot load');
  await fallbackPage.locator('.app-drawer-menu [data-act="menuGo"][data-v="projects"]').click();
  assert.equal(await fallbackPage.evaluate(()=>U.view),'projects');
  assert(failedImage,'fallback must exercise a failed image request');
  await fallbackCtx.close();
  console.log('PASS real 15-icon sprite renders and routes on 320/375/390/430/768px');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
