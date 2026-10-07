const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const mobile=path.join(root,'mobile');
const config=JSON.parse(fs.readFileSync(path.join(mobile,'capacitor.config.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(mobile,'package.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'gateway/public/index.html'),'utf8');
const worker=fs.readFileSync(path.join(root,'gateway/src/worker.js'),'utf8');
const wrangler=fs.readFileSync(path.join(root,'gateway/wrangler.toml'),'utf8');

assert.equal(config.appId,'com.areamaibab.arealedger');
assert.equal(config.appName,'AREA Ledger');
assert.equal(path.resolve(mobile,config.webDir),path.join(root,'gateway/public'));
assert(fs.existsSync(path.join(mobile,config.webDir,'index.html')),'native container must bundle the first-party app');
assert(!config.server||!config.server.url,'store build must not load the product from a remote-only WebView URL');
assert.equal(config.server.androidScheme,'https');
assert.equal(config.server.hostname,'localhost');
assert.equal(pkg.dependencies['@capacitor/core'],'8.5.2');
assert.equal(pkg.dependencies['@capacitor/android'],'8.5.2');
assert.equal(pkg.dependencies['@capacitor/ios'],'8.5.2');

assert(html.includes("var KEY='site-ledger-v1'"),'accounting localStorage key must remain unchanged');
assert(html.includes("'site-ledger-db'"),'accounting IndexedDB name must remain unchanged');
assert(html.includes('function isNativeStoreApp()'));
assert(html.includes('function gatewayApiUrl(path)'));
assert(html.includes('fetch(gatewayApiUrl(path),opt)'),'cloud ledger requests must use the native production API base');
assert(html.includes("isNativeStoreApp()?aiGatewayProductionBase():location.origin"),'native API requests must use production only');
assert(html.includes('if(isNativeStoreApp())return aiGatewayProductionBase();'),'native OCR suggestion must never fall back to staging');
assert(html.includes("if(isNativeStoreApp()){toast('การเชื่อม Google ต้องกลับมาได้อย่างปลอดภัยในแอป · ฟังก์ชันนี้ยังไม่พร้อม');return false;}"),'native Google OAuth must fail closed until a verified app callback/deep link exists');
assert(worker.includes('allowedOrigins(env).includes(o)'));
assert(!/Access-Control-Allow-Origin['"]?\s*:\s*['"]\*/.test(worker),'CORS must not use a wildcard origin');

for(const origin of ['capacitor://localhost','https://localhost']){
  assert(wrangler.includes(origin),'missing exact native CORS origin '+origin);
}
assert(/ALLOWED_ORIGINS\s*=\s*"https:\/\/area-ledger-ai-gateway\.areamaibab\.workers\.dev,https:\/\/g\.areamaibab\.workers\.dev,capacitor:\/\/localhost,https:\/\/localhost"/.test(wrangler),'production origins must stay exact and staging-free');
assert(/\[env\.staging\.vars\][\s\S]*?ALLOWED_ORIGINS\s*=\s*"https:\/\/area-ledger-ai-gateway-staging\.areamaibab\.workers\.dev,capacitor:\/\/localhost,https:\/\/localhost"/.test(wrangler),'staging must remain on its own origin');

console.log('PASS native store package and storage/API boundary contract');
