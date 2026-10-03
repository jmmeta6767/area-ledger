const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('gateway/public/index.html','utf8');

assert(src.includes('v1030 UX/UI normalization · presentation only · iPhone-first'),'missing v1030 UX layer');
assert(src.includes('--ux-touch:48px'),'touch target token must remain 48px');
assert(src.includes('#app:not(.nonav) main{padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important}'),'main must clear fixed nav + safe area');
assert(src.includes('.nav button:not(.add).on'),'bottom nav needs an explicit selected state');
assert(src.includes('input,select,textarea{font-size:16px!important}'),'mobile inputs must prevent Safari focus zoom');
assert(src.includes('max-height:min(92dvh,920px)!important'),'sheet must honor dynamic mobile viewport');
assert(src.includes('overscroll-behavior:contain!important'),'sheet scrolling must stay contained');
assert(!src.includes(':root[data-theme="dark"] .nav,\n@media'),'invalid comma-before-media dark-mode syntax');
assert(src.includes(':root[data-theme="dark"] .profile-hero'),'manual dark mode must style profile');
assert(src.includes(':root:not([data-theme="light"]) .profile-hero'),'system dark mode must style profile');
assert(src.includes("['home','home','ภาพรวม'],['boq','documents','BOQ'],['add','plus',''],['projects','build','โครงการ'],['profile','profile','โปรไฟล์']"),'primary nav order/profile bottom-right changed');
assert(src.includes("const KEY='site-ledger-v1'")||src.includes("KEY='site-ledger-v1'"),'storage key contract missing');
assert(src.includes("DB='site-ledger-db'")||src.includes("'site-ledger-db'"),'IndexedDB contract missing');
console.log('PASS v1030 UX/UI static regression');
