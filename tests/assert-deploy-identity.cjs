// Wrangler invokes this before upload, including direct Cloudflare Git builds.
// Only the release pipeline stamps the reviewed revision/environment.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../gateway/public/index.html'),'utf8');
const match=html.match(/var APP_BUILD=(\{[^\n]+\});/);
assert(match,'App build identity missing');
const build=JSON.parse(match[1]);
assert.match(build.sha||'',/^[a-f0-9]{40}$/,'Unstamped source cannot deploy: use the gated GitHub release workflow');
assert(['staging','production'].includes(build.environment),'Release environment missing');
console.log('Verified deployment identity',build.sha,build.environment);
