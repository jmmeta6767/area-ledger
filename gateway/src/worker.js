const MAX_BODY_BYTES=3*1024*1024,MAX_PROVIDER_BYTES=256*1024,MAX_LEDGER_BYTES=12*1024*1024,LEDGER_CHUNK_BYTES=64*1024,WINDOW_MS=60_000,PROTOCOL_VERSION='1';
const buckets=new Map(),idempotency=new Map();
function requestId(r){const x=r.headers.get('X-AREA-Request-ID')||'';return /^[A-Za-z0-9._:-]{8,96}$/.test(x)?x:crypto.randomUUID();}
function json(data,status=200,origin='',rid=''){const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin','X-AREA-Gateway-Version':PROTOCOL_VERSION};if(rid)headers['X-AREA-Request-ID']=rid;if(origin){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, PUT, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, X-AREA-Gateway-Version, X-AREA-Request-ID, X-AREA-Ledger-Key';headers['Access-Control-Expose-Headers']='X-AREA-Gateway-Version, X-AREA-Request-ID';headers['Access-Control-Max-Age']='600';}return new Response(status===204?null:JSON.stringify(data),{status,headers});}
function allowedOrigins(env){return String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);}
function corsOrigin(r,env){const o=r.headers.get('Origin')||'';if(!o)return '';const self=new URL(r.url).origin;return o===self||allowedOrigins(env).includes(o)?o:'';}
function protocolOk(r){return r.headers.get('X-AREA-Gateway-Version')===PROTOCOL_VERSION;}
function ledgerAccessKey(r){const k=String(r.headers.get('X-AREA-Ledger-Key')||'').trim();return /^[A-Za-z0-9_-]{32,128}$/.test(k)?k:'';}
async function sha256Hex(text){const b=new TextEncoder().encode(String(text||'')),h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('');}
async function ledgerStub(env,key){if(!env.GATEWAY_STATE)return null;const name='ledger:'+await sha256Hex(key),id=env.GATEWAY_STATE.idFromName(name);return env.GATEWAY_STATE.get(id);}
async function ledgerCall(env,key,path,body){const stub=await ledgerStub(env,key);if(!stub)return null;return stub.fetch('https://internal/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});}
async function readLedgerJson(r){const len=Number(r.headers.get('Content-Length')||0);if(len&&len>MAX_LEDGER_BYTES)throw Error('LEDGER_PAYLOAD_TOO_LARGE');const text=await r.text();if(new TextEncoder().encode(text).byteLength>MAX_LEDGER_BYTES)throw Error('LEDGER_PAYLOAD_TOO_LARGE');try{return JSON.parse(text);}catch(_){throw Error('LEDGER_JSON_INVALID');}}
function normalizeLedgerStateBody(body){const state=body&&body.state;if(!state||typeof state!=='object'||Array.isArray(state)||!Array.isArray(state.projects)||!Array.isArray(state.tx))throw Error('LEDGER_STATE_INVALID');const revision=Math.max(0,Number(state.dataRevision)||0),updatedAt=Math.max(0,Number(state.updatedAt)||0),expectedRevision=body.expectedRevision==null?null:Math.max(0,Number(body.expectedRevision)||0),expectedChecksum=String(body.expectedChecksum||'').toLowerCase();if(expectedChecksum&&!/^[0-9a-f]{64}$/.test(expectedChecksum))throw Error('LEDGER_EXPECTED_CHECKSUM_INVALID');return {state,revision,updatedAt,expectedRevision,expectedChecksum};}
function clientKey(r){return r.headers.get('CF-Connecting-IP')||'unknown';}
async function durableCall(binding,path,body){if(!binding)return null;const id=binding.idFromName(body.key),stub=binding.get(id),res=await stub.fetch('https://internal/'+path,{method:'POST',body:JSON.stringify(body)});return res.ok?res.json():null;}
async function rateAllowed(r,env){const limit=Math.max(1,Math.min(120,Number(env.RATE_LIMIT_PER_MINUTE)||20)),key=clientKey(r);if(String(env.REQUIRE_DURABLE_STATE||'').toLowerCase()==='true'&&!env.GATEWAY_STATE)return null;const durable=await durableCall(env.GATEWAY_STATE,'rate',{key,limit,windowMs:WINDOW_MS});if(durable)return durable.allowed===true;const now=Date.now(),old=buckets.get(key);if(!old||now-old.start>=WINDOW_MS){buckets.set(key,{start:now,count:1});return true;}old.count++;return old.count<=limit;}
async function readJson(r){const len=Number(r.headers.get('Content-Length')||0);if(len&&len>MAX_BODY_BYTES)throw Error('PAYLOAD_TOO_LARGE');const text=await r.text();if(text.length>MAX_BODY_BYTES)throw Error('PAYLOAD_TOO_LARGE');return JSON.parse(text);}
function validateExpense(b){const image=b&&b.image;if(typeof image!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(image))throw Error('INVALID_IMAGE');return {image,lang:'tha+eng'};}
function safeProviderUrl(raw){raw=String(raw||'').trim();if(!raw)return '';try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error();return u.href;}catch(_){throw Error('PROVIDER_URL_INVALID');}}
function providerConfig(env){const kind=String(env.OCR_PROVIDER||'generic').toLowerCase();if(!['generic','gemini'].includes(kind))throw Error('PROVIDER_UNSUPPORTED');const model=String(env.GEMINI_MODEL||'gemini-2.5-flash').trim();return {kind,model,url:kind==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent':safeProviderUrl(env.OCR_UPSTREAM_URL),key:String(env.OCR_API_KEY||''),timeout:Math.max(3000,Math.min(20000,Number(env.PROVIDER_TIMEOUT_MS)||10000)),retries:Math.max(0,Math.min(1,Number(env.PROVIDER_RETRIES)||1))};}
function providerReady(env){try{const p=providerConfig(env);return !!p.key&&(p.kind==='gemini'||!!p.url);}catch(_){return false;}}
function providerRequest(p,payload,rid){if(p.kind==='gemini'){const m=String(payload.image||'').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);if(!m)throw Error('INVALID_IMAGE');const prompt='อ่านข้อความจากใบเสร็จ/บิลภาษาไทยหรืออังกฤษให้ครบ แล้วตอบ JSON เท่านั้น: {"text":"ข้อความ OCR ทั้งหมด","amount":ยอดสุทธิเป็นตัวเลขหรือ 0,"cat":"หมวดรายจ่ายสั้นๆ","sub":"รายละเอียดสั้นๆ","partner":"ชื่อร้าน/คู่ค้า"} ห้ามเดาข้อมูลที่มองไม่เห็น';return {url:p.url,headers:{'Content-Type':'application/json','x-goog-api-key':p.key,'X-AREA-Request-ID':rid},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},{inline_data:{mime_type:m[1].toLowerCase(),data:m[2]}}]}],generationConfig:{responseMimeType:'application/json',temperature:0}})};}return {url:p.url,headers:{'Content-Type':'application/json','Authorization':'Bearer '+p.key,'X-AREA-Request-ID':rid},body:JSON.stringify(payload)};}
function cleanExpense(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('PROVIDER_INVALID_RESPONSE');const amount=Number(data.amount)||0;if(!isFinite(amount)||amount<0)throw Error('PROVIDER_INVALID_RESPONSE');return {text:String(data.text||'').slice(0,20000),amount,cat:String(data.cat||'ค่าของ').slice(0,80),sub:String(data.sub||'').slice(0,160),partner:String(data.partner||'').slice(0,160)};}
function geminiExpense(data){const parts=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts,text=Array.isArray(parts)?parts.map(x=>x&&x.text||'').join('').trim():'';if(!text)throw Error('PROVIDER_INVALID_RESPONSE');try{return cleanExpense(JSON.parse(text.replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'')));}catch(e){if(String(e&&e.message)==='PROVIDER_INVALID_RESPONSE')throw e;throw Error('PROVIDER_INVALID_RESPONSE');}}
function retryableStatus(s){return s===408||s===429||s>=500;}
async function providerFetch(p,payload,rid){let last;for(let attempt=0;attempt<=p.retries;attempt++){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),p.timeout);try{const rq=providerRequest(p,payload,rid),res=await fetch(rq.url,{method:'POST',headers:rq.headers,body:rq.body,signal:ctrl.signal});if(res.ok)return res;if(!retryableStatus(res.status)||attempt>=p.retries)throw Error('PROVIDER_HTTP_'+res.status);last=Error('PROVIDER_HTTP_'+res.status);}catch(e){last=e;if(attempt>=p.retries||String(e&&e.message||'').startsWith('PROVIDER_HTTP_')&&!retryableStatus(Number(String(e.message).split('_').pop())))throw e;}finally{clearTimeout(timer);}}throw last||Error('PROVIDER_FAILED');}
async function readProviderJson(res){const len=Number(res.headers.get('Content-Length')||0);if(len&&len>MAX_PROVIDER_BYTES)throw Error('PROVIDER_RESPONSE_TOO_LARGE');const text=await res.text();if(new TextEncoder().encode(text).byteLength>MAX_PROVIDER_BYTES)throw Error('PROVIDER_RESPONSE_TOO_LARGE');try{return JSON.parse(text);}catch(_){throw Error('PROVIDER_INVALID_RESPONSE');}}
async function expenseOcr(payload,env,rid){const p=providerConfig(env);if(!p.key||(p.kind==='generic'&&!p.url))throw Error('PROVIDER_NOT_CONFIGURED');const res=await providerFetch(p,payload,rid),data=await readProviderJson(res);return p.kind==='gemini'?geminiExpense(data):cleanExpense(data);}
async function idemGet(env,key){const d=await durableCall(env.GATEWAY_STATE,'idem-get',{key,windowMs:WINDOW_MS});if(d)return d.hit?d.value:null;const x=idempotency.get(key);if(!x)return null;if(Date.now()-x.at>WINDOW_MS){idempotency.delete(key);return null;}return x.value;}
async function idemSet(env,key,value){const d=await durableCall(env.GATEWAY_STATE,'idem-set',{key,windowMs:WINDOW_MS,value});if(d)return;idempotency.set(key,{at:Date.now(),value});if(idempotency.size>500)idempotency.delete(idempotency.keys().next().value);}
function auditMeta(rid,origin,status,started,provider){return {requestId:rid,origin,status,provider,durationMs:Date.now()-started,at:new Date().toISOString()};}
async function audit(env,meta){if(!env.GATEWAY_AUDIT)return;try{await env.GATEWAY_AUDIT.put('audit/'+meta.at+'/'+meta.requestId+'.json',JSON.stringify(meta),{httpMetadata:{contentType:'application/json'}});}catch(_){}}
export class GatewayState {
  constructor(state){this.state=state;}
  async fetch(request){
    const path=new URL(request.url).pathname,body=await request.json(),now=Date.now(),storage=this.state.storage;
    if(path==='/rate'){
      const k='rate:'+body.key,old=await storage.get(k),windowMs=Math.max(1000,+body.windowMs||WINDOW_MS),limit=Math.max(1,+body.limit||20);
      const next=!old||now-old.start>=windowMs?{start:now,count:1}:{start:old.start,count:old.count+1};
      await storage.put(k,next);await storage.setAlarm(now+windowMs*2);
      return json({allowed:next.count<=limit});
    }
    if(path==='/idem-get'){
      const ik='idem:'+body.key,x=await storage.get(ik),windowMs=Math.max(1000,+body.windowMs||WINDOW_MS);if(!x)return json({hit:false});if(now-x.at>windowMs){await storage.delete(ik);return json({hit:false});}
      return json({hit:true,value:x.value});
    }
    if(path==='/idem-set'){
      const windowMs=Math.max(1000,+body.windowMs||WINDOW_MS);await storage.put('idem:'+body.key,{at:now,value:body.value});await storage.setAlarm(now+windowMs);return json({ok:true});
    }
    if(path==='/ledger-meta'){
      const m=await storage.get('ledger:manifest');return json(m?{hit:true,meta:m}:{hit:false});
    }
    if(path==='/ledger-get'){
      const m=await storage.get('ledger:manifest');if(!m)return json({hit:false});
      const parts=[];let total=0;
      for(let i=0;i<m.chunks;i++){const v=await storage.get('ledger:chunk:'+m.generation+':'+i);if(v==null)return json({error:'LEDGER_CHUNK_MISSING'},500);const u=v instanceof Uint8Array?v:new Uint8Array(v);parts.push(u);total+=u.byteLength;}
      const all=new Uint8Array(total);let off=0;for(const p of parts){all.set(p,off);off+=p.byteLength;}
      const payload=new TextDecoder().decode(all);return json({hit:true,meta:m,payload});
    }
    if(path==='/ledger-put'){
      const payload=String(body.payload||''),bytes=new TextEncoder().encode(payload);if(!payload||bytes.byteLength>MAX_LEDGER_BYTES)return json({error:'LEDGER_PAYLOAD_TOO_LARGE'},413);
      let parsed;try{parsed=JSON.parse(payload);}catch(_){return json({error:'LEDGER_JSON_INVALID'},400);}
      if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.projects)||!Array.isArray(parsed.tx))return json({error:'LEDGER_STATE_INVALID'},400);
      const current=await storage.get('ledger:manifest'),expected=body.expectedRevision==null?null:Math.max(0,+body.expectedRevision||0),incoming=Math.max(0,+body.revision||0);
      if(current&&expected!==null&&expected!==current.revision)return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      if(current&&!body.expectedChecksum)return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      if(current&&String(body.expectedChecksum).toLowerCase()!==String(current.checksum||'').toLowerCase())return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      if(!current&&expected!==null&&expected!==0)return json({error:'LEDGER_REVISION_CONFLICT',current:null},409);
      if(current&&incoming<current.revision)return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      const generation=crypto.randomUUID(),chunks=Math.max(1,Math.ceil(bytes.byteLength/LEDGER_CHUNK_BYTES)),checksum=await sha256Hex(payload);
      for(let i=0;i<chunks;i++){const part=bytes.slice(i*LEDGER_CHUNK_BYTES,Math.min(bytes.byteLength,(i+1)*LEDGER_CHUNK_BYTES));await storage.put('ledger:chunk:'+generation+':'+i,part);}
      const manifest={revision:incoming,updatedAt:Math.max(0,+body.updatedAt||0),checksum,bytes:bytes.byteLength,chunks,generation,savedAt:new Date().toISOString()};
      await storage.put('ledger:manifest',manifest);
      if(current&&current.generation&&current.generation!==generation){for(let i=0;i<(current.chunks||0);i++)await storage.delete('ledger:chunk:'+current.generation+':'+i);}
      return json({ok:true,meta:manifest});
    }
    return json({error:'STATE_ROUTE_NOT_FOUND'},404);
  }
  async alarm(){await this.state.storage.deleteAll();}
}
export default{async fetch(request,env){
  const started=Date.now(),url=new URL(request.url),rid=requestId(request);
  if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,service:'area-ledger-ai-gateway',protocol:PROTOCOL_VERSION,providerConfigured:providerReady(env),durableState:!!env.GATEWAY_STATE,cloudLedger:!!env.GATEWAY_STATE,auditSink:!!env.GATEWAY_AUDIT},200,'',rid);
  if(url.pathname==='/ready'&&request.method==='GET'){const providerConfigured=providerReady(env),durableState=!!env.GATEWAY_STATE,allowedOriginCount=allowedOrigins(env).length,ready=providerConfigured&&durableState;return json({ok:ready,service:'area-ledger-ai-gateway',protocol:PROTOCOL_VERSION,providerConfigured,durableState,cloudLedger:durableState,sameOriginAllowed:true,allowedOriginCount,auditSink:!!env.GATEWAY_AUDIT},ready?200:503,'',rid);}
  const origin=corsOrigin(request,env),sentOrigin=request.headers.get('Origin')||'';
  if(request.method==='OPTIONS')return origin?json({ok:true,protocol:PROTOCOL_VERSION},204,origin,rid):json({error:'ORIGIN_DENIED'},403,'',rid);
  if(url.pathname==='/v1/ledger/state'||url.pathname==='/v1/ledger/status'){
    if(sentOrigin&&!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
    if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
    const access=ledgerAccessKey(request);if(!access)return json({error:'LEDGER_KEY_REQUIRED'},401,origin,rid);
    if(!env.GATEWAY_STATE)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);
    try{
      if(url.pathname==='/v1/ledger/status'&&request.method==='GET'){const r=await ledgerCall(env,access,'ledger-meta',{});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const x=await r.json();return json({ok:true,hit:!!x.hit,meta:x.meta||null},r.status,origin,rid);}
      if(url.pathname==='/v1/ledger/state'&&request.method==='GET'){const r=await ledgerCall(env,access,'ledger-get',{});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const x=await r.json();if(!r.ok)return json(x,r.status,origin,rid);if(!x.hit)return json({ok:true,hit:false,meta:null,state:null},200,origin,rid);let state;try{state=JSON.parse(x.payload);}catch(_){return json({error:'LEDGER_CLOUD_CORRUPT'},500,origin,rid);}return json({ok:true,hit:true,meta:x.meta,state},200,origin,rid);}
      if(url.pathname==='/v1/ledger/state'&&request.method==='PUT'){const b=normalizeLedgerStateBody(await readLedgerJson(request)),payload=JSON.stringify(b.state);if(new TextEncoder().encode(payload).byteLength>MAX_LEDGER_BYTES)throw Error('LEDGER_PAYLOAD_TOO_LARGE');const r=await ledgerCall(env,access,'ledger-put',{payload,revision:b.revision,updatedAt:b.updatedAt,expectedRevision:b.expectedRevision,expectedChecksum:b.expectedChecksum});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const x=await r.json();return json(x,r.status,origin,rid);}
      return json({error:'METHOD_NOT_ALLOWED'},405,origin,rid);
    }catch(e){const code=String(e&&e.message||'LEDGER_ERROR'),status=code==='LEDGER_PAYLOAD_TOO_LARGE'?413:code==='LEDGER_JSON_INVALID'||code==='LEDGER_STATE_INVALID'?400:500;return json({error:code},status,origin,rid);}
  }
  if(url.pathname!=='/v1/ocr/expense'||request.method!=='POST')return json({error:'NOT_FOUND'},404,'',rid);
  if(!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
  if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
  const rate=await rateAllowed(request,env);if(rate===null)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);if(!rate)return json({error:'RATE_LIMITED'},429,origin,rid);
  const key=origin+'|'+rid,cached=await idemGet(env,key);if(cached)return json(cached,200,origin,rid);
  let status=200;
  try{const payload=validateExpense(await readJson(request)),result=await expenseOcr(payload,env,rid);await idemSet(env,key,result);return json(result,200,origin,rid);}
  catch(e){const code=e&&e.name==='AbortError'?'PROVIDER_TIMEOUT':String(e&&e.message||'GATEWAY_ERROR');status=code==='PAYLOAD_TOO_LARGE'?413:code==='INVALID_IMAGE'?400:code==='PROVIDER_NOT_CONFIGURED'||code==='DURABLE_STATE_REQUIRED'?503:code==='PROVIDER_UNSUPPORTED'?501:code==='PROVIDER_TIMEOUT'?504:502;return json({error:code},status,origin,rid);}
  finally{await audit(env,auditMeta(rid,origin,status,started,String(env.OCR_PROVIDER||'generic')));}
}};
