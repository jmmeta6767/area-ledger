const fs=require('node:fs'),assert=require('node:assert/strict');
const w=fs.readFileSync('gateway/wrangler.toml','utf8');
const y=fs.readFileSync('.github/workflows/cloudflare-deploy.yml','utf8');
const worker=fs.readFileSync('gateway/src/worker.js','utf8');
assert((w.match(/\[\[d1_databases\]\]/g)||[]).length===1);
assert((w.match(/\[\[r2_buckets\]\]/g)||[]).length===1);
assert((w.match(/\[\[env\.staging\.d1_databases\]\]/g)||[]).length===1);
assert((w.match(/\[\[env\.staging\.r2_buckets\]\]/g)||[]).length===1);
assert(w.includes('database_name = "area-ledger-ai-gateway-staging-ledger-db"'));
assert(w.includes('database_id = "9fed2450-55f1-4ec3-ba5f-1e12293bb10a"'));
const prodBlock=w.split('[[d1_databases]]')[1].split('[[r2_buckets]]')[0];assert(!/database_id\s*=/.test(prodBlock),'production D1 remains auto-provisionable until real production resource exists');
assert(w.includes('bucket_name = "area-ledger-ai-gateway-staging-ledger-files"'));
const prodR2=w.split('[[r2_buckets]]')[1].split('[env.staging]')[0];assert(!/bucket_name\s*=/.test(prodR2),'production R2 remains auto-provisionable until real production resource exists');
assert(w.includes('binding = "LEDGER_DB"'));
assert(w.includes('binding = "LEDGER_FILES"'));
assert(y.includes('workflow_dispatch:'));
assert(y.includes("wrangler@4.145.0 deploy --env staging"));
assert(y.includes("d1 migrations apply LEDGER_DB --remote --env staging"));
assert(y.includes("wrangler@4.145.0 d1 migrations apply LEDGER_DB --remote"));
assert(y.includes('CLOUDFLARE_API_TOKEN'));
assert(y.includes('CLOUDFLARE_ACCOUNT_ID'));
assert(y.includes('OCR_API_KEY'));
assert(y.includes('secret put OCR_API_KEY --env staging'));
assert(y.includes('secret put OCR_API_KEY'));
assert(worker.includes('async function d1SchemaReady'));
assert(worker.includes('async function productionPlatformStatus'));
assert(worker.includes('await productionPlatformStatus(env)'));
console.log('PASS Cloudflare deploy pipeline contract');

assert(fs.readFileSync('gateway/public/index.html','utf8').includes('APP_RELEASE=800'));

assert(y.includes('node tests/v700-business-stable.cjs'));

assert(y.includes('node tests/live-cloudflare-acceptance.mjs'));
const auto=fs.readFileSync('.github/workflows/staging-auto-deploy.yml','utf8');
assert(auto.includes('push:'));
assert(auto.includes('environment: staging'));
assert(auto.includes('wrangler@4.145.0 deploy --env staging'));
assert(auto.includes('node tests/live-cloudflare-acceptance.mjs'));

assert(y.includes('node tests/v800-business-stable.cjs'));
assert(y.includes('node --check tests/live-cloudflare-acceptance.mjs'));

assert(w.includes('ALLOWED_ORIGINS = "https://area-ledger-ai-gateway-staging.areamaibab.workers.dev"'));
assert(y.includes('confirm_production'));
assert(y.includes('DEPLOY_PRODUCTION'));
assert(y.includes('Live production acceptance'));
assert(y.includes('https://area-ledger-ai-gateway.areamaibab.workers.dev'));
for(const k of ['AREA_LEDGER_ACCEPTANCE_TARGET','AREA_LEDGER_ACCEPTANCE_SHA','AREA_LEDGER_ACCEPTANCE_RUN']){assert(y.includes(k));assert(auto.includes(k));}
assert(y.includes('AREA_LEDGER_ACCEPTANCE_TARGET: staging'));
assert(y.includes('AREA_LEDGER_ACCEPTANCE_TARGET: production'));
assert(auto.includes('AREA_LEDGER_ACCEPTANCE_TARGET: staging'));
