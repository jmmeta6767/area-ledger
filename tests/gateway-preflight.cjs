const fs=require('node:fs'),assert=require('node:assert/strict');
const w=fs.readFileSync('gateway/wrangler.toml','utf8'),src=fs.readFileSync('gateway/src/worker.js','utf8');
assert(w.includes('name = "GATEWAY_STATE"'));assert(w.includes('class_name = "GatewayState"'));assert(w.includes('[exports.GatewayState]'));assert(w.includes('storage = "sqlite"'));assert(w.includes('[env.staging]'));assert(w.includes('name = "area-ledger-ai-gateway-staging"'));
assert(src.includes('export class GatewayState'));assert(src.includes("path==='/rate'"));assert(src.includes("path==='/idem-get'"));assert(src.includes("path==='/idem-set'"));
assert(!/ALLOWED_ORIGINS\s*=/.test(w));assert(!/OCR_API_KEY\s*=/.test(w));assert(!/OCR_UPSTREAM_URL\s*=/.test(w));
console.log('PASS staging preflight (configuration intentionally external)');
