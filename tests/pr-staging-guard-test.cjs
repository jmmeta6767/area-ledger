const assert=require('node:assert/strict'),fs=require('node:fs');
const {validateCandidate}=require('./pr-staging-guard.cjs');
const sha='a'.repeat(40),base='b'.repeat(40);
const fixture=()=>({event:'pull_request',repository:'owner/repo',head:{sha,repo:{full_name:'owner/repo'}},base:{sha:base,ref:'main'},actual:sha,files:['gateway/public/index.html'],marker:false});
assert(validateCandidate(fixture()));
for(const change of [x=>x.event='push',x=>x.head.repo.full_name='fork/repo',x=>x.actual=base,x=>x.marker=true,x=>x.base.ref='other',x=>x.head.sha='bad']){const x=fixture();change(x);assert.throws(()=>validateCandidate(x));}
for(const file of ['gateway/migrations/0004.sql','gateway/wrangler.toml','legacy-app/src/worker.js','.github/production-cutover-v805','.github/workflows/production-cutover-v805.yml','.github/workflows/cloudflare-deploy.yml','.github/workflows/staging-auto-deploy.yml']){const x=fixture();x.files=[file];assert.throws(()=>validateCandidate(x),file);}
const workflow=fs.readFileSync('.github/workflows/pr-staging-acceptance.yml','utf8');
assert(workflow.includes('needs: [regression, iphone-layout]'));
assert(workflow.includes('ref: ${{ github.event.pull_request.head.sha }}'));
assert(workflow.includes('group: area-ledger-staging-auto'));
assert(workflow.includes('environment: staging'));
assert(workflow.includes('node tests/pr-staging-guard.cjs'));
assert(workflow.includes('wrangler@4.145.0 deploy --env staging'));
assert(!/pull_request_target|environment: production|d1 migrations|secret put|DEPLOY_PRODUCTION/.test(workflow));
assert(workflow.includes('AREA_LEDGER_ACCEPTANCE_SHA: ${{ github.event.pull_request.head.sha }}'));
console.log('PASS PR staging: identity, fork, marker, schema and release isolation');
