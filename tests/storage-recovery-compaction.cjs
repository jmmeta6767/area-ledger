const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('gateway/public/index.html','utf8');
const code=html.slice(html.indexOf('async function storageCompactRecovery('),html.indexOf('function storageCommitBaseline'));
const storageReader=html.match(/function storageCurrentRaw\(\)\{[^\n]+/)[0];
async function check(mode){
 const raw=JSON.stringify({projects:[],tx:[],padding:'x'.repeat(530000)}),backup=JSON.stringify({projects:[],tx:[{amount:6430}]});
 const ls=new Map([['primary',raw],['backup',backup]]),db=new Map();
 const c={KEY:'primary',BACKUP_KEY:'backup',committedState:raw,localStorage:{getItem:k=>ls.get(k)||null,removeItem:k=>ls.delete(k)},idbPut:async(k,v)=>{if(mode==='fail')return false;db.set(k,v);return true;},idbRead:async k=>{if(mode==='concurrent')ls.set('primary','changed');if(mode==='backup-change')ls.set('backup','changed');return mode==='mismatch'?'bad':db.get(k);}};
 c.primaryActive=mode==='primary-active';
 vm.createContext(c);vm.runInContext(storageReader+'\n'+code,c);
 const ok=await c.storageCompactRecovery();
 assert.equal(ok,mode==='success');
 if(mode==='success'){assert.equal(ls.has('backup'),false);assert.equal(db.get('state-backup'),backup);}else assert(ls.has('backup'));
 assert.equal(ls.get('primary'),mode==='concurrent'?'changed':raw);
 if(mode==='primary-active')assert.equal(db.size,0,'primary storage must not compact legacy evidence');
 console.log('PASS recovery compaction',mode);
}
(async()=>{for(const mode of ['success','fail','mismatch','concurrent','backup-change','primary-active'])await check(mode);})().catch(e=>{console.error(e);process.exitCode=1;});
