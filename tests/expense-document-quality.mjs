import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

// Public synthetic fixture, never the user's private receipt. Verify money, not connectivity.
export function verifyExpenseReceipt(data){
 assert.equal(data.documentTotal,6430,'printed document total');assert.equal(data.amount,0,'table must not become a second total transaction');
 assert.equal(data.rows?.length,3,'exactly three source rows');assert.deepEqual(data.rows.map(x=>Number(x.amount)),[1480,2250,2700]);
 assert.equal(data.rows.reduce((n,x)=>n+x.amount,0),6430);assert(data.rows.every(x=>x.cat==='ค่าของ'),'material category mapping');
 assert(data.rows.every(x=>x.date==='2026-10-14'),'printed transaction date');return true;
}
async function main(){
 const base=(process.env.AREA_LEDGER_LIVE_BASE||'https://area-ledger-ai-gateway-staging.areamaibab.workers.dev').replace(/\/$/,'');
 assert(['https://area-ledger-ai-gateway-staging.areamaibab.workers.dev','https://area-ledger-ai-gateway.areamaibab.workers.dev'].includes(base),'unsupported expense quality target');
 const bytes=fs.readFileSync(new URL('./fixtures/expense-synthetic-receipt.png',import.meta.url)),rid='expense-quality-'+crypto.randomBytes(8).toString('hex');
 const response=await fetch(base+'/v1/ocr/expense',{method:'POST',headers:{'Content-Type':'application/json','Origin':base,'X-AREA-Gateway-Version':'1','X-AREA-Request-ID':rid},body:JSON.stringify({image:'data:image/png;base64,'+bytes.toString('base64'),lang:'tha+eng'}),signal:AbortSignal.timeout(60000)});
 const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));assert.equal(response.headers.get('X-AREA-Request-ID'),rid);assert.equal(response.headers.get('X-AREA-Gateway-Version'),'1');verifyExpenseReceipt(data);
 fs.writeFileSync('expense-document-quality.json',JSON.stringify({at:new Date().toISOString(),base,requestId:rid,fixtureSha256:crypto.createHash('sha256').update(bytes).digest('hex'),sourceSha:process.env.AREA_LEDGER_ACCEPTANCE_SHA||null,documentTotal:data.documentTotal,amounts:data.rows.map(x=>x.amount),ok:true},null,2));
 console.log('PASS live expense receipt: three rows, 6430 total, date, category and protocol identity');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e);process.exitCode=1;});
