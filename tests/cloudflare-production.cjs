const fs=require('node:fs'),assert=require('node:assert/strict');
const worker=fs.readFileSync('gateway/src/worker.js','utf8');
const wrangler=fs.readFileSync('gateway/wrangler.toml','utf8');
const readme=fs.readFileSync('README.md','utf8');
assert(worker.includes("/v1/platform/status"));
assert(worker.includes("productionReady"));
assert(worker.includes("/v1/ledger/reconcile"));
assert(worker.includes("/v1/files/list"));
assert(worker.includes("LEDGER_REVISION_CONFLICT"));
assert(worker.includes("/v1/ledger/restore-previous"));
assert(worker.includes("d1SemanticChecksum"));
assert(worker.includes("R2_NOT_CONFIGURED"));
assert(wrangler.includes('LEDGER_RATE_LIMIT_PER_MINUTE = "60"'));
assert(!/database_id\s*=\s*"(?!<REAL_)/.test(wrangler),'do not commit fabricated D1 IDs');
assert(!/bucket_name\s*=\s*"area-ledger-files-(?:staging|production)"/.test(wrangler),'resource bindings must be activated only with real Cloudflare resources');
assert(readme.includes('Cloudflare Production Candidate'));
console.log('PASS Cloudflare production contract');

assert(worker.includes("/v1/files/probe"));assert(worker.includes("r2Probe"));assert(worker.includes("productionReady"));
