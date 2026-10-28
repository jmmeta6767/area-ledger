/* Isolated settings/backup interactions. Synthetic keys only; all remote requests blocked. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {fixtureRoute}=require('./helpers/ui-fixture-assets.cjs');
const source=fs.readFileSync('gateway/public/index.html','utf8');
const html=source.replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\nboot\(\);/,'\n');
const origin='https://sheet-drafts.test';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();
  await page.route('**/*',fixtureRoute(origin,html));
  await page.goto(origin);
  await page.evaluate(()=>{
   S=emptyState();S.projects=[{id:'p',name:'โครงการจำลอง'}];S.tx=[{id:'t',pid:'p',type:'out',amount:1000,date:today(),cat:'ค่าของ',sub:'ทราย',paid:false}];
   S.business.legalName='กิจการเดิม';S.bank='บัญชีเดิม';S.opening=100;S.openCash=20;
   localStorage.setItem(KEY,JSON.stringify(S));committedState=localStorage.getItem(KEY);
   U.view='home';U.sheet={kind:'settings'};render();window.fixtureTransactions=JSON.stringify(S.tx);
  });
  const expand=()=>page.evaluate(()=>document.querySelectorAll('.settings-group').forEach(el=>el.open=true));
  const click=async selector=>{await page.evaluate(()=>U.runtimeActionStamps=Object.create(null));await page.locator(selector).click();};
  await expand();
  await page.locator('#blegal').fill('กิจการที่กำลังแก้');await page.locator('#bnk').fill('บัญชีที่กำลังแก้');await page.locator('#op').fill('1250');await page.locator('#opc').fill('75');await page.locator('#baddr').fill('ที่อยู่ร่าง');
  for(const selector of ['[data-act=bizType][data-v="บริษัท"]','[data-act=bizVat][data-v="1"]','[data-act=viewMode][data-v=desktop]','[data-act=wallpaper][data-v="0"]']){
   await expand();await click(selector);
   assert.equal(await page.locator('#blegal').inputValue(),'กิจการที่กำลังแก้');assert.equal(await page.locator('#bnk').inputValue(),'บัญชีที่กำลังแก้');assert.equal(await page.locator('#op').inputValue(),'1250');assert.equal(await page.locator('#baddr').inputValue(),'ที่อยู่ร่าง');
   assert.deepEqual(await page.evaluate(()=>[S.business.legalName,S.bank,S.opening,S.openCash]),['กิจการเดิม','บัญชีเดิม',100,20]);
   assert.equal(await page.evaluate(()=>JSON.stringify(S.tx)),await page.evaluate(()=>window.fixtureTransactions));
   assert.equal(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem(KEY)).business).includes('กำลังแก้')),false,'UI drafts cannot enter stored business data before Save');
  }
  await expand();await click('[data-act=wallpaper][data-v="1"]');
  assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).backgroundImage),'none','enabled wallpaper remains visible under the shared visual layer');
  await expand();await click('[data-act=wallpaper][data-v="0"]');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundImage),'none','disabled wallpaper uses the neutral workspace background');
  assert.equal(await page.locator('#blegal').inputValue(),'กิจการที่กำลังแก้');
  await click('.settings-save-stack [data-act=saveOpen]');
  assert.deepEqual(await page.evaluate(()=>[S.business.legalName,S.bank,S.opening,S.openCash]),['กิจการที่กำลังแก้','บัญชีที่กำลังแก้',1250,75]);
  assert.equal(await page.evaluate(()=>U.settingsFormDraft),null);assert.equal(await page.evaluate(()=>JSON.stringify(S.tx)),await page.evaluate(()=>window.fixtureTransactions));
  console.log('PASS settings edits survive four immediate toggles; only the existing Save commits fields');

  await page.evaluate(()=>{U.sheet={kind:'settings'};render();});await page.locator('#blegal').fill('ร่างที่จะยกเลิก');
  await click('.system-dialog-header [data-act=closeSheet]');assert.equal(await page.evaluate(()=>U.settingsFormDraft),null);
  await page.evaluate(()=>{U.sheet={kind:'settings'};render();});assert.equal(await page.locator('#blegal').inputValue(),'กิจการที่กำลังแก้');
  await page.locator('#blegal').fill('ร่างก่อน Escape');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>U.settingsFormDraft),null);
  await page.evaluate(()=>{U.sheet={kind:'settings'};render();});assert.equal(await page.locator('#blegal').inputValue(),'กิจการที่กำลังแก้');
  console.log('PASS Close and Escape clear settings drafts before a fresh sheet session');

  await page.evaluate(()=>{
   localStorage.setItem(CLOUD_KEY_NAME,'a'.repeat(43));U.sheet={kind:'backup'};render();window.remoteCalls=0;
   window.fetch=()=>{window.remoteCalls++;throw Error('Remote access forbidden in this fixture');};
  });
  await page.locator('#cloudKeyImport').evaluate(el=>el.closest('details').open=true);await page.locator('#cloudKeyImport').fill('b'.repeat(43));
  await click('[data-act=cloudUseKey]');assert.equal(await page.locator('#cloudKeyImport').inputValue(),'b'.repeat(43));assert.equal(await page.evaluate(()=>localStorage.getItem(CLOUD_KEY_NAME)), 'a'.repeat(43));
  await page.locator('#cloudKeyImport').evaluate(el=>el.closest('details').open=true);await page.locator('#cloudKeyImport').fill('c'.repeat(43));await click('[data-act=cloudUseKey]');
  assert.equal(await page.evaluate(()=>localStorage.getItem(CLOUD_KEY_NAME)),'a'.repeat(43),'changing the pending key requires a new confirmation');
  await page.locator('#cloudKeyImport').evaluate(el=>el.closest('details').open=true);await click('[data-act=cloudUseKey]');
  assert.equal(await page.evaluate(()=>localStorage.getItem(CLOUD_KEY_NAME)),'c'.repeat(43));assert.equal(await page.evaluate(()=>U.cloudKeyImportDraft),null);assert.equal(await page.locator('#cloudKeyImport').inputValue(),'');assert.equal(await page.evaluate(()=>window.remoteCalls),0);
  await page.locator('#cloudKeyImport').evaluate(el=>el.closest('details').open=true);await page.locator('#cloudKeyImport').fill('d'.repeat(43));await click('[data-act=cloudUseKey]');await click('.system-dialog-header [data-act=closeSheet]');
  assert.equal(await page.evaluate(()=>U.cloudKeyImportDraft),null);await page.evaluate(()=>{U.sheet={kind:'backup'};render();});assert.equal(await page.locator('#cloudKeyImport').inputValue(),'');
  assert.equal(await page.evaluate(()=>localStorage.getItem(CLOUD_KEY_NAME)),'c'.repeat(43));assert.equal(await page.evaluate(()=>window.remoteCalls),0);
  console.log('PASS recovery-key confirmation retains only the current UI draft, binds both taps, clears on success/close, and makes no remote call');

  for(const kind of ['quote','bizdoc']){
   await page.evaluate(kind=>{U.sheet={kind,docKind:'bill',pid:'p'};render();},kind);
   assert.equal(await page.locator('.system-dialog-header [data-act=closeSheet]').count(),1);
   assert.equal(await page.locator('.doc-editor-save [data-act=closeSheet]').count(),1,'footer Cancel must remain in its action bar');
   assert.equal(await page.locator('.doc-editor-save .primary').count(),1);assert(await page.locator('.doc-editor-save [data-act=closeSheet]').isVisible());
   await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('.master-sheet')));
   await page.keyboard.press('Escape');assert.equal(await page.locator('.master-sheet').count(),0);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(S.tx)),await page.evaluate(()=>window.fixtureTransactions));
  console.log('PASS document dialogs keep independent header Close, footer Cancel/Save, keyboard focus and Escape');
  await page.evaluate(()=>{
   U.view='profile';U.sheet={kind:'backup'};U.portableBackupFeedback=null;S.lastBackup=0;
   localStorage.setItem(KEY,JSON.stringify(S));committedState=localStorage.getItem(KEY);
   window.backupCalls=0;window.originalPortable=backupPortableJson;
   saveFile=async()=>{window.backupCalls++;return new Promise(resolve=>window.backupRelease=resolve);};render();
  });
  assert(await page.getByRole('heading',{name:'1. สำรองลงเครื่อง',exact:true}).isVisible());
  assert(await page.getByRole('heading',{name:'2. ซิงค์คลาวด์',exact:true}).isVisible());
  assert(await page.getByRole('heading',{name:'3. กู้คืนข้อมูล',exact:true}).isVisible());
  await click('[data-act=backupFile]');await page.waitForFunction(()=>U.portableBackupBusy&&!!window.backupRelease);
  for(const action of ['backupFile','copyBk']){assert(await page.locator('[data-act='+action+']').isDisabled());assert.equal(await page.locator('[data-act='+action+']').getAttribute('aria-busy'),'true');}
  assert.equal(await page.locator('#backupLocalStatus').getAttribute('data-tone'),'pending');
  assert.equal(await page.evaluate(()=>backupPortableAction('download')),false);assert.equal(await page.evaluate(()=>backupCalls),1);
  await page.evaluate(()=>backupRelease(false));await page.waitForFunction(()=>!U.portableBackupBusy);
  assert.equal(await page.locator('#backupLocalStatus').getAttribute('data-tone'),'warning');
  assert.equal(await page.evaluate(()=>S.lastBackup),0);assert(await page.locator('[data-act=backupFile]').isEnabled());assert.equal(await page.locator('[data-act=backupFile]').getAttribute('aria-busy'),null);
  await page.evaluate(()=>{backupPortableJson=async()=>{throw Error('Synthetic incomplete evidence');};});
  await click('[data-act=backupFile]');await page.waitForFunction(()=>!U.portableBackupBusy&&U.portableBackupFeedback?.tone==='error');
  assert.equal(await page.locator('#backupLocalStatus').getAttribute('data-tone'),'error');assert.equal(await page.evaluate(()=>S.lastBackup),0);assert.equal(await page.evaluate(()=>backupCalls),1);
  await page.evaluate(()=>{backupPortableJson=originalPortable;saveFile=async()=>true;});
  await click('[data-act=backupFile]');await page.waitForFunction(()=>!U.portableBackupBusy&&S.lastBackup>0);
  assert.equal(await page.locator('#backupLocalStatus').getAttribute('data-tone'),'success');assert(await page.locator('[data-act=backupFile]').isEnabled());
  assert.equal(await page.evaluate(()=>JSON.stringify(S.tx)),await page.evaluate(()=>window.fixtureTransactions));
  await page.evaluate(()=>{S.dataRevision++;render();});assert.equal(await page.locator('#backupLocalStatus').getAttribute('data-tone'),'warning');assert((await page.locator('#backupLocalStatus').textContent()).includes('ข้อมูลล่าสุด'),'a changed ledger must not keep a stale backup-success state');
  console.log('PASS backup exposes distinct local/cloud/restore sections, actual busy/duplicate/cancel/failure/success states and preserves financial records');
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
