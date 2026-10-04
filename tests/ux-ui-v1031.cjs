const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8').replace(/\r\n/g,'\n');

assert(src.includes('v1031 iPhone task-flow refinements · readability before density'),'missing v1031 UX layer');
assert(src.includes('.list-command-summary>span:first-child'),'list count must receive full-width mobile row');
assert(src.includes('grid-template-columns:40px minmax(0,1fr) 34px!important'),'transaction row mobile reflow missing');
assert(src.includes('.tx-modern>.r{'),'transaction amount/status second-line layout missing');
assert(src.includes('.project-status-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important'),'project 2x2 status grid missing');
assert(src.includes('.project-hub-glance span:first-child{grid-column:1/-1!important'),'project budget full-row layout missing');
assert(src.includes('.boq-check-main>.boq-row-amount'),'BOQ dedicated amount row missing');
assert(src.includes('.profile-head-actions{\n    grid-column:1/-1!important'),'profile action row missing');
assert(src.includes('.profile-featured-card:nth-child(3){display:block!important}'),'third pinned profile card must remain reachable');
assert(src.includes('.profile-post-actions.four{grid-template-columns:1fr 1fr!important}'),'profile post mobile 2x2 actions missing');
assert(src.includes('@media(max-height:540px) and (orientation:landscape)'),'landscape nav compaction missing');
assert(src.includes("['home','home','ภาพรวม'],['boq','documents','BOQ'],['add','plus',''],['projects','build','โครงการ'],['profile','profile','โปรไฟล์']"),'bottom navigation order changed');
assert(src.includes("KEY='site-ledger-v1'")||src.includes("const KEY='site-ledger-v1'"),'storage key contract missing');
assert(src.includes("'site-ledger-db'"),'IndexedDB contract missing');
console.log('PASS v1031 iPhone task-flow UX regression');
