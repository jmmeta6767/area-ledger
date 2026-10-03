const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8');

const opens=src.split('<style>').length-1,closes=src.split('</style>').length-1;
assert.equal(opens,closes,'style tag count must balance');
assert(opens<=18,'style block count regressed above consolidated v1034 budget');

const blocks=src.split('<style>').slice(1).map(x=>x.split('</style>')[0]);
blocks.forEach((b,i)=>{
  const ob=b.split('{').length-1,cb=b.split('}').length-1;
  assert.equal(ob,cb,'unbalanced CSS braces in style block '+i);
});

const collision=new RegExp('(?:margin|padding|gap|top|right|bottom|left|width|height|max-height|min-height|max-width|min-width)\\s*:[^;{}]{0,50}\\.[A-Za-z_-][A-Za-z0-9_-]*\\s*\\{','g');
assert.equal((src.match(collision)||[]).length,0,'CSS property/selector collision found');
assert(!src.includes('margin:10px 0.mj-line{'),'manual journal malformed selector returned');

const ux=blocks.find(b=>b.includes('v1030 UX/UI normalization'));
assert(ux,'consolidated UX style block missing');
['v1031 iPhone task-flow refinements','v1032 mobile command hierarchy','v1033 documents due settings accessibility','v1034 CSS QA polish'].forEach(m=>assert(ux.includes(m),'UX layer not consolidated: '+m));

assert(src.includes('--ux-control-radius:12px'),'v1034 consistency token missing');
assert(src.includes('@media(prefers-contrast:more)'),'high contrast polish missing');
assert(src.includes(':where(button,.btn,input,select,textarea,summary):disabled'),'disabled control normalization missing');
assert(src.includes("KEY='site-ledger-v1'")||src.includes("const KEY='site-ledger-v1'"),'storage key contract missing');
assert(src.includes("'site-ledger-db'"),'IndexedDB contract missing');
console.log('PASS v1034 CSS QA polish regression');
