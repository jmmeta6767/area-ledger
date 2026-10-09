// Keep one maintained source for small pure client modules while preserving the
// standalone/offline HTML distribution and existing VM regression harness.
const fs=require('node:fs'),assert=require('node:assert/strict');
const path='gateway/public/index.html',html=fs.readFileSync(path,'utf8');
const source=fs.readFileSync('gateway/client/expense-review.js','utf8').trim();
const pattern=/\/\* BEGIN expense-review module \*\/[\s\S]*?\/\* END expense-review module \*\//;
assert(pattern.test(html),'embedded module missing');
if(process.argv.includes('--write'))fs.writeFileSync(path,html.replace(pattern,source));
else assert.equal(html.match(pattern)[0],source,'run node tests/sync-client-modules.cjs --write');
console.log('PASS expense-review module distribution matches maintained source');
