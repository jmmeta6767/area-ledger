/* Isolated app UI catalogue. Synthetic ledger only; external services are blocked. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=fs.readFileSync('gateway/public/index.html','utf8');
const html=source.replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
const kinds=[...new Set([...source.slice(source.indexOf('function sheetHtml()'),source.indexOf('function appMenuHtml()')).matchAll(/sh\.kind==='([^']+)'/g)].map(x=>x[1]))];
const out=path.resolve(process.env.LAYOUT_OUTPUT||'layout-evidence');fs.mkdirSync(out,{recursive:true});

function seed(){
 S=emptyState();S.ui.wallpaper=false;S.business.legalName='บริษัท ตัวอย่างก่อสร้าง จำกัด';S.business.taxId='0000000000000';S.updatedAt=Date.parse('2026-10-18T03:00:00Z');
 S.projects=[{id:'p',name:'โครงการก่อสร้างอาคารทดสอบสำหรับตรวจข้อความไทยยาว',client:'ลูกค้าตัวอย่าง',location:'เชียงราย',status:'active',contract:90000,budget:60000,startDate:today(),endDate:addDays(60)}, {id:'q',name:'โครงการทดสอบอีกแห่ง',status:'active',contract:50000}];
 S.tx=[{id:'t',pid:'p',type:'out',amount:54000,date:today(),cat:'ค่าแรง',sub:'ค่าแรงงานหลังคา',partner:'ช่างตัวอย่าง',paid:false,pay:'transfer',payments:[{id:'pay1',date:today(),amount:12000,pay:'transfer'}]}, {id:'i',pid:'p',type:'in',amount:90000,date:today(),cat:'รับเงินค่างวดงาน',sub:'รับเงินงวดงาน',partner:'ลูกค้าตัวอย่าง',paid:true,pay:'transfer'}];
 S.boq=[{id:'b',pid:'p',name:'งานโครงหลังคา',category:'ค่าแรง',qty:10,unit:'งาน',unitPrice:5400,sectionCode:'',sectionName:'งานหลังคา',sectionSource:'inferred'}];
 S.guarantees=[{id:'g',pid:'p',type:'ประกันผลงาน',amount:4500,method:'หนังสือค้ำประกัน',holder:'ผู้ว่าจ้าง',paidDate:today(),dueDate:addDays(7),returned:false}];
 S.loans=[{id:'l',kind:'payable',party:'ผู้ให้กู้ทดสอบ',principal:10000,date:today(),dueDate:addDays(30),payments:[]}];
 const item={description:'งานทดสอบ',qty:1,unit:'งาน',unitPrice:90000,discount:0};S.quotes=[{id:'quote',pid:'p',no:'Q-TEST',date:today(),customer:'ลูกค้าตัวอย่าง',items:[item]}];S.bills=[{id:'bill',pid:'p',no:'B-TEST',date:today(),customer:'ลูกค้าตัวอย่าง',items:[item]}];S.receipts=[{id:'receipt',pid:'p',no:'R-TEST',date:today(),customer:'ลูกค้าตัวอย่าง',items:[item]}];
 U.view='home';U.sheet=null;U.appMenu=false;U.homePid='p';U.pid='p';U.boqProjectPid='p';U.docProjectPid='p';U.dueProjectPid='p';U.guaranteeProjectPid='p';U.docListKind='bill';U.docKind='bill';U.docId='bill';U.month=today().slice(0,7);U.draft=newDraft('out','p');
 localStorage.setItem(KEY,JSON.stringify(S));committedState=localStorage.getItem(KEY);
 window.fixtureLedger=JSON.stringify({projects:S.projects,tx:S.tx,boq:S.boq,guarantees:S.guarantees,loans:S.loans});
}
function sheetState(kind){
 const ids={tx:'t',apPay:'t',dueEdit:'t',billPay:'bill',loanEdit:'l',loanDetail:'l',loanPayment:'l',guarantee:'g',boq:'b',proj:'p',quote:'quote',bizdoc:'bill'};
 U.view='home';U.appMenu=false;U.sheet={kind,id:ids[kind]||'',pid:'p',loanKind:'payable',docKind:'bill',rows:[],items:[]};
 if(kind==='expenseBatch')U.expenseBatch=expenseBatchItemsFromResult({amount:6430,date:today(),cat:'ค่าของ',sub:'ทราย',partner:'ร้านตัวอย่าง',confidence:.99,source:'local'},'data:image/png;base64,iVBORw0KGgo=','sample.png','p','transfer','default');
 if(kind==='googleWorkspace')U.googleWorkspace={loading:false,status:{configured:true,connected:true,email:'qa@example.test',project:{sheetUrl:'https://docs.google.com/spreadsheets/d/qa',folderUrl:'https://drive.google.com/drive/folders/qa'}}};
 render();document.querySelectorAll('.master-sheet details').forEach(d=>{d.open=true;});scrollTo(0,0);
}
async function inspect(page,label,width,axe){
 const layout=await page.evaluate(()=>{const root=document.querySelector('.master-sheet')||document.querySelector('main');return {overflow:document.documentElement.scrollWidth>innerWidth+1,sheetOverflow:!!root&&root.scrollWidth>root.clientWidth+1,unlabelled:[...root.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e=>e.getClientRects().length&&!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&e.type!=='button').map(e=>({id:e.id,placeholder:e.placeholder,type:e.type})),headings:[...document.querySelectorAll('h1,h2,h3')].filter(e=>e.getClientRects().length&&!e.closest('[inert]')).map(e=>e.textContent),actions:[...new Set([...document.querySelectorAll('[data-act]')].filter(e=>e.getClientRects().length&&!e.closest('[inert]')).map(e=>e.dataset.act))]};});
 const result={label,width,...layout};
 if(axe){result.violations=await page.evaluate(async()=>{const a=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}));});}
 return result;
}
async function workflowChecks(page,width){
 const waitAction=()=>page.waitForFunction(()=>Object.values(U.runtimeActionStamps||{}).every(t=>Date.now()-t>800));
 await page.evaluate(()=>{U.view='projects';U.sheet={kind:'proj'};render();});
 await page.locator('[data-act=saveProj]').click();assert(await page.locator('#system-feedback').isVisible());assert.equal(await page.locator('#pn').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('#pn').evaluate(e=>document.activeElement===e),true);
 await page.locator('#pn').fill('ร่างชื่อโครงการสำหรับทดสอบ');assert.equal(await page.locator('#system-feedback').count(),0);assert.equal(await page.evaluate(()=>S.projects.length),2);
 await page.evaluate(()=>{U.sheet={kind:'boq',pid:'p'};render();});await page.locator('#bqname').fill('รายการ BOQ ทดสอบ');await page.locator('#bqqty').fill('0');await page.locator('[data-act=saveBoq]').click();assert.equal(await page.locator('#bqqty').getAttribute('aria-invalid'),'true');assert.equal(await page.evaluate(()=>S.boq.length),1);
 await page.locator('#bqqty').fill('2');await page.locator('#bqprice').fill('500');await waitAction();await page.locator('[data-act=saveBoq]').click();assert.equal(await page.evaluate(()=>S.boq.length),2);assert.equal(await page.evaluate(()=>S.boq[1].qty*S.boq[1].unitPrice),1000);
 await page.evaluate(()=>{U.sheet={kind:'billPay',id:'bill'};render();});await page.locator('#payAmount').fill('90001');await page.locator('[data-act=saveBillPayment]').click();assert.equal(await page.locator('#payAmount').getAttribute('aria-invalid'),'true');assert.equal(await page.evaluate(()=>S.receipts.length),1);
 await page.locator('#payAmount').fill('1000');await waitAction();await page.locator('[data-act=saveBillPayment]').click();assert.equal(await page.evaluate(()=>billPaymentSummary(S.bills[0]).paid),1000);assert.equal(await page.evaluate(()=>S.receipts.filter(r=>r.sourceId==='bill').length),1);
 await page.evaluate(()=>{U.view='project';U.sheet={kind:'apPay',id:'t'};render();});await page.locator('#apPayAmount').fill('43000');await page.locator('[data-act=apPaySave]').click();assert.equal(await page.locator('#apPayAmount').getAttribute('aria-invalid'),'true');assert.equal(await page.evaluate(()=>txPaidNet(S.tx.find(t=>t.id==='t'))),12000);
 await page.locator('#apPayAmount').fill('5000');await waitAction();await page.locator('[data-act=apPaySave]').click();assert.equal(await page.evaluate(()=>txPaidNet(S.tx.find(t=>t.id==='t'))),17000);assert.equal(await page.evaluate(()=>S.tx.find(t=>t.id==='t').amount),54000);assert.equal(await page.evaluate(()=>S.tx.filter(t=>t.id==='t').length),1);
 await page.evaluate(()=>{U.view='profile';U.sheet={kind:'settings'};render();document.querySelectorAll('.master-sheet details').forEach(d=>d.open=true);});const txBefore=await page.evaluate(()=>JSON.stringify(S.tx));await page.locator('#bnk').fill('บัญชีทดสอบจากข้อมูลผู้ใช้');await page.locator('[data-act=saveOpen]').click();assert.equal(await page.evaluate(()=>S.bank),'บัญชีทดสอบจากข้อมูลผู้ใช้');assert.equal(await page.evaluate(()=>JSON.stringify(S.tx)),txBefore);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(KEY)).bank),'บัญชีทดสอบจากข้อมูลผู้ใช้');
 await page.evaluate(()=>{U.view='quoteprint';U.docKind='bill';U.docId='bill';U.sheet=null;render();});const total=await page.evaluate(()=>docCalc(S.bills[0]).total);assert.equal(total,90000);assert(await page.locator('.system-document-toolbar [data-act=downloadDocPdf]').isVisible());assert.equal(await page.evaluate(()=>document.querySelector('.system-document-preview').scrollWidth<=document.querySelector('.system-document-preview').clientWidth+1),true);
 await page.locator('[data-system-document-scale]').click();assert.equal(await page.locator('[data-system-document-scale]').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.locator('[data-system-document-scale]').click();assert.equal(await page.evaluate(()=>docCalc(S.bills[0]).total),total);
 if(width===390){const pdf=await page.pdf({path:path.join(out,'synthetic-billing-preview.pdf'),format:'A4',printBackground:true});assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,1,'short document should print on one A4 page');await page.screenshot({path:path.join(out,'system-document-fit.png')});}
 console.log('PASS workflows, inline validation, BOQ save, AR/AP payments, settings, document zoom and A4 at',width);
}
(async()=>{const origin='http://ledger.test';
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});const results=[];
 try{for(const width of (process.env.QA_WIDTHS||'320,375,390,430,768,1280').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin)?r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}):r.abort());await page.goto(origin);await page.evaluate(seed);
  const axe=!!process.env.AXE_SOURCE;if(axe)await page.addScriptTag({path:process.env.AXE_SOURCE});
  for(const view of ['home','profile','list','add','projects','project','boq','due','guarantees','report','docs','procurement','doclist','print','quoteprint']){
   await page.evaluate(v=>{U.view=v;U.sheet=null;render();document.querySelectorAll('main details').forEach(d=>{d.open=true;});scrollTo(0,0);},view);results.push(await inspect(page,'view:'+view,width,axe&&width===390));
   if(width===1280){const shell=await page.locator('#app').boundingBox(),client=await page.evaluate(()=>document.body.getBoundingClientRect().width);assert(Math.abs(shell.width-client)<2,view+' full desktop shell '+JSON.stringify({shell,client}));if(view==='add'){const form=await page.locator('main').boundingBox();assert(form.width>=640&&form.width<=720,'desktop entry width');assert(Math.abs(form.x+form.width/2-client/2)<2,'desktop entry centered');}}if(width===390){await page.screenshot({path:path.join(out,'system-'+view+'.png')});if(['add','profile','boq','report'].includes(view)){await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.screenshot({path:path.join(out,'system-'+view+'-bottom.png')});}}if(width===1280&&['home','add','projects','report'].includes(view))await page.screenshot({path:path.join(out,'system-'+view+'-desktop.png')});
  }
  for(const kind of kinds){
   try{await page.evaluate(sheetState,kind);const count=await page.locator('.master-sheet').count();if(!count){results.push({label:'sheet:'+kind,width,missing:true});continue;}results.push(await inspect(page,'sheet:'+kind,width,axe&&width===390));if(width===390&&['settings','quote','boq','accounting','googleWorkspace','backup','profileEdit'].includes(kind))await page.screenshot({path:path.join(out,'system-'+kind+'.png')});if(width===390){for(let n=0;n<3;n++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('.master-sheet')),true,kind+' keyboard stays in dialog');}if(['quote','settings','googleWorkspace','manualJournal'].includes(kind)){await page.locator('.master-sheet').evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:path.join(out,'system-'+kind+'-bottom.png')});}await page.keyboard.press('Escape');assert.equal(await page.locator('.master-sheet').count(),0,kind+' closes with Escape');}}
   catch(error){results.push({label:'sheet:'+kind,width,error:error.message.split('\n').slice(0,3).join(' ')});}
   fs.writeFileSync(path.join(out,'system-audit.json'),JSON.stringify(results,null,2));
  }
  assert.equal(await page.evaluate(()=>JSON.stringify({projects:S.projects,tx:S.tx,boq:S.boq,guarantees:S.guarantees,loans:S.loans})),await page.evaluate(()=>window.fixtureLedger),'UI catalogue must not change financial collections');
  await workflowChecks(page,width);
  await context.close();console.log('AUDITED',width,'views 15, sheets',kinds.length);
 }
 const known=[...source.matchAll(/\ba===['"]([^'"]+)['"]/g)].map(x=>x[1]),actions=[...new Set(results.flatMap(x=>x.actions||[]))];assert.deepEqual(actions.filter(x=>!known.includes(x)),[],'every rendered action must retain its original handler');console.log('BOUND ACTIONS',actions.length);
 const findings=results.filter(x=>x.overflow||x.sheetOverflow||x.error||x.missing||x.unlabelled?.length||x.violations?.length);console.log('FINDINGS',findings.length);for(const f of findings)console.log(f.label,f.width,JSON.stringify({overflow:f.overflow,sheetOverflow:f.sheetOverflow,error:f.error,missing:f.missing,labels:f.unlabelled?.length,axe:f.violations?.map(v=>v.id+':'+v.nodes.length)}));
 if(!process.env.AUDIT_ONLY)assert.equal(findings.length,0,'See system-audit.json');
 }finally{fs.writeFileSync(path.join(out,'system-audit.json'),JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
