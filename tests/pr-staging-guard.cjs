// Same-repository candidate only; no infrastructure/schema/production changes.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
function validateCandidate({event,repository,head,base,actual,files,marker}){
  assert.equal(event,'pull_request','Only pull-request staging is supported');
  assert.equal(head.repo.full_name,repository,'Fork candidates cannot use staging credentials');
  assert.equal(base.ref,'main');
  for(const sha of [head.sha,base.sha,actual])assert.match(sha||'',/^[0-9a-f]{40}$/);
  assert.equal(actual,head.sha,'Checkout must match the tested PR head');
  assert.equal(marker,false,'Production authorization must stay closed');
  const forbidden=/^(?:gateway\/(?:migrations\/|wrangler\.toml$)|legacy-app\/|\.github\/(?:production-cutover-v805$|workflows\/(?:production-cutover-v805|cloudflare-deploy|staging-auto-deploy)\.yml$))/;
  assert(!files.some(file=>forbidden.test(file)),'Candidate staging cannot modify schema, bindings, legacy production or release workflows');
  return true;
}
module.exports={validateCandidate};
if(require.main===module){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),pr=event.pull_request;
  assert(pr,'Missing PR context');
  const actual=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.equal(process.env.CANDIDATE_SHA,pr.head.sha);
  assert.equal(process.env.CANDIDATE_BASE_SHA,pr.base.sha);
  cp.execFileSync('git',['merge-base','--is-ancestor',pr.base.sha,pr.head.sha]);
  const files=cp.execFileSync('git',['diff','--name-only','-z',pr.base.sha,pr.head.sha],{encoding:'utf8'}).split('\0').filter(Boolean);
  validateCandidate({event:process.env.GITHUB_EVENT_NAME,repository:process.env.GITHUB_REPOSITORY,head:pr.head,base:pr.base,actual,files,marker:fs.existsSync('.github/production-cutover-v805')});
  console.log('PASS closed-gate candidate identity',actual);
}
