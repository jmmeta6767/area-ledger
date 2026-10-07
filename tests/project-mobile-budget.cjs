/* Mobile project edit layout and BOQ budget utilization regression. No live ledger data is used. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8')
  .replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
const output=process.env.LAYOUT_OUTPUT||path.join(root,'layout-evidence');
const evidencePrefix=process.env.LAYOUT_EVIDENCE_PREFIX||'project-edit-after';
fs.mkdirSync(output,{recursive:true});

(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  const percentResults=[];
  try{
    for(const [width,height] of [[320,640],[375,812],[390,844],[430,932],[640,360],[844,390]]){
      const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
      await page.route('**/*',r=>r.abort());
      await page.evaluate(()=>{
        const vv=new EventTarget();
        Object.assign(vv,{width:innerWidth,height:innerHeight,offsetLeft:0,offsetTop:0,scale:1});
        Object.defineProperty(window,'visualViewport',{configurable:true,value:vv});
      });
      await page.setContent(html);
      await page.evaluate(()=>{visualViewport.width=innerWidth;visualViewport.height=innerHeight;visualViewport.offsetLeft=0;visualViewport.offsetTop=0;visualViewport.dispatchEvent(new Event('resize'));});
      await page.evaluate(()=>{
        S=emptyState();S.ui.wallpaper=false;
        S.projects=[{id:'mobile-budget',name:'โครงการทดสอบชื่อยาวบนหน้าจอ iPhone',client:'หน่วยงานทดสอบ',location:'ประเทศไทย',contract:495000,budget:900000,status:'active'}];
        S.boq=[
          {id:'boq-a',pid:'mobile-budget',name:'วัสดุทดสอบ',qty:2,unitPrice:150000},
          {id:'boq-b',pid:'mobile-budget',name:'งานทดสอบ',qty:1,unitPrice:100000}
        ];
        S.tx=[{id:'out-a',pid:'mobile-budget',type:'out',cat:'ค่าของ',sub:'วัสดุทดสอบ',amount:100000,date:'2026-10-06'}];
        U.view='projects';U.pid='mobile-budget';U.sheet=null;render();
      });
      const amountCheck=await page.evaluate(()=>({budget:boqSummary('mobile-budget').budget,used:boqSummary('mobile-budget').actual,pct:budgetPct(proj('mobile-budget')),noBoqPct:budgetPct({id:'missing-boq'})}));
      const shown=await page.locator('.project-list-card .project-hub-glance b').first().textContent();
      const usageCopy=await page.locator('.project-list-card .project-budget-glance').innerText();
      percentResults.push({...amountCheck,shown,usageCopy});
      if(width===390&&height===844)await page.screenshot({path:path.join(output,'project-budget-boq-after-390.png'),fullPage:false});

      await page.evaluate(()=>{document.body.style.minHeight='1500px';window.scrollTo(0,0);U.sheet={kind:'proj',id:'mobile-budget'};render();});
      const before=await page.evaluate(()=>({x:scrollX,y:scrollY}));
      const metrics=await page.evaluate(()=>{
        const vv=visualViewport,scrim=document.querySelector('.project-edit-scrim')||document.querySelector('.master-scrim'),sheet=document.querySelector('.project-sheet');
        const sr=scrim.getBoundingClientRect(),r=sheet.getBoundingClientRect(),footer=sheet.querySelector('.project-form-savebar').getBoundingClientRect();
        return {viewport:{left:vv?vv.offsetLeft:0,width:vv?vv.width:innerWidth,top:vv?vv.offsetTop:0,height:vv?vv.height:innerHeight},
          scrim:{left:sr.left,right:sr.right,width:scrim.clientWidth,scrollWidth:scrim.scrollWidth},
          sheet:{left:r.left,right:r.right,width:sheet.clientWidth,scrollWidth:sheet.scrollWidth,footerLeft:footer.left,footerRight:footer.right,footerBottom:footer.bottom},
          document:{left:scrollX,width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},
          inputs:[...sheet.querySelectorAll('input,select,textarea')].map(x=>{const q=x.getBoundingClientRect();return {id:x.id,left:q.left,right:q.right,width:q.width};}),
          overflow:[...sheet.querySelectorAll('*')].map(x=>{const q=x.getBoundingClientRect();return {tag:x.tagName,cls:typeof x.className==='string'?x.className:'',id:x.id,left:q.left,right:q.right,width:q.width,scrollWidth:x.scrollWidth,clientWidth:x.clientWidth};}).filter(x=>x.right>r.right+1||x.left<r.left-1||x.scrollWidth>x.clientWidth+1).slice(0,12)};
      });
      if(width===390&&height===844){
        await page.screenshot({path:path.join(output,`${evidencePrefix}-390.png`),fullPage:false});
        await page.evaluate(()=>{visualViewport.width=300;visualViewport.offsetLeft=90;visualViewport.scale=1.3;visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'));});
        await page.screenshot({path:path.join(output,`${evidencePrefix}-zoom-390.png`),fullPage:false});
        await page.screenshot({path:path.join(output,`${evidencePrefix}-zoom-visible-390.png`),clip:{x:90,y:0,width:300,height:844},fullPage:false});
        const zoom=await page.evaluate(()=>{const scrim=document.querySelector('.project-edit-scrim'),sheet=document.querySelector('.project-sheet'),sr=scrim.getBoundingClientRect(),r=sheet.getBoundingClientRect(),vv=visualViewport;return {visibleLeft:vv.offsetLeft,visibleRight:vv.offsetLeft+vv.width,scrimLeft:sr.left,scrimRight:sr.right,sheetLeft:r.left,sheetRight:r.right,scrollX,documentWidth:document.documentElement.clientWidth,documentScrollWidth:document.documentElement.scrollWidth};});
        assert(zoom.scrimLeft>=zoom.visibleLeft-1&&zoom.scrimRight<=zoom.visibleRight+1&&zoom.sheetLeft>=zoom.visibleLeft-1&&zoom.sheetRight<=zoom.visibleRight+1,`zoomed 300px visual viewport must contain project editor: ${JSON.stringify(zoom)}`);
        assert.equal(zoom.scrollX,0,`project editor must not pan horizontally after viewport zoom: ${JSON.stringify(zoom)}`);
        assert(zoom.documentScrollWidth<=zoom.documentWidth+1,`project editor must not expand the document while viewport is zoomed: ${JSON.stringify(zoom)}`);
      }
      const failures=[];
      if(metrics.scrim.left < metrics.viewport.left-1 || metrics.scrim.right > metrics.viewport.left+metrics.viewport.width+1)failures.push('edit overlay is not aligned to the visible viewport');
      if(metrics.sheet.left < metrics.viewport.left-1 || metrics.sheet.right > metrics.viewport.left+metrics.viewport.width+1)failures.push('edit sheet exceeds the visible viewport');
      if(metrics.sheet.scrollWidth>metrics.sheet.width+1)failures.push('edit sheet content scrolls horizontally');
      if(metrics.sheet.footerLeft<metrics.sheet.left-1||metrics.sheet.footerRight>metrics.sheet.right+1)failures.push('edit action bar escapes the sheet');
      if(metrics.sheet.footerBottom>metrics.viewport.top+metrics.viewport.height+1)failures.push('edit action bar is below the visible viewport');
      if(metrics.document.scrollWidth>metrics.document.width+1)failures.push('document has horizontal overflow');
      if(metrics.inputs.some(x=>x.left<metrics.sheet.left-1||x.right>metrics.sheet.right+1))failures.push('an edit field escapes the sheet');
      assert.deepEqual(failures,[],`${width}x${height}: ${JSON.stringify({failures,metrics})}`);
      assert.equal(before.x,0,`background should not pan while editor is open at ${width}px`);
      await page.evaluate(()=>{U.sheet=null;render();});
      assert.equal(await page.locator('.project-sheet').count(),0);
      assert.equal(await page.evaluate(()=>JSON.stringify(S.tx[0])),JSON.stringify({id:'out-a',pid:'mobile-budget',type:'out',cat:'ค่าของ',sub:'วัสดุทดสอบ',amount:100000,date:'2026-10-06'}),'opening and closing the editor must not alter ledger entries');
      if(width===390&&height===844){
        await page.evaluate(()=>{U.sheet={kind:'profileEdit'};render();});
        const profileMetrics=await page.evaluate(()=>{const sheet=document.querySelector('.profile-editor-sheet'),scrim=sheet.closest('.mobile-editor-scrim'),footer=sheet.querySelector('.profile-editor>.stack').getBoundingClientRect(),sr=sheet.getBoundingClientRect(),scr=scrim.getBoundingClientRect(),cs=getComputedStyle(sheet);return{width:sheet.clientWidth,scrollWidth:sheet.scrollWidth,left:sr.left,right:sr.right,scrimWidth:scrim.clientWidth,scrimLeft:scr.left,scrimRight:scr.right,computedWidth:cs.width,computedMaxWidth:cs.maxWidth,boxSizing:cs.boxSizing,flex:cs.flex,viewportWidth:visualViewport.width,cssViewportWidth:getComputedStyle(document.documentElement).getPropertyValue('--ledger-vvw'),footerBottom:footer.bottom,viewportHeight:visualViewport.height,documentWidth:document.documentElement.clientWidth,documentScrollWidth:document.documentElement.scrollWidth,inputs:[...sheet.querySelectorAll('input:not([type=file]),textarea')].map(x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right};})};});
        await page.screenshot({path:path.join(output,'profile-edit-after-390.png'),fullPage:false});
        assert(profileMetrics.width>=profileMetrics.viewportWidth-1&&profileMetrics.scrollWidth<=profileMetrics.width+1,`profile editor should use a single full-width visual viewport scroll surface: ${JSON.stringify(profileMetrics)}`);
        assert(profileMetrics.inputs.every(x=>x.left>=profileMetrics.left-1&&x.right<=profileMetrics.right+1),'profile edit fields must stay inside the sheet');
        assert(profileMetrics.footerBottom<=profileMetrics.viewportHeight+1,'profile save actions should remain reachable');
        assert(profileMetrics.documentScrollWidth<=profileMetrics.documentWidth+1,'profile editor should not create document overflow');
        await page.locator('#profileTikTok').focus();
        await page.evaluate(()=>{visualViewport.height=420;visualViewport.dispatchEvent(new Event('resize'));syncProjectViewport();});
        await page.waitForTimeout(300);
        const profileKeyboard=await page.evaluate(()=>{const sheet=document.querySelector('.profile-editor-sheet'),field=document.activeElement.getBoundingClientRect(),head=sheet.querySelector('.doc-editor-head').getBoundingClientRect(),footer=sheet.querySelector('.profile-editor>.stack').getBoundingClientRect();return{fieldTop:field.top,fieldBottom:field.bottom,headBottom:head.bottom,footerTop:footer.top,footerBottom:footer.bottom,viewportHeight:visualViewport.height,scrollTop:sheet.scrollTop,documentWidth:document.documentElement.clientWidth,documentScrollWidth:document.documentElement.scrollWidth};});
        await page.screenshot({path:path.join(output,'profile-edit-keyboard-simulated-390.png'),fullPage:false});
        assert(profileKeyboard.fieldTop>=profileKeyboard.headBottom-1&&profileKeyboard.fieldBottom<=profileKeyboard.footerTop+1,`focused profile field must fit between header and save bar with simulated keyboard: ${JSON.stringify(profileKeyboard)}`);
        assert(profileKeyboard.footerBottom<=profileKeyboard.viewportHeight+1,'profile save bar must stay above the simulated keyboard');
        assert(profileKeyboard.documentScrollWidth<=profileKeyboard.documentWidth+1,'profile keyboard viewport should not cause horizontal overflow');
        await page.evaluate(()=>{U.sheet={kind:'feedback'};render();});
        await page.screenshot({path:path.join(output,'feedback-after-390.png'),fullPage:false});
        assert.equal(await page.locator('.feedback-editor-sheet').count(),1);
        assert((await page.locator('.feedback-privacy').innerText()).includes('ไม่แนบยอดเงิน BOQ'));
        await page.locator('#feedbackText').focus();
        await page.evaluate(()=>{visualViewport.height=420;visualViewport.dispatchEvent(new Event('resize'));syncProjectViewport();});
        await page.waitForTimeout(300);
        const feedbackKeyboard=await page.evaluate(()=>{const sheet=document.querySelector('.feedback-editor-sheet'),field=document.activeElement.getBoundingClientRect(),footer=sheet.querySelector('.feedback-editor>.stack').getBoundingClientRect();return{fieldTop:field.top,fieldBottom:field.bottom,footerTop:footer.top,footerBottom:footer.bottom,viewportHeight:visualViewport.height,documentWidth:document.documentElement.clientWidth,documentScrollWidth:document.documentElement.scrollWidth};});
        await page.screenshot({path:path.join(output,'feedback-keyboard-simulated-390.png'),fullPage:false});
        assert(feedbackKeyboard.fieldBottom<=feedbackKeyboard.footerTop+1,`feedback details must remain above its save bar: ${JSON.stringify(feedbackKeyboard)}`);
        assert(feedbackKeyboard.footerBottom<=feedbackKeyboard.viewportHeight+1,'feedback actions must stay above the simulated keyboard');
        assert(feedbackKeyboard.documentScrollWidth<=feedbackKeyboard.documentWidth+1,'feedback keyboard viewport should not cause horizontal overflow');
      }
      await page.close();
    }
    assert(percentResults.every(x=>x.budget===400000&&x.used===100000&&x.pct===0.25&&x.noBoqPct===0&&x.shown==='25%'&&x.usageCopy.includes('100,000')&&x.usageCopy.includes('400,000')),`utilization must show expense / BOQ values using the same base: ${JSON.stringify(percentResults)}`);
    console.log('PASS project utilization shows expense / BOQ denominator (25%); project and profile edit sheets fit portrait 320/375/390/430 and landscape 640x360/844x390, including simulated keyboard and zoomed visual viewports. Feedback fields remain visible above simulated keyboard.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

