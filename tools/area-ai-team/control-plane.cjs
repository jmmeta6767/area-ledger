'use strict';
// AREA AI Team control-plane V1. Pure metadata-only decision support.
// Never executes Codex, changes financial records, merges, writes to git,
// reads secrets, deploys, or grants production authorization.
const REPO='jmmeta6767/area-ledger';
const SHA_RE=/^[a-f0-9]{40}$/;
const ROLE_IDS=new Set(['AI-00','AI-01','AI-02','AI-03','AI-04','AI-05','AI-06','AI-07','AI-08']);
const STATES=Object.freeze(['TRIAGED','READY_FOR_CODEX','CODEX_IN_PROGRESS','PR_OPEN','QA_REVIEW','BLOCKED','READY_FOR_OWNER_REVIEW','DONE']);
const CHECKS=Object.freeze(['regression','iphone-layout']);
const RUNTIME=/^(gateway\/|legacy-app\/|index\.html$|sw\.js$|mobile\/)/;
const SENSITIVE=/(^\.github\/production-cutover-v805$|^gateway\/wrangler\.toml$|^legacy-app\/wrangler\.toml$|^tests\/assert-deploy-identity\.cjs$|^tests\/stamp-build\.mjs$|^\.github\/workflows\/)/;

function numberId(value){
  const n=Number(value);
  return Number.isSafeInteger(n)&&n>0?n:null;
}
function issueQueueItem(issue,plan,mainSha){
  if(!SHA_RE.test(String(mainSha||'')))throw Error('Verified 40-character main SHA required');
  const issueNumber=numberId(issue&&issue.number);
  if(!issueNumber)throw Error('A valid GitHub issue number is required');
  if(!plan || !Array.isArray(plan.implementers))throw Error('A reviewed AI triage plan is required');
  const roles=plan.implementers.filter(id=>ROLE_IDS.has(id));
  if(!roles.length)throw Error('At least one valid AI specialist required');
  const priority=/^P[0-3]$/.test(plan.priority)?plan.priority:'UNSET';
  const missing=Array.isArray(plan.needsInfo)?plan.needsInfo.map(x=>String(x).slice(0,80)).slice(0,6):[];
  return Object.freeze({
    id:'AREA-'+issueNumber,number:issueNumber,priority,roles,status:'TRIAGED',mainSha,
    acceptanceReady:missing.length===0&&priority!=='UNSET',
    blockers:priority==='UNSET'?['Priority must be confirmed']:[],
    needsInfo:missing,reviewRoles:['AI-05','AI-06'],
    financialSaveAuthorization:'NOT_GRANTED',codexExecution:'NOT_STARTED',
    productionAuthorization:'NOT_GRANTED'
  });
}
function handoff(item){
  if(!item||!STATES.includes(item.status))throw Error('Unknown task');
  return Object.freeze({
    taskId:item.id,
    targetRepo:REPO,
    baseRef:'main',
    preflight:'Fetch CURRENT main and compare with '+item.mainSha+' before writing code',
    specialists:item.roles.slice(),
    stage:item.acceptanceReady?'READY_FOR_HUMAN_DISPATCH':'NEEDS_TRIAGE',
    taskUrl:'https://github.com/'+REPO+'/issues/'+item.number,
    checklist:[
      'Read current README, release notes and relevant tests',
      'Make a focused branch from latest main; no force push',
      'Run targeted regression, accounting-data and security tests',
      'Attach evidence and request AI-05/AI-06 reviews',
      'Do not merge on failing/pending checks; never auto-save OCR accounting data',
      'Staging before production; explicit owner cutover permission required'
    ],
    codexExecution:'NOT_STARTED',
    productionAuthorization:'NOT_GRANTED'
  });
}
function checkStatus(checkRuns,name){
  const found=(Array.isArray(checkRuns)?checkRuns:[]).filter(x=>x&&x.name===name);
  if(!found.length)return 'missing';
  const c=found[found.length-1];
  if(c.status!=='completed')return 'pending';
  return c.conclusion==='success'?'success':c.conclusion==='skipped'?'skipped':'failure';
}
function reviewPullRequest(pr,files,checkRuns,latestMainSha){
  if(!SHA_RE.test(String(latestMainSha||'')))throw Error('Unverified main SHA');
  const paths=(Array.isArray(files)?files:[]).map(x=>typeof x==='string'?x:x&&x.filename).filter(x=>typeof x==='string');
  const runtimeTouched=paths.some(p=>RUNTIME.test(p));
  const sensitiveTouched=paths.filter(p=>SENSITIVE.test(p));
  const baseSha=String(pr&&pr.base&&pr.base.sha||'');
  const open=pr&&pr.state==='open';
  const blockers=[];
  if(!open)blockers.push('PR is not open');
  if(baseSha!==latestMainSha)blockers.push('Base SHA differs from current main; review/rebase required');
  if(pr&&pr.draft)blockers.push('PR is still a draft');
  for(const name of CHECKS){
    if(checkStatus(checkRuns,name)!=='success')blockers.push(name+' must pass');
  }
  const cf=(Array.isArray(checkRuns)?checkRuns:[]).filter(c=>c&&typeof c.name==='string'&&c.name.startsWith('Workers Builds:'));
  if(cf.length&&!cf.every(c=>c.status==='completed'&&c.conclusion==='success'))blockers.push('External Cloudflare Workers Build not green');
  if(runtimeTouched&&!cf.length)blockers.push('Runtime change: verify Cloudflare release gate and staging');
  if(sensitiveTouched.length)blockers.push('Sensitive release/config files require AI-06 and AI-07 review');
  return Object.freeze({
    prNumber:numberId(pr&&pr.number),mainSha:latestMainSha,headSha:String(pr&&pr.head&&pr.head.sha||''),
    runtimeTouched,sensitiveTouched,checkStatus:Object.fromEntries(CHECKS.map(c=>[c,checkStatus(checkRuns,c)])),
    cloudflareStatus:cf.length?(cf.every(c=>c.status==='completed'&&c.conclusion==='success')?'success':'failure_or_pending'):'not_reported',
    blockers,gate:blockers.length?'BLOCKED':'REQUIRES_INDEPENDENT_QA_SIGNOFF',
    mergeAuthorization:'NOT_GRANTED',productionAuthorization:'NOT_GRANTED'
  });
}
function releaseDecision(review,stagingEvidence,ownerAuthorized){
  const issues=Array.isArray(review&&review.blockers)?review.blockers.slice():['PR review required'];
  if(!review||review.gate!=='REQUIRES_INDEPENDENT_QA_SIGNOFF')issues.push('Independent QA signoff not complete');
  if(!stagingEvidence||stagingEvidence.accepted!==true||!SHA_RE.test(String(stagingEvidence.sha||''))||stagingEvidence.sha!==review.headSha){
    issues.push('Exact-source staging acceptance missing');
  }
  if(!ownerAuthorized)issues.push('Owner production authorization missing');
  // This function is an advisor: even when evidence exists, it never issues credentials
  // or runs a deployment. Production uses the existing protected cutover workflow.
  return Object.freeze({readyForManualCutover:issues.length===0,issues,deployPerformed:false,authorization:'NOT_GRANTED_BY_THIS_TOOL'});
}
function dashboard(items){
  if(!Array.isArray(items))throw Error('items array required');
  const rows=['| Task | Priority | Roles | Status |','| --- | --- | --- | --- |'];
  for(const x of items.slice(0,100)){
    if(!x||!numberId(x.number))continue;
    const priority=/^P[0-3]$/.test(x.priority)?x.priority:'UNSET';
    const status=STATES.includes(x.status)?x.status:'TRIAGED';
    const roles=(Array.isArray(x.roles)?x.roles:[]).filter(r=>ROLE_IDS.has(r)).join(', ')||'AI-00';
    rows.push('| [AREA-'+x.number+'](https://github.com/'+REPO+'/issues/'+x.number+') | '+priority+' | '+roles+' | '+status+' |');
  }
  rows.push('\n**Read-only snapshot.** No financial writes, Codex launches, merges, staging or production deploys.');
  return rows.join('\n');
}
module.exports={REPO,STATES,issueQueueItem,handoff,checkStatus,reviewPullRequest,releaseDecision,dashboard};
