const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const css=fs.readFileSync('gateway/public/assets/area-ledger-menu-icons.css','utf8');
const sw=fs.readFileSync('gateway/public/sw.js','utf8');
const image=fs.readFileSync('gateway/public/assets/area-ledger-menu-icons.webp');
assert(image.length>=5000&&image.length<25000,'icon sheet must be compressed and fully present');
assert.equal(image.toString('ascii',0,4),'RIFF');
assert.equal(image.toString('ascii',8,12),'WEBP');
assert(html.includes('<link rel="stylesheet" href="assets/area-ledger-menu-icons.css">'));
assert(css.includes('background-image:url("./area-ledger-menu-icons.webp")'));
const classes=['accounting','contract','house-materials','documents','boq','overview','projects','transactions','due','guarantee','equipment','scaffolding','materials','procurement','schedule'];
assert.equal(new Set(classes).size,15);
for(const name of classes){
  assert(css.includes('.area-menu-art--'+name+'::after'),'missing sprite coordinates: '+name);
  assert(html.includes("'"+name+"'"),'missing app category mapping: '+name);
}
assert(css.includes('background-size:500% 300%'));
assert(html.includes("areaMenuIcon(x[0],x[1])"),'main drawer needs category icons');
assert(html.includes("areaMenuIcon(t[0],t[1])"),'bottom mobile nav needs category icons');
assert(html.includes('area-shortcuts-grid'),'remaining six icons need real menu shortcuts');
for(const label of ['งานรับเหมา','รายการวัสดุสร้างบ้าน','เครื่องจักร / เครื่องมือ','นั่งร้าน / ไม้แบบ','วัสดุก่อสร้าง','ตารางงาน / วางแผน'])
  assert(html.includes(label),'missing shortcut '+label);
assert(html.includes("if(a==='menuExpenseShortcut')"),'rental/material shortcuts must be wired to existing expense filters');
assert(html.includes("U.filter={type:'out'"),'expense shortcut must select outgoing expenses');
assert(html.includes("['schedule','ตารางงาน / วางแผน','กำหนดงานในโครงการ','menuGo','projects'"),'scheduling shortcut should not claim nonexistent calendar module');
for(const asset of ['assets/area-ledger-menu-icons.css','assets/area-ledger-menu-icons.webp'])
  assert(sw.includes("'"+asset+"'"),'offline cache must include '+asset);
assert(html.includes("var KEY='site-ledger-v1'"),'must not change accounting local storage');
assert(html.includes("'site-ledger-db'"),'must not change IndexedDB name');
console.log('PASS 15 supplied AREA Ledger icons + action routing + PWA cache + storage boundaries');
