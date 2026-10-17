'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../gateway/public/payroll.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'Payroll script missing');new vm.Script(script);
const start=script.indexOf("const KEY='area-ledger-payroll-v1'"),end=script.indexOf('let db,dbLoadError=false;');
assert(start>0&&end>start,'Monthly engine missing');
const storage=new Map();const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const c=vm.createContext({localStorage,console,Date,Intl,Math});vm.runInContext(script.slice(start,end),c);
const js=cmd=>JSON.parse(JSON.stringify(vm.runInContext(cmd,c)));
assert.deepEqual(js('recentMonths(new Date(2026,9,17))'),['2026-10','2026-09']);
assert.deepEqual(js('recentMonths(new Date(2027,0,2))'),['2027-01','2026-12']);
assert.equal(js("validMonth('2026-13')"),false);
const employee={id:'id-employee0001',name:'ช่าง ก',rate:650,active:true};
const state={version:1,employees:[employee],attendance:{
  'id-employee0001__2026-08-10':{employeeId:employee.id,date:'2026-08-10',status:'work',wage:500},
  'id-employee0001__2026-09-17':{employeeId:employee.id,date:'2026-09-17',status:'work',wage:600},
  'id-employee0001__2026-10-17':{employeeId:employee.id,date:'2026-10-17',status:'work',wage:650}
},advances:[{id:'adv1',employeeId:employee.id,date:'2026-08-10',amount:100,note:''},{id:'adv2',employeeId:employee.id,date:'2026-10-17',amount:300,note:''}]};
vm.runInContext('var db='+JSON.stringify(state)+';',c);
const oct=js("monthSnapshot(db,'2026-10')");
assert.equal(Object.keys(oct.attendance).length,1);
assert.equal(oct.advances.length,1);
assert.equal(js("validateMonthSnapshot(monthSnapshot(db,'2026-10')).month"),'2026-10');
assert.throws(()=>vm.runInContext("validateMonthSnapshot({...monthSnapshot(db,'2026-10'),attendance:db.attendance})",c),/ตรงเดือน/);
const result=js("mergeMonthSnapshots([{...monthSnapshot(db,'2026-10'),attendance:{},advances:[]}])");
assert.equal(Object.keys(result.attendance).length,2,'Restore must not touch other months');
assert.equal(result.advances.length,1,'Restore must not touch advances in other months');
assert(result.attendance['id-employee0001__2026-08-10']);
const allowed=js('recentMonths()');
const retained=js("storeMonthlyVault([monthSnapshot(db,'2026-10'),monthSnapshot(db,'2026-09'),monthSnapshot(db,'2026-08')]);JSON.parse(localStorage.getItem(BACKUP_KEY)).months.map(x=>x.month)");
assert(retained.length<=2);assert(retained.every(month=>allowed.includes(month)),'Backup must not retain older months');
assert(!html.includes("localStorage.setItem('site-ledger-v1'"));
assert(html.includes('data-action="restore-auto"')&&html.includes('data-action="backup-selected"'));
console.log('PASS payroll monthly / two-month rolling backups / non-destructive month restore / legacy ledger isolation');
