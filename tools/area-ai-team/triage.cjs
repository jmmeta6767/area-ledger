'use strict';

// Deterministic, metadata-only issue intake. Never runs user-supplied code,
// invokes an AI provider, handles secrets, changes business data, or deploys.
const MARKER = '<!-- AREA_AI_TEAM_TRIAGE_V1 -->';
const ROLE_LABELS = Object.freeze({
  'AI-00': 'Commander / CTO',
  'AI-01': 'Architect',
  'AI-02': 'Frontend / iPhone UX',
  'AI-03': 'OCR / Vision',
  'AI-04': 'Accounting / BOQ',
  'AI-05': 'Independent QA',
  'AI-06': 'Security / Data',
  'AI-07': 'DevOps / Release',
  'AI-08': 'Documentation'
});
const DOMAINS = Object.freeze([
  { id:'AI-02', re:/iphone|safari|pwa|mobile|responsive|keyboard|layout|frontend|ui|ux|หน้าจอ|มือถือ|คีย์บอร์ด/i },
  { id:'AI-03', re:/ocr|vision|boq|scan|scann?ing|receipt|สแกน|ถอดแบบ|บิลเงินสด|ใบเสร็จ|ใบกำกับ/i },
  { id:'AI-04', re:/finance|accounting|cost|expense|income|budget|tax|payment|invoice|bill|boq|บัญชี|รายรับ|รายจ่าย|ค่าใช้จ่าย|ต้นทุน|การจ่าย/i },
  { id:'AI-06', re:/security|secret|token|auth|cors|privacy|permission|rbac|backup|migration|ความปลอดภัย|สิทธิ์|สำรองข้อมูล/i },
  { id:'AI-07', re:/deploy|release|production|cloudflare|worker|ci|cd|github.actions|staging|rollout|rollback|ขึ้นระบบ|ปล่อยรุ่น/i }
]);
function bounded(s, limit) { return typeof s === 'string' ? s.slice(0, limit) : ''; }
function planIssue(issue) {
  const title=bounded(issue && issue.title, 1000);
  const body=bounded(issue && issue.body, 10000);
  const content=title+'\n'+body;
  // Only an explicit P0...P3 statement sets severity. Missing is not inferred.
  const priorityMatch=title.match(/\[\s*(P[0-3])\s*\]/i) ||
    body.match(/(?:^|\n)\s*(?:priority|ความสำคัญ)\s*:\s*(P[0-3])\b/i);
  const priority=priorityMatch ? priorityMatch[1].toUpperCase() : 'UNSET';
  const implementers=DOMAINS.filter(x=>x.re.test(content)).map(x=>x.id);
  if(!implementers.length) implementers.push('AI-01');
  const highRisk=/production|deploy|release|cutover|delete|destroy|reset|migrat|restore|secret|token|auth|backup|ข้อมูลหาย|ลบข้อมูล|ย้ายข้อมูล|ขึ้นระบบ|ปล่อยรุ่น/i.test(content);
  const financeRisk=/ocr|boq|financial|accounting|expense|payment|receipt|invoice|finance|บิล|บัญชี|รายจ่าย|สแกน/i.test(content);
  const acceptancePresent=/(?:^|\n)\s*(?:acceptance(?:\s+criteria)?|definition of done|criteria|เกณฑ์ตรวจรับ|เงื่อนไขผ่าน|ต้องผ่าน)\s*[:\-]/im.test(body) ||
    /(?:^|\n)\s*[-*]\s*\[\s*\]\s*\S/.test(body);
  const needsInfo=[];
  if(priority==='UNSET')needsInfo.push('Explicit priority (P0 / P1 / P2 / P3)');
  if(!acceptancePresent)needsInfo.push('Concrete acceptance criteria');
  const issueNumber=Number.isSafeInteger(Number(issue && issue.number)) && Number(issue.number)>0 ? Number(issue.number):null;
  return Object.freeze({
    issueNumber, priority, implementers, reviewerRoles:['AI-00','AI-01','AI-05','AI-06','AI-07','AI-08'],
    highRisk, financeRisk, needsInfo,
    status:'PLANNED_ONLY',
    humanReviewRequired:true,
    productionAuthorization:'NOT_GRANTED',
    dataWriteAuthorization:'NOT_GRANTED'
  });
}
function renderComment(plan) {
  if(!plan || !Array.isArray(plan.implementers) || !Array.isArray(plan.reviewerRoles))throw new TypeError('Invalid AI task plan');
  const assigned=plan.implementers.map(id=>id+' — '+ROLE_LABELS[id]).join('; ');
  const gates=plan.reviewerRoles.map(id=>id+' — '+ROLE_LABELS[id]).join('; ');
  const lines=[
    MARKER,
    '### AREA AI TEAM — task intake (planning only)',
    '**Priority:** '+plan.priority+(plan.priority==='UNSET'?' (requires human triage)':''),
    '**Implementers to consider:** '+assigned,
    '**Review chain:** '+gates,
    '**Risk flags:** '+(plan.highRisk?'migration / security / release review; ':'')+(plan.financeRisk?'financial/OCR human-review and arithmetic gate':'no additional domain-specific risk detected'),
    '**Missing task detail:** '+(plan.needsInfo.length?plan.needsInfo.join('; '):'None detected by deterministic checks'),
    '**Required flow:** latest main SHA → architecture review → focused branch → implementation → self-test → independent QA → security review → PR → staging if runtime changes → explicit production authorization.',
    '**Automatic actions performed:** read issue fields and generate this planning comment only.',
    '**Not performed:** assigning or launching Codex, editing code, financial saves, merging a PR, deploying, or authorizing production.',
    '**Safety:** retain existing storage/backup contracts; unresolved OCR values must remain flagged for explicit user confirmation.',
    '_Repeated intake updates this bot comment instead of adding duplicates._'
  ];
  return lines.join('\n');
}
function findOwnComment(comments) {
  return Array.isArray(comments) ? comments.find(c=>c && c.user && c.user.login==='github-actions[bot]' &&
    typeof c.body==='string' && c.body.startsWith(MARKER)) : undefined;
}
module.exports={MARKER,ROLE_LABELS,planIssue,renderComment,findOwnComment};
