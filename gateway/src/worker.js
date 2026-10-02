const MAX_BODY_BYTES=3*1024*1024,MAX_PROVIDER_BYTES=256*1024,MAX_LEDGER_BYTES=12*1024*1024,LEDGER_CHUNK_BYTES=64*1024,MAX_FILE_BYTES=4*1024*1024,WINDOW_MS=60_000,PROTOCOL_VERSION='1';
const buckets=new Map(),idempotency=new Map();
function requestId(r){const x=r.headers.get('X-AREA-Request-ID')||'';return /^[A-Za-z0-9._:-]{8,96}$/.test(x)?x:crypto.randomUUID();}
function json(data,status=200,origin='',rid=''){const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin','X-AREA-Gateway-Version':PROTOCOL_VERSION};if(rid)headers['X-AREA-Request-ID']=rid;if(origin){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, PUT, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, X-AREA-Gateway-Version, X-AREA-Request-ID, X-AREA-Ledger-Key';headers['Access-Control-Expose-Headers']='X-AREA-Gateway-Version, X-AREA-Request-ID';headers['Access-Control-Max-Age']='600';}return new Response(status===204?null:JSON.stringify(data),{status,headers});}
function allowedOrigins(env){return String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);}
function corsOrigin(r,env){const o=r.headers.get('Origin')||'';if(!o)return '';const self=new URL(r.url).origin;return o===self||allowedOrigins(env).includes(o)?o:'';}
function protocolOk(r){return r.headers.get('X-AREA-Gateway-Version')===PROTOCOL_VERSION;}
function ledgerAccessKey(r){const k=String(r.headers.get('X-AREA-Ledger-Key')||'').trim();return /^[A-Za-z0-9_-]{32,128}$/.test(k)?k:'';}
async function sha256Hex(text){const b=new TextEncoder().encode(String(text||'')),h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('');}
const LEDGER_COLLECTIONS=['projects','tx','boq','guarantees','materialApprovals','siteEvents','contractChanges','timeExtensions','accountingPeriods','bankReconciliations','auditLog','manualJournals','chartAccounts','quotes','bills','receipts'];
function d1Ready(env){return !!(env&&env.LEDGER_DB&&typeof env.LEDGER_DB.prepare==='function'&&typeof env.LEDGER_DB.batch==='function');}
function canonicalValue(v){if(Array.isArray(v))return v.map(canonicalValue);if(v&&typeof v==='object'){const o={};Object.keys(v).sort().forEach(k=>{o[k]=canonicalValue(v[k]);});return o;}return v;}
function d1StateParts(state){const meta={},collections={};Object.keys(state||{}).forEach(k=>{if(LEDGER_COLLECTIONS.indexOf(k)<0)meta[k]=state[k];});LEDGER_COLLECTIONS.forEach(k=>{collections[k]=Array.isArray(state&&state[k])?state[k]:[];});return {meta,collections};}
async function d1SemanticChecksum(state){return sha256Hex(JSON.stringify(canonicalValue(d1StateParts(state))));}
function d1JsonChunks(list,maxBytes){maxBytes=maxBytes||500000;const out=[];let cur=[],bytes=2,enc=new TextEncoder();for(const item of list||[]){const text=JSON.stringify(item),n=enc.encode(text).byteLength+(cur.length?1:0);if(cur.length&&bytes+n>maxBytes){out.push(cur);cur=[];bytes=2;}cur.push(item);bytes+=n;}if(cur.length)out.push(cur);return out;}
async function d1LedgerStatus(env,ledgerHash){
  if(!d1Ready(env))return {ok:false,configured:false,error:'D1_NOT_CONFIGURED'};
  try{const row=await env.LEDGER_DB.prepare('SELECT revision,checksum,semantic_checksum AS semanticChecksum,updated_at AS updatedAt,saved_at AS savedAt,entity_count AS entityCount,schema_version AS schemaVersion FROM ledger_meta WHERE ledger_hash=? LIMIT 1').bind(ledgerHash).first();return {ok:true,configured:true,hit:!!row,meta:row||null};}
  catch(e){return {ok:false,configured:true,error:'D1_SCHEMA_NOT_READY'};}
}
async function d1MirrorLedger(env,ledgerHash,state,sourceMeta){
  if(!d1Ready(env))return {ok:false,configured:false,error:'D1_NOT_CONFIGURED'};
  const parts=d1StateParts(state),semantic=await d1SemanticChecksum(state),entityCount=LEDGER_COLLECTIONS.reduce((n,k)=>n+parts.collections[k].length,0),savedAt=String(sourceMeta&&sourceMeta.savedAt||new Date().toISOString()),revision=Math.max(0,+state.dataRevision||+(sourceMeta&&sourceMeta.revision)||0),updatedAt=Math.max(0,+state.updatedAt||+(sourceMeta&&sourceMeta.updatedAt)||0),sourceChecksum=String(sourceMeta&&sourceMeta.checksum||await sha256Hex(JSON.stringify(state)));
  const stmts=[
    env.LEDGER_DB.prepare('INSERT INTO ledger_meta (ledger_hash,revision,checksum,semantic_checksum,updated_at,saved_at,state_meta_json,entity_count,schema_version) VALUES (?,?,?,?,?,?,?,?,1) ON CONFLICT(ledger_hash) DO UPDATE SET revision=excluded.revision,checksum=excluded.checksum,semantic_checksum=excluded.semantic_checksum,updated_at=excluded.updated_at,saved_at=excluded.saved_at,state_meta_json=excluded.state_meta_json,entity_count=excluded.entity_count,schema_version=excluded.schema_version').bind(ledgerHash,revision,sourceChecksum,semantic,updatedAt,savedAt,JSON.stringify(parts.meta),entityCount),
    env.LEDGER_DB.prepare('DELETE FROM ledger_entities WHERE ledger_hash=?').bind(ledgerHash)
  ];
  for(const kind of LEDGER_COLLECTIONS){let ord=0;for(const chunk of d1JsonChunks(parts.collections[kind],500000)){stmts.push(env.LEDGER_DB.prepare("INSERT INTO ledger_entities (ledger_hash,kind,entity_id,pid,data_json,ord) SELECT ?,?,CAST(json_extract(value,'$.id') AS TEXT),NULLIF(CAST(json_extract(value,'$.pid') AS TEXT),''),value,CAST(key AS INTEGER)+? FROM json_each(?)").bind(ledgerHash,kind,ord,JSON.stringify(chunk)));ord+=chunk.length;}}
  if(stmts.length>48)return {ok:false,configured:true,error:'D1_MIRROR_TOO_MANY_BATCHES',statements:stmts.length,entityCount};
  try{await env.LEDGER_DB.batch(stmts);return {ok:true,configured:true,hit:true,meta:{revision,checksum:sourceChecksum,semanticChecksum:semantic,updatedAt,savedAt,entityCount,schemaVersion:1},statements:stmts.length};}
  catch(e){return {ok:false,configured:true,error:'D1_MIRROR_FAILED'};}
}
async function d1ReadLedger(env,ledgerHash){
  if(!d1Ready(env))return {ok:false,configured:false,error:'D1_NOT_CONFIGURED'};
  try{
    const meta=await env.LEDGER_DB.prepare('SELECT revision,checksum,semantic_checksum AS semanticChecksum,updated_at AS updatedAt,saved_at AS savedAt,state_meta_json AS stateMetaJson,entity_count AS entityCount,schema_version AS schemaVersion FROM ledger_meta WHERE ledger_hash=? LIMIT 1').bind(ledgerHash).first();
    if(!meta)return {ok:true,configured:true,hit:false,state:null,meta:null};
    const q=await env.LEDGER_DB.prepare('SELECT kind,data_json AS dataJson,ord FROM ledger_entities WHERE ledger_hash=? ORDER BY kind,ord').bind(ledgerHash).all(),state=JSON.parse(meta.stateMetaJson||'{}');
    LEDGER_COLLECTIONS.forEach(k=>{state[k]=[];});
    for(const row of (q&&q.results)||[]){if(LEDGER_COLLECTIONS.indexOf(row.kind)<0)continue;state[row.kind].push(JSON.parse(row.dataJson));}
    const semantic=await d1SemanticChecksum(state);if(semantic!==String(meta.semanticChecksum||''))return {ok:false,configured:true,error:'D1_CHECKSUM_MISMATCH',meta:{revision:meta.revision,entityCount:meta.entityCount}};
    return {ok:true,configured:true,hit:true,state,meta:{revision:meta.revision,checksum:meta.checksum,semanticChecksum:meta.semanticChecksum,updatedAt:meta.updatedAt,savedAt:meta.savedAt,entityCount:meta.entityCount,schemaVersion:meta.schemaVersion}};
  }catch(e){return {ok:false,configured:true,error:'D1_READ_FAILED'};}
}
async function d1ReconcileDiff(durableState,d1State){
  const a=d1StateParts(durableState||{}),b=d1StateParts(d1State||{}),collections={};let mismatchCount=0;
  for(const kind of LEDGER_COLLECTIONS){const ac=a.collections[kind].length,bc=b.collections[kind].length,ah=await sha256Hex(JSON.stringify(canonicalValue(a.collections[kind]))),bh=await sha256Hex(JSON.stringify(canonicalValue(b.collections[kind]))),matched=ah===bh;collections[kind]={durableCount:ac,d1Count:bc,matched};if(!matched)mismatchCount++;}
  const am=await sha256Hex(JSON.stringify(canonicalValue(a.meta))),bm=await sha256Hex(JSON.stringify(canonicalValue(b.meta))),metaMatched=am===bm;if(!metaMatched)mismatchCount++;
  return {matched:mismatchCount===0,mismatchCount,metaMatched,collections};
}
function r2Ready(env){return !!(env&&env.LEDGER_FILES&&typeof env.LEDGER_FILES.put==='function'&&typeof env.LEDGER_FILES.get==='function'&&typeof env.LEDGER_FILES.delete==='function');}
function productionComponents(env){const providerConfigured=providerReady(env),durableState=!!env.GATEWAY_STATE,d1Ledger=d1Ready(env),r2Files=r2Ready(env),exactOrigins=allowedOrigins(env).length;return {providerConfigured,durableState,d1Ledger,r2Files,exactOrigins,ready:providerConfigured&&durableState&&d1Ledger&&r2Files};}
async function d1SchemaReady(env){if(!d1Ready(env))return false;try{await env.LEDGER_DB.prepare('SELECT schema_version FROM ledger_meta LIMIT 1').all();await env.LEDGER_DB.prepare('SELECT object_key FROM ledger_files LIMIT 1').all();return true;}catch(_){return false;}}
async function productionPlatformStatus(env){const c=productionComponents(env);c.d1Schema=await d1SchemaReady(env);c.ready=!!(c.ready&&c.d1Schema);return c;}

