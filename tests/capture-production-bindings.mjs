import assert from 'node:assert/strict';
import fs from 'node:fs';

const path='gateway/wrangler.toml';
const text=fs.readFileSync(path,'utf8');
const production=text.split('\n[env.staging]')[0];

function block(header){
  const start=production.indexOf(header);
  assert(start>=0,'missing '+header);
  const rest=production.slice(start+header.length);
  const match=rest.match(/\n(?:\[\[|\[)[^\n]+/);
  return match?rest.slice(0,match.index):rest;
}
function value(src,key){
  const m=src.match(new RegExp('^\\s*'+key+'\\s*=\\s*"([^"]+)"','m'));
  return m?m[1]:'';
}

const d1=block('[[d1_databases]]');
const r2=block('[[r2_buckets]]');
const dbBinding=value(d1,'binding');
const databaseName=value(d1,'database_name');
const databaseId=value(d1,'database_id');
const r2Binding=value(r2,'binding');
const bucketName=value(r2,'bucket_name');

assert.equal(dbBinding,'LEDGER_DB');
assert.match(databaseId,/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,'production D1 UUID must be provisioned');
assert(databaseName,'production D1 name must be provisioned');
assert(!/staging/i.test(databaseName),'production D1 must not be staging');
assert.equal(r2Binding,'LEDGER_FILES');
assert(bucketName,'production R2 bucket name must be provisioned');
assert(!/staging/i.test(bucketName),'production R2 must not be staging');

const sourceSha=String(process.env.AREA_LEDGER_ACCEPTANCE_SHA||'').trim();
const workflowRun=String(process.env.AREA_LEDGER_ACCEPTANCE_RUN||'').trim();
const stagingRun=String(process.env.AREA_LEDGER_STAGING_RUN||'').trim();
if(sourceSha)assert.match(sourceSha,/^[0-9a-f]{40}$/i);
if(workflowRun)assert.match(workflowRun,/^[0-9]+$/);
if(stagingRun)assert.match(stagingRun,/^[0-9]+$/);

const evidence={
  worker:'area-ledger-ai-gateway',
  sourceSha:sourceSha||null,
  workflowRun:workflowRun||null,
  stagingRun:stagingRun||null,
  capturedAt:new Date().toISOString(),
  d1:{binding:dbBinding,databaseName,databaseId},
  r2:{binding:r2Binding,bucketName}
};
fs.writeFileSync('production-bindings.json',JSON.stringify(evidence,null,2));
console.log('PRODUCTION_BINDINGS '+JSON.stringify(evidence));
