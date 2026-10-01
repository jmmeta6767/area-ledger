const fs=require('node:fs'),assert=require('node:assert/strict');

const app=fs.readFileSync('gateway/public/index.html','utf8');
const worker=fs.readFileSync('gateway/src/worker.js','utf8');

assert(app.includes("APP_RELEASE=520"),'app release must be v500');
assert(app.includes("CLOUD_KEY_NAME='area-ledger-cloud-key-v1'"),'cloud capability key missing');
assert(app.includes("CLOUD_ENABLED_NAME='area-ledger-cloud-sync-enabled-v1'"),'cloud opt-in flag missing');
assert(app.includes("function cloudSyncEnableCurrent()"),'explicit cloud activation missing');
assert(app.includes("function cloudSyncPush("),'cloud push missing');
assert(app.includes("function cloudSyncPull("),'cloud pull missing');
assert(app.includes("cloudSyncSchedule(350)"),'persist must enqueue cloud mirror when enabled');
assert(app.includes("data-act=\"cloudEnable\""),'backup/recovery UI must expose opt-in cloud sync');
assert(app.includes("data-act=\"cloudPull\""),'cloud recovery action missing');
assert(app.includes("data-act=\"cloudCopyKey\""),'cloud recovery key export missing');
assert(app.includes("data-act=\"cloudRestorePrevious\""),'cloud previous-revision restore action missing');
assert(worker.includes("/v1/ledger/history"),'cloud history route missing');
assert(worker.includes("/v1/ledger/restore-previous"),'cloud previous restore route missing');
assert(app.includes("U.cloudConflict"),'client conflict guard missing');
assert(app.includes("expectedChecksum"),'client checksum CAS token missing');
assert(!/localStorage\.setItem\(CLOUD_ENABLED_NAME,'1'\)[\s\S]{0,120}boot\(\)/.test(app),'boot must not silently enable cloud sync');
assert(worker.includes("LEDGER_REVISION_CONFLICT"),'server conflict response missing');
assert(worker.includes("expectedChecksum"),'server checksum CAS missing');
assert(worker.includes("ledger:manifest"),'durable manifest missing');
assert(worker.includes("ledger:chunk:"),'chunked durable payload missing');
assert(!/X-AREA-Ledger-Key['"]?\s*:\s*['"][A-Za-z0-9_-]{32,}['"]/.test(worker),'ledger key must never be committed');
console.log('PASS Cloudflare ledger sync contract');