function cleanFileMeta(v,max){return String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max||120);}
function randomHex(bytes){const a=new Uint8Array(bytes||16);crypto.getRandomValues(a);return Array.from(a).map(x=>x.toString(16).padStart(2,'0')).join('');}
async function sha256Bytes(bytes){const h=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('');}
function parseFileDataUrl(value){
  const m=/^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(String(value||''));if(!m)throw Error('FILE_TYPE_UNSUPPORTED');
  let bin;try{bin=atob(m[2].replace(/\s+/g,''));}catch(_){throw Error('FILE_BASE64_INVALID');}
  if(bin.length<1||bin.length>MAX_FILE_BYTES)throw Error(bin.length>MAX_FILE_BYTES?'FILE_TOO_LARGE':'FILE_EMPTY');
  const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return {mime:m[1].toLowerCase(),bytes:out};
}
function fileObjectPrefix(ledgerHash){return String(ledgerHash||'')+'/';}
function fileObjectAllowed(ledgerHash,key){key=String(key||'');return /^[0-9a-f]{64}\/[0-9]{8}\/[0-9a-f]{32}$/.test(key)&&key.startsWith(fileObjectPrefix(ledgerHash));}
async function d1IndexFile(env,row){
  if(!d1Ready(env))return false;try{await env.LEDGER_DB.prepare('INSERT INTO ledger_files (object_key,ledger_hash,entity_type,entity_id,file_name,mime,size_bytes,sha256,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(object_key) DO UPDATE SET entity_type=excluded.entity_type,entity_id=excluded.entity_id,file_name=excluded.file_name,mime=excluded.mime,size_bytes=excluded.size_bytes,sha256=excluded.sha256').bind(row.key,row.ledgerHash,row.entityType,row.entityId,row.name,row.mime,row.size,row.sha256,row.createdAt).run();return true;}catch(_){return false;}
}
async function d1DeleteFileIndex(env,key,ledgerHash){if(!d1Ready(env))return false;try{await env.LEDGER_DB.prepare('DELETE FROM ledger_files WHERE object_key=? AND ledger_hash=?').bind(key,ledgerHash).run();return true;}catch(_){return false;}}
async function r2Upload(env,ledgerHash,body){
  if(!r2Ready(env))return {ok:false,error:'R2_NOT_CONFIGURED'};
  const parsed=parseFileDataUrl(body&&body.dataUrl),entityType=cleanFileMeta(body&&body.entityType,40)||'attachment',entityId=cleanFileMeta(body&&body.entityId,160),name=cleanFileMeta(body&&body.name,120)||'attachment',date=new Date().toISOString().slice(0,10).replace(/-/g,''),key=ledgerHash+'/'+date+'/'+randomHex(16),sha=await sha256Bytes(parsed.bytes.buffer),createdAt=new Date().toISOString();
  await env.LEDGER_FILES.put(key,parsed.bytes,{httpMetadata:{contentType:parsed.mime},customMetadata:{ledgerHash,entityType,entityId,name,sha256:sha,createdAt}});
  const indexed=await d1IndexFile(env,{key,ledgerHash,entityType,entityId,name,mime:parsed.mime,size:parsed.bytes.byteLength,sha256:sha,createdAt});
  return {ok:true,key,mime:parsed.mime,size:parsed.bytes.byteLength,sha256:sha,createdAt,indexed};
}
async function r2Get(env,ledgerHash,key){
  if(!r2Ready(env))return {ok:false,error:'R2_NOT_CONFIGURED',status:501};if(!fileObjectAllowed(ledgerHash,key))return {ok:false,error:'FILE_KEY_DENIED',status:403};
  const obj=await env.LEDGER_FILES.get(key);if(!obj)return {ok:false,error:'FILE_NOT_FOUND',status:404};
  const mime=String(obj.httpMetadata&&obj.httpMetadata.contentType||obj.customMetadata&&obj.customMetadata.mime||'application/octet-stream');
  return {ok:true,obj,mime,size:+obj.size||0,etag:String(obj.httpEtag||obj.etag||'')};
}
async function r2Delete(env,ledgerHash,key){
  if(!r2Ready(env))return {ok:false,error:'R2_NOT_CONFIGURED',status:501};if(!fileObjectAllowed(ledgerHash,key))return {ok:false,error:'FILE_KEY_DENIED',status:403};
  await env.LEDGER_FILES.delete(key);await d1DeleteFileIndex(env,key,ledgerHash);return {ok:true};
}
async function r2Probe(env,ledgerHash){
  if(!r2Ready(env))return {ok:false,error:'R2_NOT_CONFIGURED',status:501};
  const date=new Date().toISOString().slice(0,10).replace(/-/g,''),key=ledgerHash+'/'+date+'/'+randomHex(16),bytes=new Uint8Array([65,82,69,65]);
  let wrote=false;
  try{
    await env.LEDGER_FILES.put(key,bytes,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{ledgerHash,probe:'1',createdAt:new Date().toISOString()}});wrote=true;
    const obj=await env.LEDGER_FILES.get(key);if(!obj)return {ok:false,error:'R2_PROBE_READ_FAILED',status:503};
    const ab=await new Response(obj.body).arrayBuffer();if(new Uint8Array(ab).byteLength!==bytes.byteLength)return {ok:false,error:'R2_PROBE_VERIFY_FAILED',status:503};
    return {ok:true,wrote:true,read:true,deleted:true};
  }catch(_){return {ok:false,error:'R2_PROBE_FAILED',status:503};}
  finally{if(wrote){try{await env.LEDGER_FILES.delete(key);}catch(_){}}}
}

