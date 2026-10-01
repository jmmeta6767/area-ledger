const fs=require('node:fs'),assert=require('node:assert/strict');

const cloud=fs.readFileSync('gateway/public/index.html','utf8');
const cloudSw=fs.readFileSync('gateway/public/sw.js','utf8');
const legacy=fs.readFileSync('index.html','utf8');
const legacySw=fs.readFileSync('sw.js','utf8');
const wrangler=fs.readFileSync('gateway/wrangler.toml','utf8');
const qa=fs.readFileSync('tests/qa.cjs','utf8');
const workflow=fs.readFileSync('.github/workflows/qa.yml','utf8');

assert(cloud.includes("APP_RELEASE=450"),'Cloudflare app release must be v450');
assert(cloud.includes("sw.js?v=450"),'Cloudflare app must register v450 SW');
assert(cloudSw.includes("site-ledger-v450-project-form-mobile-focus"),'Cloudflare cache must be v450');
assert(wrangler.includes('directory = "./public"'),'Wrangler must serve gateway/public');
assert(wrangler.includes('name = "area-ledger-ai-gateway-staging"'),'Cloudflare staging environment missing');

assert.notEqual(legacy,cloud,'root and Cloudflare runtime must be intentionally separated');
assert(legacy.includes('LEGACY RECOVERY ONLY'),'root must be recovery-only');
assert(legacy.includes("site-ledger-v1"),'legacy recovery must be able to read original localStorage key');
assert(legacy.includes("site-ledger-db"),'legacy recovery must be able to read original IndexedDB');
assert(!legacy.includes('APP_RELEASE='),'root must not be an active AREA Ledger app');
assert(legacySw.includes('area-ledger-legacy-recovery-v1'),'root service worker must be recovery-only');

assert(qa.includes("fs.readFileSync('gateway/public/index.html','utf8')"),'regression QA must target Cloudflare runtime');
assert(workflow.includes('node --check gateway/public/sw.js'),'workflow must syntax-check Cloudflare SW');
assert(!workflow.includes('render deploy'),'workflow must not deploy Render');
console.log('PASS Cloudflare-only deployment contract');
