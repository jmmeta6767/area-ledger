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
export function verifyExpenseCase(data,item){
 if(item.mode==='table')return verifyExpenseReceipt(data);
 if(item.mode==='partial'){assert.equal(data.partialDocument,true,'incomplete document must be identified');assert.equal(data.amount,0,'page grand total must not fill a transaction');assert.equal(data.documentTotal,null,'partial page cannot establish document reconciliation');assert.deepEqual(data.rows.map(x=>Number(x.amount)),item.id==='page-1-of-2'?[1480,2250]:[2700]);return true;}
 assert.notEqual(data.partialDocument,true);assert.equal(data.amount,item.amount,'net after discount and VAT');assert(data.rows.length<=1,'adjustments cannot create extra transactions');assert.equal(data.date,'2026-10-14');assert.equal(data.cat,'ค่าของ');if(data.documentTotal!==null)assert.equal(data.documentTotal,item.amount);return true;
}
async function main(){
 const base=(process.env.AREA_LEDGER_LIVE_BASE||'https://area-ledger-ai-gateway-staging.areamaibab.workers.dev').replace(/\/$/,'');
 assert(['https://area-ledger-ai-gateway-staging.areamaibab.workers.dev','https://area-ledger-ai-gateway.areamaibab.workers.dev'].includes(base),'unsupported expense quality target');
 const manifest=JSON.parse(fs.readFileSync(new URL('./fixtures/expense-quality/manifest.json',import.meta.url),'utf8')),ids=process.env.AREA_EXPENSE_CASES?.split(','),cases=manifest.cases.filter(x=>!ids||ids.includes(x.id)),evidence=[];assert(cases.length,'no quality cases selected');
 for(const item of cases){const bytes=fs.readFileSync(new URL('./fixtures/expense-quality/'+item.file,import.meta.url)),rid='expense-quality-'+crypto.randomBytes(8).toString('hex');
 const response=await fetch(base+'/v1/ocr/expense',{method:'POST',headers:{'Content-Type':'application/json','Origin':base,'X-AREA-Gateway-Version':'1','X-AREA-Request-ID':rid},body:JSON.stringify({image:'data:image/png;base64,'+bytes.toString('base64'),lang:'tha+eng'}),signal:AbortSignal.timeout(60000)});
 const data=await response.json();assert.equal(response.status,200,item.id+' '+JSON.stringify(data));assert.equal(response.headers.get('X-AREA-Request-ID'),rid);assert.equal(response.headers.get('X-AREA-Gateway-Version'),'1');
 try{verifyExpenseCase(data,item);}catch(error){error.message=item.id+': '+error.message+'; response='+JSON.stringify(data);throw error;}
 evidence.push({id:item.id,requestId:rid,fixtureSha256:crypto.createHash('sha256').update(bytes).digest('hex'),documentTotal:data.documentTotal,amount:data.amount,partialDocument:data.partialDocument,amounts:data.rows.map(x=>x.amount),ok:true});console.log('PASS live expense quality:',item.id);
 }
 fs.writeFileSync('expense-document-quality.json',JSON.stringify({at:new Date().toISOString(),base,sourceSha:process.env.AREA_LEDGER_ACCEPTANCE_SHA||null,cases:evidence,ok:true},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e);process.exitCode=1;});