async function ledgerStub(env,key){if(!env.GATEWAY_STATE)return null;const name='ledger:'+await sha256Hex(key),id=env.GATEWAY_STATE.idFromName(name);return env.GATEWAY_STATE.get(id);}
async function ledgerCall(env,key,path,body){const stub=await ledgerStub(env,key);if(!stub)return null;return stub.fetch('https://internal/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});}
async function readLedgerJson(r){const len=Number(r.headers.get('Content-Length')||0);if(len&&len>MAX_LEDGER_BYTES)throw Error('LEDGER_PAYLOAD_TOO_LARGE');const text=await r.text();if(new TextEncoder().encode(text).byteLength>MAX_LEDGER_BYTES)throw Error('LEDGER_PAYLOAD_TOO_LARGE');try{return JSON.parse(text);}catch(_){throw Error('LEDGER_JSON_INVALID');}}
function normalizeLedgerStateBody(body){const state=body&&body.state;if(!state||typeof state!=='object'||Array.isArray(state)||!Array.isArray(state.projects)||!Array.isArray(state.tx))throw Error('LEDGER_STATE_INVALID');const revision=Math.max(0,Number(state.dataRevision)||0),updatedAt=Math.max(0,Number(state.updatedAt)||0),expectedRevision=body.expectedRevision==null?null:Math.max(0,Number(body.expectedRevision)||0),expectedChecksum=String(body.expectedChecksum||'').toLowerCase();if(expectedChecksum&&!/^[0-9a-f]{64}$/.test(expectedChecksum))throw Error('LEDGER_EXPECTED_CHECKSUM_INVALID');return {state,revision,updatedAt,expectedRevision,expectedChecksum};}
function clientKey(r){return r.headers.get('CF-Connecting-IP')||'unknown';}
async function durableCall(binding,path,body){if(!binding)return null;const id=binding.idFromName(body.key),stub=binding.get(id),res=await stub.fetch('https://internal/'+path,{method:'POST',body:JSON.stringify(body)});return res.ok?res.json():null;}
async function rateAllowed(r,env){const limit=Math.max(1,Math.min(120,Number(env.RATE_LIMIT_PER_MINUTE)||20)),key=clientKey(r);if(String(env.REQUIRE_DURABLE_STATE||'').toLowerCase()==='true'&&!env.GATEWAY_STATE)return null;const durable=await durableCall(env.GATEWAY_STATE,'rate',{key,limit,windowMs:WINDOW_MS});if(durable)return durable.allowed===true;const now=Date.now(),old=buckets.get(key);if(!old||now-old.start>=WINDOW_MS){buckets.set(key,{start:now,count:1});return true;}old.count++;return old.count<=limit;}
async function ledgerRateAllowed(r,env){const limit=Math.max(5,Math.min(240,Number(env.LEDGER_RATE_LIMIT_PER_MINUTE)||60)),key='ledger:'+clientKey(r);if(!env.GATEWAY_STATE)return null;const durable=await durableCall(env.GATEWAY_STATE,'rate',{key,limit,windowMs:WINDOW_MS});return durable?durable.allowed===true:null;}
async function readJson(r){const len=Number(r.headers.get('Content-Length')||0);if(len&&len>MAX_BODY_BYTES)throw Error('PAYLOAD_TOO_LARGE');const text=await r.text();if(text.length>MAX_BODY_BYTES)throw Error('PAYLOAD_TOO_LARGE');return JSON.parse(text);}
function validateOcrImage(b,kind){
  const image=b&&b.image;
  if(typeof image!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(image))throw Error('INVALID_IMAGE');
  return {image,lang:'tha+eng',kind:kind==='boq'?'boq':'expense'};
}
function safeProviderUrl(raw){raw=String(raw||'').trim();if(!raw)return '';try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error();return u.href;}catch(_){throw Error('PROVIDER_URL_INVALID');}}
function providerConfig(env){const kind=String(env.OCR_PROVIDER||'generic').toLowerCase();if(!['generic','gemini'].includes(kind))throw Error('PROVIDER_UNSUPPORTED');const model=String(env.GEMINI_MODEL||'gemini-2.5-flash').trim();return {kind,model,url:kind==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent':safeProviderUrl(env.OCR_UPSTREAM_URL),key:String(env.OCR_API_KEY||''),timeout:Math.max(3000,Math.min(20000,Number(env.PROVIDER_TIMEOUT_MS)||10000)),retries:Math.max(0,Math.min(1,Number(env.PROVIDER_RETRIES)||1))};}
function providerReady(env){try{const p=providerConfig(env);return !!p.key&&(p.kind==='gemini'||!!p.url);}catch(_){return false;}}
function providerRequest(p,payload,rid){
  if(p.kind==='gemini'){
    const m=String(payload.image||'').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);if(!m)throw Error('INVALID_IMAGE');
    const expensePrompt='คุณเป็นระบบอ่านหลักฐานค่าใช้จ่ายสำหรับบัญชีก่อสร้าง อ่านภาพโดยใช้ vision โดยตรง ไม่ใช่ OCR ตัวพิมพ์อย่างเดียว ต้องรองรับบิลเงินสดร้านเล็กภาษาไทย บิลสำเร็จรูป บิลคาร์บอนจาง และลายมือไทย ให้ดูตำแหน่งช่อง ตาราง เส้น และหัวข้อบนแบบฟอร์มประกอบกัน งานสำคัญที่สุดคือยอดเงิน: มองหาช่อง รวมเงิน/TOTAL ด้านล่างก่อน แล้วตรวจเทียบคอลัมน์ จำนวนเงิน/AMOUNT; ถ้า TOTAL อ่านได้ชัด ให้ใช้ค่านั้น แม้ข้อความลายมืออื่นอ่านไม่ได้ ตัวเลขใน BOOK NO, BILL NO, เบอร์โทร, วันที่ และ UNIT PRICE ห้ามนำมาเป็น amount. ถ้ามีเลขเดียวกันใน AMOUNT และ TOTAL ให้ความมั่นใจสูงขึ้น. อ่านรายการจากช่อง DESCRIPTION และชื่อร้าน/ผู้ขายจากหัวบิลหรือตราประทับ; ชื่อลูกค้าในช่อง NAME ไม่ใช่ partner. วันที่ไทยเช่น 2-10-69 ให้คืน date เป็น 2026-10-02 เมื่อตีความได้ชัดเจน (พ.ศ. 2569/เลขปี 69 = ค.ศ. 2026) แต่ห้ามเดา. ตัวอย่างรูปแบบที่ระบบต้องรองรับ: หัว บิลเงินสด/CASH SALE, ตาราง จำนวน | รายการ | หน่วยละ | จำนวนเงิน และกล่อง รวมเงิน/TOTAL ด้านล่าง. ตอบ JSON เท่านั้น {"text":"ข้อความที่มองเห็นทั้งหมด","amount":ยอดรวมเป็นตัวเลขไม่มี comma หรือ 0,"cat":"ค่าของ|ค่าแรง|ค่าประกัน/ค่างาน|ค่างานเอกสาร|ค่าเช่าอื่นๆ","sub":"รายการสินค้า/บริการสั้นๆ","partner":"ชื่อร้าน/ผู้ขายถ้าอ่านได้","date":"YYYY-MM-DD หรือค่าว่าง","confidence":0.0} ห้ามสร้างข้อมูลที่มองไม่เห็น';
    const boqPrompt='คุณเป็นระบบอ่าน BOQ งานก่อสร้างภาษาไทยจากภาพ ใช้ vision อ่านโครงสร้างตาราง เส้นแบ่งคอลัมน์ หัวตาราง และตำแหน่งตัวเลข ไม่ใช่อาศัย OCR ข้อความอย่างเดียว. อ่านเฉพาะรายการที่มองเห็นจริง ห้ามเดาชื่อ ปริมาณ หน่วย หรือราคา. คืนแต่ละรายการเป็น name, qty, unit, unitPrice, category และ confidence. category ใช้เฉพาะ "ค่าของ" หรือ "ค่าแรง". ถ้าหนึ่งรายการมีค่าวัสดุและค่าแรงแยกคอลัมน์ ให้แตกเป็น 2 แถวโดยเติมท้ายชื่อว่า "— ค่าวัสดุ" และ "— ค่าแรง". ถ้าเห็นยอดเงินแต่ไม่เห็นราคาต่อหน่วยชัด ห้ามคำนวณย้อนเพื่อเดาราคา. ถ้าอ่านปริมาณหรือราคาต่อหน่วยไม่ชัด ให้ตัดแถวนั้นออก. หน่วยอาจเป็น ตร.ม., ลบ.ม., เมตร, ม., กก., ตัน, ชุด, อัน, ตัว, แผ่น, เส้น, ท่อน, ถุง, ลูก, เที่ยว, งาน, หลัง, จุด, บ่อ, ต้น, เครื่อง, วัน, เดือน, ชั่วโมง. declaredTotal ให้คืนเฉพาะเมื่อเห็นยอดรวมเอกสารชัด. ตอบ JSON เท่านั้น {"text":"ข้อความที่มองเห็น","rows":[{"name":"ชื่อรายการ","qty":1,"unit":"หน่วย","unitPrice":0,"category":"ค่าของ","confidence":0.0}],"declaredTotal":0,"confidence":0.0}. จำกัดไม่เกิน 300 แถวต่อภาพ และห้ามสร้างข้อมูลที่มองไม่เห็น';
    const prompt=payload.kind==='boq'?boqPrompt:expensePrompt;
    return {url:p.url,headers:{'Content-Type':'application/json','x-goog-api-key':p.key,'X-AREA-Request-ID':rid},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},{inline_data:{mime_type:m[1].toLowerCase(),data:m[2]}}]}],generationConfig:{responseMimeType:'application/json',temperature:0}})};
  }
  return {url:p.url,headers:{'Content-Type':'application/json','Authorization':'Bearer '+p.key,'X-AREA-Request-ID':rid},body:JSON.stringify(payload)};
}
function cleanExpense(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('PROVIDER_INVALID_RESPONSE');
  const amount=Number(data.amount)||0;if(!isFinite(amount)||amount<0)throw Error('PROVIDER_INVALID_RESPONSE');
  return {text:String(data.text||'').slice(0,20000),amount,cat:String(data.cat||'ค่าของ').slice(0,80),sub:String(data.sub||'').slice(0,160),partner:String(data.partner||'').slice(0,160),date:String(data.date||'').slice(0,10),confidence:Math.max(0,Math.min(1,Number(data.confidence)||0))};
}
function cleanBoq(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('PROVIDER_INVALID_RESPONSE');
  const rows=Array.isArray(data.rows)?data.rows.slice(0,300):[],clean=[];
  for(const row of rows){
    if(!row||typeof row!=='object')continue;
    const name=String(row.name||'').replace(/\s+/g,' ').trim().slice(0,180),qty=Number(row.qty),unit=String(row.unit||'').replace(/\s+/g,' ').trim().slice(0,40),unitPrice=Number(row.unitPrice),category=String(row.category||'ค่าของ')==='ค่าแรง'?'ค่าแรง':'ค่าของ',confidence=Math.max(0,Math.min(1,Number(row.confidence)||0));
    if(name.length<2||!(qty>0)||!isFinite(qty)||qty>1000000||!(unitPrice>=0)||!isFinite(unitPrice)||unitPrice>1000000000)continue;
    clean.push({name,qty,unit,unitPrice,category,confidence});
  }
  const declaredTotal=Number(data.declaredTotal)||0;
  return {text:String(data.text||'').slice(0,30000),rows:clean,declaredTotal:isFinite(declaredTotal)&&declaredTotal>0?declaredTotal:0,confidence:Math.max(0,Math.min(1,Number(data.confidence)||0))};
}
function geminiJson(data){
  const parts=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts,text=Array.isArray(parts)?parts.map(x=>x&&x.text||'').join('').trim():'';
  if(!text)throw Error('PROVIDER_INVALID_RESPONSE');
  try{return JSON.parse(text.replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,''));}catch(_){throw Error('PROVIDER_INVALID_RESPONSE');}
}
function geminiExpense(data){return cleanExpense(geminiJson(data));}
function geminiBoq(data){return cleanBoq(geminiJson(data));}
function retryableStatus(s){return s===408||s===429||s>=500;}
async function providerFetch(p,payload,rid){let last;for(let attempt=0;attempt<=p.retries;attempt++){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),p.timeout);try{const rq=providerRequest(p,payload,rid),res=await fetch(rq.url,{method:'POST',headers:rq.headers,body:rq.body,signal:ctrl.signal});if(res.ok)return res;if(!retryableStatus(res.status)||attempt>=p.retries)throw Error('PROVIDER_HTTP_'+res.status);last=Error('PROVIDER_HTTP_'+res.status);}catch(e){last=e;if(attempt>=p.retries||String(e&&e.message||'').startsWith('PROVIDER_HTTP_')&&!retryableStatus(Number(String(e.message).split('_').pop())))throw e;}finally{clearTimeout(timer);}}throw last||Error('PROVIDER_FAILED');}
async function readProviderJson(res){const len=Number(res.headers.get('Content-Length')||0);if(len&&len>MAX_PROVIDER_BYTES)throw Error('PROVIDER_RESPONSE_TOO_LARGE');const text=await res.text();if(new TextEncoder().encode(text).byteLength>MAX_PROVIDER_BYTES)throw Error('PROVIDER_RESPONSE_TOO_LARGE');try{return JSON.parse(text);}catch(_){throw Error('PROVIDER_INVALID_RESPONSE');}}
async function expenseOcr(payload,env,rid){
  const p=providerConfig(env);if(!p.key||(p.kind==='generic'&&!p.url))throw Error('PROVIDER_NOT_CONFIGURED');
  const res=await providerFetch(p,payload,rid),data=await readProviderJson(res);return p.kind==='gemini'?geminiExpense(data):cleanExpense(data);
}
async function boqOcr(payload,env,rid){
  const p=providerConfig(env);if(!p.key||(p.kind==='generic'&&!p.url))throw Error('PROVIDER_NOT_CONFIGURED');
  const res=await providerFetch(p,payload,rid),data=await readProviderJson(res);return p.kind==='gemini'?geminiBoq(data):cleanBoq(data);
}
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
    if(path==='/ledger-history'){
      const current=await storage.get('ledger:manifest'),previous=await storage.get('ledger:previous');
      const pub=m=>m?{revision:m.revision,updatedAt:m.updatedAt,checksum:m.checksum,bytes:m.bytes,savedAt:m.savedAt}:null;
      return json({ok:true,current:pub(current),previous:pub(previous)});
    }
    if(path==='/ledger-put'){
      const payload=String(body.payload||''),bytes=new TextEncoder().encode(payload);if(!payload||bytes.byteLength>MAX_LEDGER_BYTES)return json({error:'LEDGER_PAYLOAD_TOO_LARGE'},413);
      let parsed;try{parsed=JSON.parse(payload);}catch(_){return json({error:'LEDGER_JSON_INVALID'},400);}
      if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.projects)||!Array.isArray(parsed.tx)||!Array.isArray(parsed.boq))return json({error:'LEDGER_STATE_INVALID'},400);
      const current=await storage.get('ledger:manifest'),olderPrevious=await storage.get('ledger:previous'),expected=body.expectedRevision==null?null:Math.max(0,+body.expectedRevision||0),incoming=Math.max(0,+body.revision||0);
      if(current&&expected!==null&&expected!==current.revision)return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      if(current&&!body.expectedChecksum)return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      if(current&&String(body.expectedChecksum).toLowerCase()!==String(current.checksum||'').toLowerCase())return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      if(!current&&expected!==null&&expected!==0)return json({error:'LEDGER_REVISION_CONFLICT',current:null},409);
      if(current&&incoming<current.revision)return json({error:'LEDGER_REVISION_CONFLICT',current:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum}},409);
      const generation=crypto.randomUUID(),chunks=Math.max(1,Math.ceil(bytes.byteLength/LEDGER_CHUNK_BYTES)),checksum=await sha256Hex(payload);
      for(let i=0;i<chunks;i++){const part=bytes.slice(i*LEDGER_CHUNK_BYTES,Math.min(bytes.byteLength,(i+1)*LEDGER_CHUNK_BYTES));await storage.put('ledger:chunk:'+generation+':'+i,part);}
      const manifest={revision:incoming,updatedAt:Math.max(0,+body.updatedAt||0),checksum,bytes:bytes.byteLength,chunks,generation,savedAt:new Date().toISOString()};
      if(current)await storage.put('ledger:previous',current);else await storage.delete('ledger:previous');
      await storage.put('ledger:manifest',manifest);
      if(olderPrevious&&olderPrevious.generation&&(!current||olderPrevious.generation!==current.generation)&&olderPrevious.generation!==generation){for(let i=0;i<(olderPrevious.chunks||0);i++)await storage.delete('ledger:chunk:'+olderPrevious.generation+':'+i);}
      return json({ok:true,meta:manifest,previous:current?{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum,bytes:current.bytes,savedAt:current.savedAt}:null});
    }
    if(path==='/ledger-restore-previous'){
      const current=await storage.get('ledger:manifest'),previous=await storage.get('ledger:previous');if(!current||!previous)return json({error:'LEDGER_PREVIOUS_NOT_FOUND'},404);
      const parts=[];let total=0;for(let i=0;i<previous.chunks;i++){const v=await storage.get('ledger:chunk:'+previous.generation+':'+i);if(v==null)return json({error:'LEDGER_CHUNK_MISSING'},500);const u=v instanceof Uint8Array?v:new Uint8Array(v);parts.push(u);total+=u.byteLength;}
      const all=new Uint8Array(total);let off=0;for(const p of parts){all.set(p,off);off+=p.byteLength;}
      let restored;try{restored=JSON.parse(new TextDecoder().decode(all));}catch(_){return json({error:'LEDGER_JSON_INVALID'},500);}
      if(!restored||!Array.isArray(restored.projects)||!Array.isArray(restored.tx)||!Array.isArray(restored.boq))return json({error:'LEDGER_STATE_INVALID'},500);
      restored.dataRevision=Math.max(+current.revision||0,+restored.dataRevision||0)+1;restored.updatedAt=Math.max(Date.now(),(+restored.updatedAt||0)+1);
      const payload=JSON.stringify(restored),bytes=new TextEncoder().encode(payload);if(bytes.byteLength>MAX_LEDGER_BYTES)return json({error:'LEDGER_PAYLOAD_TOO_LARGE'},413);
      const generation=crypto.randomUUID(),chunks=Math.max(1,Math.ceil(bytes.byteLength/LEDGER_CHUNK_BYTES)),checksum=await sha256Hex(payload);
      for(let i=0;i<chunks;i++){const part=bytes.slice(i*LEDGER_CHUNK_BYTES,Math.min(bytes.byteLength,(i+1)*LEDGER_CHUNK_BYTES));await storage.put('ledger:chunk:'+generation+':'+i,part);}
      const manifest={revision:restored.dataRevision,updatedAt:restored.updatedAt,checksum,bytes:bytes.byteLength,chunks,generation,savedAt:new Date().toISOString(),restoredFrom:previous.revision};
      await storage.put('ledger:previous',current);await storage.put('ledger:manifest',manifest);
      if(previous.generation&&previous.generation!==current.generation&&previous.generation!==generation){for(let i=0;i<(previous.chunks||0);i++)await storage.delete('ledger:chunk:'+previous.generation+':'+i);}
      return json({ok:true,meta:{revision:manifest.revision,updatedAt:manifest.updatedAt,checksum:manifest.checksum,bytes:manifest.bytes,savedAt:manifest.savedAt,restoredFrom:manifest.restoredFrom},previous:{revision:current.revision,updatedAt:current.updatedAt,checksum:current.checksum,bytes:current.bytes,savedAt:current.savedAt}});
    }
    return json({error:'STATE_ROUTE_NOT_FOUND'},404);
  }
  async alarm(){await this.state.storage.deleteAll();}
}
export default{async fetch(request,env){
  const started=Date.now(),url=new URL(request.url),rid=requestId(request);
  if(url.pathname==='/health'&&request.method==='GET'){const c=await productionPlatformStatus(env);return json({ok:true,service:'area-ledger-ai-gateway',protocol:PROTOCOL_VERSION,providerConfigured:c.providerConfigured,durableState:c.durableState,cloudLedger:c.durableState,cloudLedgerBackup:c.durableState,d1Ledger:c.d1Ledger,d1Schema:c.d1Schema,r2Files:c.r2Files,productionReady:c.ready,auditSink:!!env.GATEWAY_AUDIT},200,'',rid);}
  if(url.pathname==='/ready'&&request.method==='GET'){const providerConfigured=providerReady(env),durableState=!!env.GATEWAY_STATE,allowedOriginCount=allowedOrigins(env).length,ready=providerConfigured&&durableState;return json({ok:ready,service:'area-ledger-ai-gateway',protocol:PROTOCOL_VERSION,providerConfigured,durableState,cloudLedger:durableState,d1Ledger:d1Ready(env),r2Files:r2Ready(env),sameOriginAllowed:true,allowedOriginCount,auditSink:!!env.GATEWAY_AUDIT},ready?200:503,'',rid);}
  const origin=corsOrigin(request,env),sentOrigin=request.headers.get('Origin')||'';
  if(request.method==='OPTIONS')return origin?json({ok:true,protocol:PROTOCOL_VERSION},204,origin,rid):json({error:'ORIGIN_DENIED'},403,'',rid);
  if(url.pathname==='/v1/files/status'||url.pathname==='/v1/files/list'||url.pathname==='/v1/files/probe'||url.pathname==='/v1/files/upload'||url.pathname==='/v1/files/object'||url.pathname==='/v1/files/delete'){
    if(sentOrigin&&!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
    if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
    const access=ledgerAccessKey(request);if(!access)return json({error:'LEDGER_KEY_REQUIRED'},401,origin,rid);
    const ledgerHash=await sha256Hex(access);
    if(url.pathname==='/v1/files/status'&&request.method==='GET')return json({ok:r2Ready(env),configured:r2Ready(env),maxFileBytes:MAX_FILE_BYTES,d1Index:d1Ready(env)},r2Ready(env)?200:501,origin,rid);
    if(url.pathname==='/v1/files/probe'&&request.method==='POST'){const x=await r2Probe(env,ledgerHash);return json(x,x.ok?200:(x.status||500),origin,rid);}
    if(url.pathname==='/v1/files/list'&&request.method==='GET'){
      if(!d1Ready(env))return json({error:'D1_NOT_CONFIGURED'},501,origin,rid);
      try{const q=await env.LEDGER_DB.prepare('SELECT object_key AS key,entity_type AS entityType,entity_id AS entityId,file_name AS name,mime,size_bytes AS size,sha256,created_at AS createdAt FROM ledger_files WHERE ledger_hash=? ORDER BY created_at DESC LIMIT 500').bind(ledgerHash).all();return json({ok:true,files:(q&&q.results)||[]},200,origin,rid);}
      catch(_){return json({error:'D1_FILE_INDEX_NOT_READY'},503,origin,rid);}
    }
    if(url.pathname==='/v1/files/upload'&&request.method==='POST'){
      try{const b=await readLedgerJson(request),x=await r2Upload(env,ledgerHash,b);return json(x,x.ok?200:(x.error==='R2_NOT_CONFIGURED'?501:400),origin,rid);}
      catch(e){const code=String(e&&e.message||'FILE_UPLOAD_ERROR'),status=code==='FILE_TOO_LARGE'?413:code==='LEDGER_PAYLOAD_TOO_LARGE'?413:400;return json({error:code},status,origin,rid);}
    }
    if(url.pathname==='/v1/files/object'&&request.method==='GET'){
      const x=await r2Get(env,ledgerHash,url.searchParams.get('key')||'');if(!x.ok)return json({error:x.error},x.status||500,origin,rid);
      const h=new Headers({'Content-Type':x.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-AREA-Request-ID':rid});if(origin)h.set('Access-Control-Allow-Origin',origin);if(x.etag)h.set('ETag',x.etag);if(x.size)h.set('Content-Length',String(x.size));return new Response(x.obj.body,{status:200,headers:h});
    }
    if(url.pathname==='/v1/files/delete'&&request.method==='POST'){
      let b;try{b=await readJson(request);}catch(e){return json({error:'FILE_DELETE_INVALID'},400,origin,rid);}const x=await r2Delete(env,ledgerHash,String(b&&b.key||''));return json(x,x.ok?200:(x.status||500),origin,rid);
    }
    return json({error:'METHOD_NOT_ALLOWED'},405,origin,rid);
  }
  if(url.pathname==='/v1/platform/status'&&request.method==='GET'){
    if(sentOrigin&&!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
    if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
    const c=await productionPlatformStatus(env);return json({ok:true,service:'area-ledger-ai-gateway',protocol:PROTOCOL_VERSION,components:c,productionReady:c.ready,cloudflareOnly:true},200,origin,rid);
  }
  if(url.pathname==='/v1/ledger/d1-status'||url.pathname==='/v1/ledger/d1-migrate'||url.pathname==='/v1/ledger/d1-read'||url.pathname==='/v1/ledger/reconcile'){
    if(sentOrigin&&!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
    if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
    const access=ledgerAccessKey(request);if(!access)return json({error:'LEDGER_KEY_REQUIRED'},401,origin,rid);
    const ledgerHash=await sha256Hex(access);
    if(url.pathname==='/v1/ledger/d1-status'&&request.method==='GET'){const x=await d1LedgerStatus(env,ledgerHash);return json(x,x.ok?200:(x.configured?503:501),origin,rid);}
    if(url.pathname==='/v1/ledger/d1-read'&&request.method==='GET'){const x=await d1ReadLedger(env,ledgerHash);return json(x,x.ok?200:(x.configured?500:501),origin,rid);}
    if(url.pathname==='/v1/ledger/reconcile'&&(request.method==='GET'||request.method==='POST')){
      if(!d1Ready(env))return json({error:'D1_NOT_CONFIGURED'},501,origin,rid);
      const dr=await ledgerCall(env,access,'ledger-get',{});if(!dr)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const ds=await dr.json();if(!dr.ok)return json(ds,dr.status,origin,rid);if(!ds.hit)return json({error:'LEDGER_CLOUD_EMPTY'},409,origin,rid);
      let durableState;try{durableState=JSON.parse(ds.payload);}catch(_){return json({error:'LEDGER_CLOUD_CORRUPT'},500,origin,rid);}
      let d1=await d1ReadLedger(env,ledgerHash),durableSemantic=await d1SemanticChecksum(durableState),matched=!!(d1.ok&&d1.hit&&d1.meta&&String(d1.meta.semanticChecksum||'')===durableSemantic);
      if(request.method==='POST'&&!matched){const m=await d1MirrorLedger(env,ledgerHash,durableState,ds.meta||{});if(!m.ok)return json({ok:false,matched:false,repaired:false,error:m.error||'D1_MIRROR_FAILED'},500,origin,rid);d1=await d1ReadLedger(env,ledgerHash);matched=!!(d1.ok&&d1.hit&&d1.meta&&String(d1.meta.semanticChecksum||'')===durableSemantic);}
      const diff=await d1ReconcileDiff(durableState,d1&&d1.state||{});return json({ok:true,matched,repaired:request.method==='POST'&&matched,durable:{revision:ds.meta&&ds.meta.revision||0,semanticChecksum:durableSemantic},d1:d1&&d1.meta||null,diff},matched?200:409,origin,rid);
    }
    if(url.pathname==='/v1/ledger/d1-migrate'&&request.method==='POST'){
      if(!d1Ready(env))return json({error:'D1_NOT_CONFIGURED'},501,origin,rid);
      const r=await ledgerCall(env,access,'ledger-get',{});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const x=await r.json();
      if(!r.ok)return json(x,r.status,origin,rid);if(!x.hit)return json({error:'LEDGER_CLOUD_EMPTY'},409,origin,rid);
      let state;try{state=JSON.parse(x.payload);}catch(_){return json({error:'LEDGER_CLOUD_CORRUPT'},500,origin,rid);}
      const h=await d1MirrorLedger(env,ledgerHash,state,x.meta||{});return json(h,h.ok?200:500,origin,rid);
    }
    return json({error:'METHOD_NOT_ALLOWED'},405,origin,rid);
  }
  if(['/v1/ledger/state','/v1/ledger/status','/v1/ledger/history','/v1/ledger/restore-previous'].includes(url.pathname)){
    if(sentOrigin&&!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
    if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
    const access=ledgerAccessKey(request);if(!access)return json({error:'LEDGER_KEY_REQUIRED'},401,origin,rid);
    if(!env.GATEWAY_STATE)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);
    const ledgerRate=await ledgerRateAllowed(request,env);if(ledgerRate===null)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);if(!ledgerRate)return json({error:'RATE_LIMITED'},429,origin,rid);
    try{
      if(url.pathname==='/v1/ledger/status'&&request.method==='GET'){const r=await ledgerCall(env,access,'ledger-meta',{});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const x=await r.json();return json({ok:true,hit:!!x.hit,meta:x.meta||null},r.status,origin,rid);}
      if(url.pathname==='/v1/ledger/history'&&request.method==='GET'){const r=await ledgerCall(env,access,'ledger-history',{});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);return json(await r.json(),r.status,origin,rid);}
      if(url.pathname==='/v1/ledger/restore-previous'&&request.method==='POST'){const r=await ledgerCall(env,access,'ledger-restore-previous',{});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);return json(await r.json(),r.status,origin,rid);}
      if(url.pathname==='/v1/ledger/state'&&request.method==='GET'){const r=await ledgerCall(env,access,'ledger-get',{});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const x=await r.json();if(!r.ok)return json(x,r.status,origin,rid);if(!x.hit)return json({ok:true,hit:false,meta:null,state:null},200,origin,rid);let state;try{state=JSON.parse(x.payload);}catch(_){return json({error:'LEDGER_CLOUD_CORRUPT'},500,origin,rid);}return json({ok:true,hit:true,meta:x.meta,state},200,origin,rid);}
      if(url.pathname==='/v1/ledger/state'&&request.method==='PUT'){const b=normalizeLedgerStateBody(await readLedgerJson(request)),payload=JSON.stringify(b.state);if(new TextEncoder().encode(payload).byteLength>MAX_LEDGER_BYTES)throw Error('LEDGER_PAYLOAD_TOO_LARGE');const r=await ledgerCall(env,access,'ledger-put',{payload,revision:b.revision,updatedAt:b.updatedAt,expectedRevision:b.expectedRevision,expectedChecksum:b.expectedChecksum});if(!r)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);const x=await r.json();return json(x,r.status,origin,rid);}
      return json({error:'METHOD_NOT_ALLOWED'},405,origin,rid);
    }catch(e){const code=String(e&&e.message||'LEDGER_ERROR'),status=code==='LEDGER_PAYLOAD_TOO_LARGE'?413:code==='LEDGER_JSON_INVALID'||code==='LEDGER_STATE_INVALID'?400:500;return json({error:code},status,origin,rid);}
  }
  if(!['/v1/ocr/expense','/v1/ocr/boq'].includes(url.pathname)||request.method!=='POST')return json({error:'NOT_FOUND'},404,'',rid);
  if(!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
  if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
  const rate=await rateAllowed(request,env);if(rate===null)return json({error:'DURABLE_STATE_REQUIRED'},503,origin,rid);if(!rate)return json({error:'RATE_LIMITED'},429,origin,rid);
  const key=origin+'|'+rid,cached=await idemGet(env,key);if(cached)return json(cached,200,origin,rid);
  let status=200;
  try{
    const kind=url.pathname.endsWith('/boq')?'boq':'expense',payload=validateOcrImage(await readJson(request),kind),result=kind==='boq'?await boqOcr(payload,env,rid):await expenseOcr(payload,env,rid);
    await idemSet(env,key,result);return json(result,200,origin,rid);
  }
  catch(e){const code=e&&e.name==='AbortError'?'PROVIDER_TIMEOUT':String(e&&e.message||'GATEWAY_ERROR');status=code==='PAYLOAD_TOO_LARGE'?413:code==='INVALID_IMAGE'?400:code==='PROVIDER_NOT_CONFIGURED'||code==='DURABLE_STATE_REQUIRED'?503:code==='PROVIDER_UNSUPPORTED'?501:code==='PROVIDER_TIMEOUT'?504:502;return json({error:code},status,origin,rid);}
  finally{await audit(env,auditMeta(rid,origin,status,started,String(env.OCR_PROVIDER||'generic')));}
}};
