'use strict';
// Synthetic, no-account test: the settings updater only knows the published
// bundle on the same origin. It MUST NOT imply GitHub main or staging is live.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const start=html.indexOf('function pwaUpdatePanel()'),end=html.indexOf('function pwaCanReload()',start);
assert(start>0&&end>start,'Expected standalone PWA version checker');
const code=html.slice(start,end);
assert(code.includes("fetch('./index.html'"),'Version check must use same-origin published HTML');
assert(code.includes("build.environment!==APP_BUILD.environment"),'Never advertise staging as production');
assert(!code.includes('กำลังใช้เวอร์ชันล่าสุด v'), 'Do not describe the production-only check as global latest');
assert(!code.includes('localStorage.clear(')&&!code.includes('indexedDB.deleteDatabase('));
const a='a'.repeat(40),b='b'.repeat(40);
function ctx(networkBuild,options={}){
 const el={textContent:''},calls=[];
 const runtime={
   U:{pwaCheckMessage:'',pwaCheckBusy:false}, APP_BUILD:{version:1089,sha:a,environment:'production'},
   esc:s=>s, AbortController, setTimeout:()=>1, clearTimeout:()=>{},
   document:{getElementById:id=>id==='pwaCheckResult'?el:null},
   navigator:{},
   fetch:async (url,opts)=>{
     calls.push({url,opts});
     if(options.networkError)throw Error('offline');
     return {ok:true,text:async()=>'<script>var APP_BUILD='+JSON.stringify(networkBuild)+';\\n</script>'};
   }
 };
 vm.createContext(runtime);vm.runInContext(code,runtime);
 return {runtime,el,calls};
}
(async()=>{
 let p=ctx({version:1089,sha:a,environment:'production'});
 assert(p.runtime.pwaUpdatePanel().includes('ตรวจเวอร์ชันบนเว็บนี้'));
 assert(p.runtime.pwaUpdatePanel().includes('โหลดหน้าเว็บที่เผยแพร่'));
 await p.runtime.pwaCheckUpdate();
 assert(p.el.textContent.includes('กำลังใช้เวอร์ชันที่เผยแพร่บนเว็บนี้ v1089'));
 assert(!p.el.textContent.includes('เวอร์ชันล่าสุด'));
 assert.equal(p.calls.length,1);
 assert.equal(p.calls[0].url,'./index.html');
 assert.equal(p.calls[0].opts.cache,'no-store');
 assert.equal(p.calls[0].opts.credentials,'same-origin');
 console.log('PASS same-origin published v1089 is not described as latest GitHub version');
 p=ctx({version:1098,sha:b,environment:'production'});
 await p.runtime.pwaCheckUpdate();
 assert(p.el.textContent.includes('เว็บนี้เผยแพร่เวอร์ชันใหม่ v1098'));
 assert(p.el.textContent.includes('ปิดงานที่กำลังแก้ก่อนโหลดใหม่'));
 console.log('PASS changed published SHA prompts safe reload without clearing drafts');
 p=ctx({version:1098,sha:b,environment:'staging'});
 await p.runtime.pwaCheckUpdate();
 assert(p.el.textContent.includes('ยังตรวจเวอร์ชันไม่ได้'));
 console.log('PASS staging/production identity mix is rejected');
 p=ctx(null,{networkError:true});
 await p.runtime.pwaCheckUpdate();
 assert(p.el.textContent.includes('ข้อมูลเดิมยังอยู่'));
 assert.equal(p.runtime.U.pwaCheckBusy,false);
 console.log('PASS network failure reports uncertainty without touching user data');
})().catch(e=>{console.error(e);process.exitCode=1;});
