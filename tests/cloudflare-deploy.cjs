const fs=require('node:fs'),assert=require('node:assert/strict');
const w=fs.readFileSync('gateway/wrangler.toml','utf8');
const y=fs.readFileSync('.github/workflows/cloudflare-deploy.yml','utf8');
const worker=fs.readFileSync('gateway/src/worker.js','utf8');
assert((w.match(/\[\[d1_databases\]\]/g)||[]).length===1);
assert((w.match(/\[\[r2_buckets\]\]/g)||[]).length===1);
assert((w.match(/\[\[env\.staging\.d1_databases\]\]/g)||[]).length===1);
assert((w.match(/\[\[env\.staging\.r2_buckets\]\]/g)||[]).length===1);
assert(!/database_id\s*=/.test(w),'draft D1 binding must not commit an ID');
assert(!/bucket_name\s*=/.test(w),'draft R2 binding must not commit a bucket name');
assert(w.includes('binding = "LEDGER_DB"'));
assert(w.includes('binding = "LEDGER_FILES"'));
assert(y.includes('workflow_dispatch:'));
assert(y.includes("wrangler@latest deploy --env staging"));
assert(y.includes("d1 migrations apply LEDGER_DB --remote --env staging"));
assert(y.includes("wrangler@latest d1 migrations apply LEDGER_DB --remote"));
assert(y.includes('CLOUDFLARE_API_TOKEN'));
assert(y.includes('CLOUDFLARE_ACCOUNT_ID'));
assert(y.includes('OCR_API_KEY'));
assert(y.includes('secret put OCR_API_KEY --env staging'));
assert(y.includes('secret put OCR_API_KEY'));
assert(worker.includes('async function d1SchemaReady'));
assert(worker.includes('async function productionPlatformStatus'));
assert(worker.includes('await productionPlatformStatus(env)'));
console.log('PASS Cloudflare deploy pipeline contract');

assert(fs.readFileSync('gateway/public/index.html','utf8').includes('APP_RELEASE=700'));

assert(y.includes('node tests/v700-business-stable.cjs'));
