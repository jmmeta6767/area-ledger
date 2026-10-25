const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8');
const home=src.slice(src.indexOf('function vHome(){'),src.indexOf('function vProjects(){'));
const profile=src.slice(src.indexOf('function vProfile(){'),src.indexOf('function appMenuHtml(){'));
assert(home.length>1000&&profile.length>1000,'could not isolate profile/dashboard renderers');
assert(!home.includes('workspaceContextHtml()'),'company/device context still appears on dashboard');
assert(!home.includes('workspaceTasksHtml(false)'),'owner review shortcuts still appear on dashboard');
assert(profile.includes('workspaceContextHtml()'),'company/project/role/backup status not moved to profile');
const {c}=require('./helpers/reliability-context.cjs').appContext();
for(const role of ['owner','foreman']){
 c.S.role=role;const rendered=c.vProfile(),tasks=rendered.match(/<section class="workspace-tasks"[^>]*>([\s\S]*?)<\/section>/)?.[1]||'';
 assert.match(rendered,/<div class="profile-title">[\s\S]*?<h1>[^<]+<\/h1>/,'company identity must remain the primary heading');
 assert.match(tasks,/<h2>/,'profile work shortcuts must use a secondary heading');assert(!tasks.includes('<h1>'),'shortcuts must not introduce another page heading');
 assert(tasks.includes(role==='foreman'?'งานหน้างานวันนี้':'ภาพรวมและงานตรวจสอบ'),'role-specific review shortcuts not moved to profile');
 assert(rendered.indexOf('<div class="profile-title">')<rendered.indexOf('<section class="workspace-tasks"'),'company identity must precede work shortcuts');
}
assert(src.includes("['ocrReviewQueue','','receipt','ตรวจเอกสาร'")&&src.includes("['accountingOpen','','calculator','ตรวจสอบบัญชี'")&&src.includes("['go','report','chart','รายงานการเงิน'"),'owner review tasks or icons changed');
for(const selector of ['body[data-view="profile"] .workspace-context','body[data-view="profile"] .workspace-tasks','body[data-view="profile"] .workspace-task-grid button>svg','@media(max-width:430px)','@media(max-width:360px)']) assert(src.includes(selector),'profile responsive/icon style missing '+selector);
assert(src.includes("data-act=\"backup\" aria-label=\"'+esc(sync.label)+' เปิดการสำรองและซิงค์ข้อมูล\""),'backup status action no longer opens backup panel');
assert(src.includes("KEY='site-ledger-v1'")&&src.includes("IDB_NAME='site-ledger-db'"),'accounting storage contract changed');
const render=src.slice(src.indexOf('function render('),src.indexOf('/* ---------- Mobile/iOS direct navigation'));assert.equal((render.match(/document\.getElementById\('app'\)\.innerHTML=/g)||[]).length,1,'render must replace the app DOM only once');assert(!render.includes('workspaceContextHtml()'),'global renderer must not duplicate profile context on every page');
console.log('PASS profile workspace relocation, role shortcuts, backup access, responsive cards and icons');
