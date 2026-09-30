const MAX_BODY_BYTES = 3 * 1024 * 1024;
const WINDOW_MS = 60_000;
const PROTOCOL_VERSION = '1';
const buckets = new Map();
const idempotency = new Map();

function requestId(request) {
  const supplied = request.headers.get('X-AREA-Request-ID') || '';
  return /^[A-Za-z0-9._:-]{8,96}$/.test(supplied) ? supplied : crypto.randomUUID();
}
function json(data, status = 200, origin = '', rid = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer','Vary':'Origin','X-AREA-Gateway-Version':PROTOCOL_VERSION
  };
  if (rid) headers['X-AREA-Request-ID'] = rid;
  if (origin) {
    headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='POST, OPTIONS';
    headers['Access-Control-Allow-Headers']='Content-Type, X-AREA-Gateway-Version, X-AREA-Request-ID';
    headers['Access-Control-Expose-Headers']='X-AREA-Gateway-Version, X-AREA-Request-ID';headers['Access-Control-Max-Age']='600';
  }
  return new Response(JSON.stringify(data),{status,headers});
}
function allowedOrigins(env){return String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);}
function corsOrigin(request,env){const origin=request.headers.get('Origin')||'';return origin&&allowedOrigins(env).includes(origin)?origin:'';}
function protocolOk(request){return request.headers.get('X-AREA-Gateway-Version')===PROTOCOL_VERSION;}
function rateKey(request){return request.headers.get('CF-Connecting-IP')||'unknown';}
function rateAllowed(request,env){const limit=Math.max(1,Math.min(120,Number(env.RATE_LIMIT_PER_MINUTE)||20)),now=Date.now(),key=rateKey(request),old=buckets.get(key);if(!old||now-old.start>=WINDOW_MS){buckets.set(key,{start:now,count:1});return true;}old.count+=1;return old.count<=limit;}
async function readJson(request){const len=Number(request.headers.get('Content-Length')||0);if(len&&len>MAX_BODY_BYTES)throw new Error('PAYLOAD_TOO_LARGE');const text=await request.text();if(text.length>MAX_BODY_BYTES)throw new Error('PAYLOAD_TOO_LARGE');return JSON.parse(text);}
function validateExpense(body){const image=body&&body.image;if(typeof image!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(image))throw new Error('INVALID_IMAGE');return {image,lang:'tha+eng'};}
function providerConfig(env){const kind=String(env.OCR_PROVIDER||'generic').toLowerCase();if(!['generic'].includes(kind))throw new Error('PROVIDER_UNSUPPORTED');return {kind,url:String(env.OCR_UPSTREAM_URL||''),key:String(env.OCR_API_KEY||'')};}
async function expenseOcr(payload,env,rid){
  const p=providerConfig(env);if(!p.url||!p.key)throw new Error('PROVIDER_NOT_CONFIGURED');
  const response=await fetch(p.url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+p.key,'X-AREA-Request-ID':rid},body:JSON.stringify(payload)});
  if(!response.ok)throw new Error('PROVIDER_HTTP_'+response.status);const data=await response.json();
  return {text:String(data.text||'').slice(0,20000),amount:Math.max(0,Number(data.amount)||0),cat:String(data.cat||'ค่าของ').slice(0,80),sub:String(data.sub||'').slice(0,160),partner:String(data.partner||'').slice(0,160)};
}
function idemGet(key){const x=idempotency.get(key);if(!x)return null;if(Date.now()-x.at>WINDOW_MS){idempotency.delete(key);return null;}return x.value;}
function idemSet(key,value){idempotency.set(key,{at:Date.now(),value});if(idempotency.size>500)idempotency.delete(idempotency.keys().next().value);}
export default {async fetch(request,env){
  const url=new URL(request.url),rid=requestId(request);
  if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,service:'area-ledger-ai-gateway',protocol:PROTOCOL_VERSION,providerConfigured:!!(env.OCR_UPSTREAM_URL&&env.OCR_API_KEY)},200,'',rid);
  const origin=corsOrigin(request,env);
  if(request.method==='OPTIONS')return origin?json({ok:true,protocol:PROTOCOL_VERSION},204,origin,rid):json({error:'ORIGIN_DENIED'},403,'',rid);
  if(url.pathname!=='/v1/ocr/expense'||request.method!=='POST')return json({error:'NOT_FOUND'},404,'',rid);
  if(!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
  if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
  if(!rateAllowed(request,env))return json({error:'RATE_LIMITED'},429,origin,rid);
  const idemKey=origin+'|'+rid,cached=idemGet(idemKey);if(cached)return json(cached,200,origin,rid);
  try{const payload=validateExpense(await readJson(request)),result=await expenseOcr(payload,env,rid);idemSet(idemKey,result);return json(result,200,origin,rid);}
  catch(error){const code=String(error&&error.message||'GATEWAY_ERROR'),status=code==='PAYLOAD_TOO_LARGE'?413:code==='INVALID_IMAGE'?400:code==='PROVIDER_NOT_CONFIGURED'?503:code==='PROVIDER_UNSUPPORTED'?501:502;return json({error:code},status,origin,rid);}
}};
