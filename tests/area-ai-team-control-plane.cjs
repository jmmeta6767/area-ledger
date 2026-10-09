'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {issueQueueItem,handoff,checkStatus,reviewPullRequest,releaseDecision,dashboard}=require('../tools/area-ai-team/control-plane.cjs');
const sha='c74de3937bc5c43390d2e69d2a135dee48e1855b';
const other='a'.repeat(40);
const goodChecks=[
  {name:'regression',status:'completed',conclusion:'success'},
  {name:'iphone-layout',status:'completed',conclusion:'success'},
  {name:'Workers Builds: area-ledger-ai-gateway-staging',status:'completed',conclusion:'success'}
];
const basic={number:139,state:'open',draft:false,base:{sha},head:{sha:other}};
test('Task intake refuses unverified main SHA, invalid issue and unknown roles',()=>{
  assert.throws(()=>issueQueueItem({number:12},{priority:'P1',implementers:['AI-03']},'main'));
  assert.throws(()=>issueQueueItem({number:0},{priority:'P1',implementers:['AI-03']},sha));
  assert.throws(()=>issueQueueItem({number:12},{priority:'P1',implementers:['root']},sha));
});
test('Queue emits safe metadata-only Codex handoff, never auto-dispatches',()=>{
  const item=issueQueueItem({number:138,title:'PRIVATE supplier statement'},{
    priority:'P1',implementers:['AI-03','AI-04'],needsInfo:[]
  },sha);
  const h=handoff(item);
  assert.equal(item.status,'TRIAGED');
  assert.equal(item.financialSaveAuthorization,'NOT_GRANTED');
  assert.equal(h.stage,'READY_FOR_HUMAN_DISPATCH');
  assert.equal(h.codexExecution,'NOT_STARTED');
  assert.equal(h.productionAuthorization,'NOT_GRANTED');
  assert(!JSON.stringify(h).includes('PRIVATE supplier'));
});
test('Missing criteria and priority require triage',()=>{
  const p=issueQueueItem({number:1},{priority:'',implementers:['AI-01'],needsInfo:['acceptance criteria']},sha);
  assert.equal(handoff(p).stage,'NEEDS_TRIAGE');
  assert.equal(p.acceptanceReady,false);
});
test('Missing or pending checks block PR merge readiness',()=>{
  assert.equal(checkStatus([], 'regression'),'missing');
  assert.equal(checkStatus([{name:'regression',status:'queued'}],'regression'),'missing'); // wrong lookup must be missing
  const r=reviewPullRequest(basic,['docs/README.md'],[],sha);
  assert(r.blockers.some(s=>s.includes('regression')));
  assert.equal(r.mergeAuthorization,'NOT_GRANTED');
});
test('Successful checks alone do not authorize merge or deploy',()=>{
  const r=reviewPullRequest(basic,['docs/good.md'],goodChecks,sha);
  assert.equal(r.gate,'REQUIRES_INDEPENDENT_QA_SIGNOFF');
  assert.equal(r.mergeAuthorization,'NOT_GRANTED');
  assert.equal(r.productionAuthorization,'NOT_GRANTED');
  const decision=releaseDecision(r,{accepted:true,sha:other},true);
  assert.equal(decision.readyForManualCutover,true);
  assert.equal(decision.deployPerformed,false);
  assert.equal(decision.authorization,'NOT_GRANTED_BY_THIS_TOOL');
});
test('Cloudflare failure is a blocker despite GitHub checks passing',()=>{
  const c=goodChecks.map(x=>({...x}));
  c[2].conclusion='failure';
  const r=reviewPullRequest(basic,['AGENTS.md'],c,sha);
  assert(r.blockers.includes('External Cloudflare Workers Build not green'));
  assert.equal(r.gate,'BLOCKED');
});
test('Sensitive release files and runtime paths need extra gates',()=>{
  const r=reviewPullRequest(basic,['gateway/wrangler.toml','gateway/public/index.html'],goodChecks,sha);
  assert.equal(r.runtimeTouched,true);
  assert(r.blockers.some(s=>s.startsWith('Sensitive release/config')));
});
test('Mismatched base, closed and draft PR are blocked',()=>{
  for(const pr of [{...basic,draft:true},{...basic,state:'closed'},{...basic,base:{sha:other}}]){
    const r=reviewPullRequest(pr,['docs/a.md'],goodChecks,sha);
    assert.equal(r.gate,'BLOCKED');
  }
});
test('Release gate is fail-closed on missing staging, wrong SHA and no owner authorization',()=>{
  const r=reviewPullRequest(basic,['docs/a.md'],goodChecks,sha);
  assert.equal(releaseDecision(r,null,false).readyForManualCutover,false);
  assert.equal(releaseDecision(r,{accepted:true,sha},true).readyForManualCutover,false);
  assert.equal(releaseDecision(r,{accepted:true,sha:other},false).readyForManualCutover,false);
  assert.equal(releaseDecision(null,{accepted:true,sha:other},true).readyForManualCutover,false);
});
test('Dashboard shows sanitized metadata without echoing raw issue/private comments',()=>{
  const i=issueQueueItem({number:138,title:'DO NOT echo receipt'},{
    priority:'P2',implementers:['AI-02'],needsInfo:[]
  },sha);
  const md=dashboard([i,{number:999,roles:['some attacker','AI-05'],priority:'BAD',status:'EVIL'}]);
  assert(md.includes('AREA-138'));
  assert(md.includes('AI-05'));
  assert(!md.includes('DO NOT echo'));
  assert(!md.includes('some attacker'));
  assert(!md.includes('EVIL'));
  assert(!md.includes('BAD'));
});
