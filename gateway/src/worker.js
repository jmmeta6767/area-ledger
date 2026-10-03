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

function googleConfigured(env){return !!(d1Ready(env)&&String(env.GOOGLE_CLIENT_ID||'').trim()&&String(env.GOOGLE_CLIENT_SECRET||'').trim()&&String(env.GOOGLE_TOKEN_KEY||'').length>=24);}
function b64urlBytes(bytes){let s='';const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function b64urlDecode(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
async function googleCryptoKey(env){const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(env.GOOGLE_TOKEN_KEY||'')));return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);}
async function googleEncrypt(env,text){const iv=new Uint8Array(12);crypto.getRandomValues(iv);const key=await googleCryptoKey(env),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(String(text||'')));return b64urlBytes(iv)+'.'+b64urlBytes(ct);}
async function googleDecrypt(env,value){const p=String(value||'').split('.');if(p.length!==2)throw Error('GOOGLE_TOKEN_INVALID');const key=await googleCryptoKey(env),iv=b64urlDecode(p[0]),ct=b64urlDecode(p[1]),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);return new TextDecoder().decode(plain);}
function googleReturnUrl(request,value,env){let u;try{u=new URL(String(value||''),request.url);}catch(_){return '';}const self=new URL(request.url).origin;if(u.origin!==self&&!allowedOrigins(env).includes(u.origin))return '';if(!/^https?:$/.test(u.protocol))return '';return u.toString();}
async function googlePkceChallenge(verifier){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));return b64urlBytes(h);}
async function googleConnection(env,ledgerHash){if(!d1Ready(env))return null;try{return await env.LEDGER_DB.prepare('SELECT email,refresh_token_enc AS refreshTokenEnc,scopes,root_drive_folder_id AS rootDriveFolderId,connected_at AS connectedAt,updated_at AS updatedAt FROM google_connections WHERE ledger_hash=? LIMIT 1').bind(ledgerHash).first();}catch(_){return null;}}
async function googleProjectLink(env,ledgerHash,pid){try{return await env.LEDGER_DB.prepare('SELECT project_id AS projectId,project_name AS projectName,drive_folder_id AS driveFolderId,spreadsheet_id AS spreadsheetId,drive_url AS driveUrl,sheet_url AS sheetUrl,last_sync_hash AS lastSyncHash,last_sync_at AS lastSyncAt,updated_at AS updatedAt FROM google_project_links WHERE ledger_hash=? AND project_id=? LIMIT 1').bind(ledgerHash,pid).first();}catch(_){return null;}}
async function googleAccessToken(env,ledgerHash){
  const conn=await googleConnection(env,ledgerHash);if(!conn||!conn.refreshTokenEnc)throw Error('GOOGLE_NOT_CONNECTED');
  const refresh=await googleDecrypt(env,conn.refreshTokenEnc),body=new URLSearchParams({client_id:String(env.GOOGLE_CLIENT_ID),client_secret:String(env.GOOGLE_CLIENT_SECRET),refresh_token:refresh,grant_type:'refresh_token'});
  const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});let data={};try{data=await res.json();}catch(_){}
  if(!res.ok||!data.access_token)throw Error('GOOGLE_TOKEN_REFRESH_FAILED');return String(data.access_token);
}
async function googleJson(url,opt){
  const r=await fetch(url,opt||{});let d={};try{d=await r.json();}catch(_){}
  if(!r.ok){const e=new Error('GOOGLE_API_'+r.status);e.data=d;throw e;}return d;
}
async function googleCreateFolder(token,name,parents){
  const body={name:cleanFileMeta(name,120)||'AREA Ledger',mimeType:'application/vnd.google-apps.folder'};if(parents&&parents.length)body.parents=parents;
  return googleJson('https://www.googleapis.com/drive/v3/files?fields=id%2CwebViewLink',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
}
async function googleEnsureRootFolder(env,ledgerHash,conn,token){
  if(conn&&conn.rootDriveFolderId)return conn.rootDriveFolderId;
  const f=await googleCreateFolder(token,'AREA Ledger',[]),now=new Date().toISOString();
  await env.LEDGER_DB.prepare('UPDATE google_connections SET root_drive_folder_id=?,updated_at=? WHERE ledger_hash=?').bind(f.id,now,ledgerHash).run();return f.id;
}
function googleCleanProject(body){
  const p=body&&body.project||{},id=cleanFileMeta(p.id,160),name=cleanFileMeta(p.name,180);if(!id||!name)throw Error('GOOGLE_PROJECT_INVALID');
  const rows=Array.isArray(body&&body.rows)?body.rows.slice(0,1500):[];return {id,name,rows};
}
function googleSheetRows(project,rows){
  const header=['รหัสหมวด','หมวดงาน','รายการ','ประเภท','จำนวน','หน่วย','ราคาต่อหน่วย','รวม','หมายเหตุ','Ledger ID'],all=[header],mat=[header],lab=[header],summaryMap={};
  for(const x of rows){if(!x||typeof x!=='object')continue;const qty=Number(x.qty)||0,price=Number(x.unitPrice)||0,cat=String(x.category||'')==='ค่าแรง'?'ค่าแรง':'ค่าวัสดุ',amt=Math.round(qty*price*100)/100,row=[String(x.sectionCode||''),String(x.sectionName||''),String(x.name||''),cat,qty,String(x.unit||''),price,amt,String(x.note||''),String(x.id||'')];all.push(row);(cat==='ค่าแรง'?lab:mat).push(row);const k=row[0]+'|'+row[1],m=summaryMap[k]||(summaryMap[k]={code:row[0],name:row[1],count:0,material:0,labor:0});m.count++;if(cat==='ค่าแรง')m.labor+=amt;else m.material+=amt;}
  const sum=[['รหัสหมวด','หมวดงาน','จำนวนรายการ','ค่าวัสดุ','ค่าแรง','รวม']];Object.values(summaryMap).forEach(m=>sum.push([m.code,m.name,m.count,Math.round(m.material*100)/100,Math.round(m.labor*100)/100,Math.round((m.material+m.labor)*100)/100]));
  return {boq:all,material:mat,labor:lab,summary:sum};
}
async function googleEnsureProjectAssets(env,ledgerHash,project,token){
  let link=await googleProjectLink(env,ledgerHash,project.id),conn=await googleConnection(env,ledgerHash),root=await googleEnsureRootFolder(env,ledgerHash,conn,token),now=new Date().toISOString(),folderId=link&&link.driveFolderId,spreadsheetId=link&&link.spreadsheetId;
  if(!folderId){const f=await googleCreateFolder(token,project.name,[root]);folderId=f.id;}
  if(!spreadsheetId){
    const created=await googleJson('https://sheets.googleapis.com/v4/spreadsheets',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({properties:{title:'BOQ - '+project.name},sheets:[{properties:{title:'BOQ'}},{properties:{title:'สรุปหมวด'}},{properties:{title:'ค่าวัสดุ'}},{properties:{title:'ค่าแรง'}}]})});spreadsheetId=created.spreadsheetId;
    let parents=[];try{const d=await googleJson('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(spreadsheetId)+'?fields=parents',{headers:{Authorization:'Bearer '+token}});parents=Array.isArray(d.parents)?d.parents:[];}catch(_){}
    const qs=new URLSearchParams({addParents:folderId,fields:'id,parents,webViewLink'});if(parents.length)qs.set('removeParents',parents.join(','));
    try{await googleJson('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(spreadsheetId)+'?'+qs.toString(),{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});}catch(_){}
  }
  const driveUrl='https://drive.google.com/drive/folders/'+folderId,sheetUrl='https://docs.google.com/spreadsheets/d/'+spreadsheetId+'/edit';
  await env.LEDGER_DB.prepare('INSERT INTO google_project_links (ledger_hash,project_id,project_name,drive_folder_id,spreadsheet_id,drive_url,sheet_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(ledger_hash,project_id) DO UPDATE SET project_name=excluded.project_name,drive_folder_id=excluded.drive_folder_id,spreadsheet_id=excluded.spreadsheet_id,drive_url=excluded.drive_url,sheet_url=excluded.sheet_url,updated_at=excluded.updated_at').bind(ledgerHash,project.id,project.name,folderId,spreadsheetId,driveUrl,sheetUrl,now,now).run();
  return {folderId,spreadsheetId,driveUrl,sheetUrl};
}
async function googleWriteRange(token,id,range,values){await googleJson('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+encodeURIComponent(range)+':clear',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});return googleJson('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+encodeURIComponent(range)+'?valueInputOption=RAW',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});}
async function googleSyncProject(env,ledgerHash,body){
  const project=googleCleanProject(body),token=await googleAccessToken(env,ledgerHash),asset=await googleEnsureProjectAssets(env,ledgerHash,project,token),data=googleSheetRows(project,project.rows);
  await googleWriteRange(token,asset.spreadsheetId,'BOQ!A:J',data.boq);await googleWriteRange(token,asset.spreadsheetId,'สรุปหมวด!A:F',data.summary);await googleWriteRange(token,asset.spreadsheetId,'ค่าวัสดุ!A:J',data.material);await googleWriteRange(token,asset.spreadsheetId,'ค่าแรง!A:J',data.labor);
  try{await googleJson('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(asset.spreadsheetId)+':batchUpdate',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({requests:[{updateSheetProperties:{properties:{sheetId:0,gridProperties:{frozenRowCount:1}},fields:'gridProperties.frozenRowCount'}},{autoResizeDimensions:{dimensions:{sheetId:0,dimension:'COLUMNS',startIndex:0,endIndex:10}}}]})});}catch(_){}
  const hash=await sha256Hex(JSON.stringify({id:project.id,name:project.name,rows:project.rows})),now=new Date().toISOString();await env.LEDGER_DB.prepare('UPDATE google_project_links SET last_sync_hash=?,last_sync_at=?,updated_at=? WHERE ledger_hash=? AND project_id=?').bind(hash,now,now,ledgerHash,project.id).run();
  return {ok:true,projectId:project.id,rows:data.boq.length-1,summaryRows:data.summary.length-1,lastSyncAt:now,...asset};
}

function parseGoogleUploadDataUrl(value){
  const m=/^data:(application\/pdf|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel|text\/csv|image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(String(value||''));if(!m)throw Error('GOOGLE_FILE_TYPE_UNSUPPORTED');
  let bin;try{bin=atob(m[2].replace(/\s+/g,''));}catch(_){throw Error('GOOGLE_FILE_BASE64_INVALID');}
  if(bin.length<1||bin.length>8*1024*1024)throw Error(bin.length>8*1024*1024?'GOOGLE_FILE_TOO_LARGE':'GOOGLE_FILE_EMPTY');
  const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return {mime:m[1].toLowerCase(),bytes:out};
}
async function googleUploadProjectFile(env,ledgerHash,body){
  const project=googleCleanProject({project:body&&body.project,rows:[]}),name=cleanFileMeta(body&&body.name,180)||'BOQ-source',parsed=parseGoogleUploadDataUrl(body&&body.dataUrl),token=await googleAccessToken(env,ledgerHash),asset=await googleEnsureProjectAssets(env,ledgerHash,project,token),boundary='area_'+randomHex(12);
  const meta={name,parents:[asset.folderId],appProperties:{areaLedger:'1',projectId:project.id}},head='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: '+parsed.mime+'\r\n\r\n',tail='\r\n--'+boundary+'--';
  const blob=new Blob([head,parsed.bytes,tail],{type:'multipart/related; boundary='+boundary}),d=await googleJson('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id%2Cname%2CmimeType%2Csize%2CwebViewLink',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'multipart/related; boundary='+boundary},body:blob}),now=new Date().toISOString(),view=String(d.webViewLink||('https://drive.google.com/file/d/'+d.id+'/view'));
  await env.LEDGER_DB.prepare('INSERT INTO google_drive_files (ledger_hash,project_id,drive_file_id,file_name,mime,size_bytes,web_view_link,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(ledger_hash,project_id,drive_file_id) DO UPDATE SET file_name=excluded.file_name,mime=excluded.mime,size_bytes=excluded.size_bytes,web_view_link=excluded.web_view_link').bind(ledgerHash,project.id,String(d.id||''),name,String(d.mimeType||parsed.mime),Math.max(0,+d.size||parsed.bytes.byteLength),view,now).run();
  return {ok:true,projectId:project.id,file:{id:String(d.id||''),name:name,mime:String(d.mimeType||parsed.mime),size:Math.max(0,+d.size||parsed.bytes.byteLength),webViewLink:view,createdAt:now},driveUrl:asset.driveUrl,sheetUrl:asset.sheetUrl};
}
async function googleProjectFiles(env,ledgerHash,pid){
  if(!d1Ready(env))return [];try{const q=await env.LEDGER_DB.prepare('SELECT drive_file_id AS id,file_name AS name,mime,size_bytes AS size,web_view_link AS webViewLink,created_at AS createdAt FROM google_drive_files WHERE ledger_hash=? AND project_id=? ORDER BY created_at DESC LIMIT 100').bind(ledgerHash,pid).all();return q&&q.results||[];}catch(_){return [];}
}
function r2Ready(env){return !!(env&&env.LEDGER_FILES&&typeof env.LEDGER_FILES.put==='function'&&typeof env.LEDGER_FILES.get==='function'&&typeof env.LEDGER_FILES.delete==='function');}
function productionComponents(env){const providerConfigured=providerReady(env),durableState=!!env.GATEWAY_STATE,d1Ledger=d1Ready(env),r2Files=r2Ready(env),exactOrigins=allowedOrigins(env).length;return {providerConfigured,durableState,d1Ledger,r2Files,exactOrigins,ready:providerConfigured&&durableState&&d1Ledger&&r2Files};}
async function d1SchemaReady(env){if(!d1Ready(env))return false;try{await env.LEDGER_DB.prepare('SELECT schema_version FROM ledger_meta LIMIT 1').all();await env.LEDGER_DB.prepare('SELECT object_key FROM ledger_files LIMIT 1').all();await env.LEDGER_DB.prepare('SELECT ledger_hash FROM google_connections LIMIT 1').all();await env.LEDGER_DB.prepare('SELECT project_id FROM google_project_links LIMIT 1').all();await env.LEDGER_DB.prepare('SELECT drive_file_id FROM google_drive_files LIMIT 1').all();return true;}catch(_){return false;}}
async function productionPlatformStatus(env){const c=productionComponents(env);c.d1Schema=await d1SchemaReady(env);c.googleWorkspace=googleConfigured(env);c.ready=!!(c.ready&&c.d1Schema);return c;}

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
    const expensePrompt='คุณเป็นระบบอ่านหลักฐานค่าใช้จ่ายสำหรับบัญชีก่อสร้าง อ่านภาพด้วย vision โดยตรง ไม่ใช่ OCR ตัวพิมพ์อย่างเดียว รองรับ (1) บิลเงินสดร้านเล็ก/บิลคาร์บอน/ลายมือไทย และ (2) ใบส่งของ ใบกำกับภาษี ใบเสร็จ หรือบิลพิมพ์จากร้านวัสดุก่อสร้าง. ต้องดูตำแหน่งช่อง ตาราง เส้น หัวข้อ และความสัมพันธ์ของตัวเลขทั้งเอกสาร. กฎยอดเงินสำคัญที่สุด: amount ต้องเป็นยอดที่ต้องจ่ายสุดท้าย. ให้เรียงความสำคัญ ยอดเงินสุทธิ/ยอดสุทธิ/NET TOTAL/GRAND TOTAL > รวมเงิน/TOTAL > รวมจำนวนเงิน/AMOUNT. ถ้าเอกสารมี รวมจำนวนเงิน/ก่อนภาษี + ภาษีมูลค่าเพิ่ม VAT + ยอดเงินสุทธิ ให้ amount = ยอดเงินสุทธิหลัง VAT และตรวจว่า subtotal + VAT ≈ net total; ห้ามเลือกยอดก่อน VAT เมื่อมียอดสุทธิชัด. ตัวอย่างบิลพิมพ์: 16 แผ่น × 265.00 = 4,240.00, VAT 7% = 296.80, ยอดเงินสุทธิ = 4,536.80 ดังนั้น amount ต้องเป็น 4536.80. สำหรับบิลเงินสดลายมือ ให้มองช่อง รวมเงิน/TOTAL ด้านล่างก่อนแล้วตรวจเทียบคอลัมน์ จำนวนเงิน/AMOUNT; ตัวอย่าง 325 จำนวน 4 บรรทัดและ TOTAL 1300 ให้ amount=1300. ถ้า TOTAL อ่านได้ชัด ให้ใช้ค่านั้นแม้ข้อความลายมืออื่นอ่านไม่ได้. ตัวเลขใน BOOK NO, BILL NO, TAX ID, เบอร์โทร, วันที่, จำนวนสินค้า และ UNIT PRICE ห้ามนำมาเป็น amount. ถ้าช่อง TOTAL จาง/อ่านไม่เต็ม แต่จำนวนเงินรายบรรทัดชัด ให้รวมเฉพาะ AMOUNT ของรายการในบิลเดียวกัน; ห้ามรวม UNIT PRICE; กรณีคำนวณจากแถวให้ confidence ไม่เกิน 0.80. อ่านรายการจาก DESCRIPTION/รายการ และชื่อร้าน/ผู้ขายจากหัวบิลหรือตราประทับ; ชื่อลูกค้าในช่อง CUSTOMER/NAME ไม่ใช่ partner. วันที่ไทย 2/10/69 หรือ 2/10/2569 ให้คืน 2026-10-02 เมื่ออ่านได้ชัด (พ.ศ.2569 หรือปี 69 = ค.ศ.2026) แต่ห้ามเดา. ถ้าเป็นร้านเหล็ก/วัสดุก่อสร้างให้ cat="ค่าของ"; งานช่าง/ค่าแรงให้ cat="ค่าแรง". ตอบ JSON เท่านั้น {"text":"ข้อความที่มองเห็นทั้งหมด","amount":ยอดที่ต้องจ่ายสุดท้ายเป็นตัวเลขไม่มี comma หรือ 0,"cat":"ค่าของ|ค่าแรง|ค่าประกัน/ค่างาน|ค่างานเอกสาร|ค่าเช่าอื่นๆ","sub":"รายการสินค้า/บริการสั้นๆ","partner":"ชื่อร้าน/ผู้ขายถ้าอ่านได้","date":"YYYY-MM-DD หรือค่าว่าง","confidence":0.0}. อ่านเฉพาะสิ่งที่มองเห็น ห้ามสร้างข้อมูล';
    const boqPrompt='คุณเป็นระบบอ่าน BOQ/ปร.4 งานก่อสร้างภาษาไทยจากภาพตาราง ใช้ vision ดูเส้นตาราง ตำแหน่งคอลัมน์ และตัวเลขที่พิมพ์จริง ไม่ใช่อ่านข้อความเรียงอย่างเดียว. รูปแบบหลักมีคอลัมน์ รายการ | จำนวน | หน่วย | ค่าวัสดุ(ราคาต่อหน่วย,จำนวนเงิน) | ค่าแรงงาน(ราคาต่อหน่วย,จำนวนเงิน) | รวมค่าวัสดุและแรงงาน | หมายเหตุ. สำคัญมาก: เอกสารอาจมีเลขวงกลมเขียนมือ 1-99 วางอยู่หน้าราคาต่อหน่วย เช่น วงกลม 1 แล้วตามด้วย 375.00 หรือวงกลม 21 แล้วตามด้วย 112.00; เลขวงกลมเป็นเลขกำกับ ห้ามใช้เป็น qty, unitPrice หรือ amount. ใช้เฉพาะตัวเลขพิมพ์ในช่องตาราง. ตรวจทุกแถวด้วย qty × unitPrice ≈ จำนวนเงิน โดยยอมคลาดเคลื่อนจากการปัดเศษเล็กน้อย. ถ้าหนึ่งรายการมีทั้งวัสดุและแรงงาน ให้แตกเป็น 2 แถว category "ค่าของ" และ "ค่าแรง" โดยใช้ qty/unit เดียวกัน. ถ้ามีเฉพาะวัสดุหรือเฉพาะแรงงาน ให้คืนเฉพาะแถวนั้น. แถวหัวหมวด เช่น งานโครงสร้างวิศวกรรม/งานเหล็กเสริม/งานหลังคา ไม่ใช่รายการราคา. แถว ยอดยกมา, รวมยอดยกไป, รวมราคาค่างานต้นทุน ไม่ใช่รายการ; declaredTotal ให้คืนเฉพาะยอดรวมสุดท้ายที่พิมพ์ชัด. ถ้าชื่อรายการต่อเนื่องลงบรรทัดถัดไปแต่ qty/ราคาอยู่บรรทัดแรก ให้รวมข้อความเป็นชื่อเดียว. อ่านเฉพาะสิ่งที่มองเห็นจริง ห้ามเดา. ถ้า unitPrice ไม่ชัดแต่ amount ชัด ห้ามคำนวณย้อนเพื่อสร้างราคา. หน่วยที่พบบ่อย: ตร.ม., ลบ.ม., ลบ.ฟ., เมตร, ม., กก., ตัน, ชุด, อัน, ตัว, แผ่น, เส้น, ท่อน, ถุง, ลูก, กล่อง, เที่ยว, งาน, หลัง, จุด, บ่อ, ต้น, เครื่อง, วัน, เดือน, ชั่วโมง. ตอบ JSON เท่านั้น {"text":"ข้อความที่มองเห็น","rows":[{"name":"ชื่อรายการ","qty":1,"unit":"หน่วย","unitPrice":0,"category":"ค่าของ","confidence":0.0}],"declaredTotal":0,"confidence":0.0}. จำกัดไม่เกิน 300 แถวต่อภาพ และห้ามสร้างข้อมูลที่มองไม่เห็น'
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
  if(url.pathname==='/v1/google/oauth/callback'&&request.method==='GET'){
    if(!googleConfigured(env))return new Response('Google Workspace is not configured',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    const state=String(url.searchParams.get('state')||''),code=String(url.searchParams.get('code')||'');if(!state||!code)return new Response('Google OAuth callback invalid',{status:400});
    const sh=await sha256Hex(state),row=await env.LEDGER_DB.prepare('SELECT ledger_hash AS ledgerHash,code_verifier AS codeVerifier,return_url AS returnUrl,expires_at AS expiresAt FROM google_oauth_states WHERE state_hash=? LIMIT 1').bind(sh).first();await env.LEDGER_DB.prepare('DELETE FROM google_oauth_states WHERE state_hash=?').bind(sh).run();
    if(!row||+row.expiresAt<Date.now())return new Response('Google OAuth state expired',{status:400});
    const redirectUri=new URL('/v1/google/oauth/callback',request.url).toString(),form=new URLSearchParams({client_id:String(env.GOOGLE_CLIENT_ID),client_secret:String(env.GOOGLE_CLIENT_SECRET),code,code_verifier:String(row.codeVerifier),grant_type:'authorization_code',redirect_uri:redirectUri});
    const tr=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});let td={};try{td=await tr.json();}catch(_){}
    if(!tr.ok||!td.refresh_token)return new Response('Google OAuth token exchange failed',{status:502});
    let email='';try{const ui=await googleJson('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+td.access_token}});email=cleanFileMeta(ui.email,160);}catch(_){}
    const enc=await googleEncrypt(env,td.refresh_token),now=new Date().toISOString();await env.LEDGER_DB.prepare('INSERT INTO google_connections (ledger_hash,email,refresh_token_enc,scopes,connected_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(ledger_hash) DO UPDATE SET email=excluded.email,refresh_token_enc=excluded.refresh_token_enc,scopes=excluded.scopes,updated_at=excluded.updated_at').bind(row.ledgerHash,email,enc,String(td.scope||''),now,now).run();
    const back=new URL(row.returnUrl);back.searchParams.set('google','connected');return Response.redirect(back.toString(),302);
  }
  if(['/v1/google/status','/v1/google/oauth/start','/v1/google/sync','/v1/google/file-upload','/v1/google/disconnect'].includes(url.pathname)){
    if(sentOrigin&&!origin)return json({error:'ORIGIN_DENIED'},403,'',rid);
    if(!protocolOk(request))return json({error:'PROTOCOL_VERSION_REQUIRED',protocol:PROTOCOL_VERSION},426,origin,rid);
    const access=ledgerAccessKey(request);if(!access)return json({error:'LEDGER_KEY_REQUIRED'},401,origin,rid);const ledgerHash=await sha256Hex(access),configured=googleConfigured(env);
    if(url.pathname==='/v1/google/status'&&request.method==='GET'){
      const conn=configured?await googleConnection(env,ledgerHash):null,pid=cleanFileMeta(url.searchParams.get('pid')||'',160),link=configured&&pid?await googleProjectLink(env,ledgerHash,pid):null,files=configured&&pid?await googleProjectFiles(env,ledgerHash,pid):[];
      return json({ok:true,configured,connected:!!conn,email:conn&&conn.email||'',project:link||null,files:files},200,origin,rid);
    }
    if(!configured)return json({error:'GOOGLE_NOT_CONFIGURED'},503,origin,rid);
    if(url.pathname==='/v1/google/oauth/start'&&request.method==='POST'){
      const b=await readJson(request),returnUrl=googleReturnUrl(request,b&&b.returnUrl,env);if(!returnUrl)return json({error:'GOOGLE_RETURN_URL_DENIED'},400,origin,rid);
      await env.LEDGER_DB.prepare('DELETE FROM google_oauth_states WHERE expires_at<?').bind(Date.now()).run();const state=randomHex(24),verifier=randomHex(32)+randomHex(16),challenge=await googlePkceChallenge(verifier),stateHash=await sha256Hex(state),now=new Date().toISOString(),expires=Date.now()+10*60*1000,redirectUri=new URL('/v1/google/oauth/callback',request.url).toString();
      await env.LEDGER_DB.prepare('INSERT INTO google_oauth_states (state_hash,ledger_hash,code_verifier,return_url,expires_at,created_at) VALUES (?,?,?,?,?,?)').bind(stateHash,ledgerHash,verifier,returnUrl,expires,now).run();
      const a=new URL('https://accounts.google.com/o/oauth2/v2/auth');a.searchParams.set('client_id',String(env.GOOGLE_CLIENT_ID));a.searchParams.set('redirect_uri',redirectUri);a.searchParams.set('response_type','code');a.searchParams.set('scope','openid email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets');a.searchParams.set('access_type','offline');a.searchParams.set('prompt','consent');a.searchParams.set('state',state);a.searchParams.set('code_challenge',challenge);a.searchParams.set('code_challenge_method','S256');return json({ok:true,authorizationUrl:a.toString()},200,origin,rid);
    }
    if(url.pathname==='/v1/google/sync'&&request.method==='POST'){try{return json(await googleSyncProject(env,ledgerHash,await readJson(request)),200,origin,rid);}catch(e){const code=String(e&&e.message||'GOOGLE_SYNC_FAILED');return json({error:code},code==='GOOGLE_NOT_CONNECTED'?409:502,origin,rid);}}
    if(url.pathname==='/v1/google/file-upload'&&request.method==='POST'){try{return json(await googleUploadProjectFile(env,ledgerHash,await readLedgerJson(request)),200,origin,rid);}catch(e){const code=String(e&&e.message||'GOOGLE_FILE_UPLOAD_FAILED'),status=code==='GOOGLE_NOT_CONNECTED'?409:code==='GOOGLE_FILE_TOO_LARGE'?413:code==='GOOGLE_FILE_TYPE_UNSUPPORTED'||code==='GOOGLE_FILE_BASE64_INVALID'||code==='GOOGLE_FILE_EMPTY'?400:502;return json({error:code},status,origin,rid);}}
    if(url.pathname==='/v1/google/disconnect'&&request.method==='POST'){await env.LEDGER_DB.prepare('DELETE FROM google_connections WHERE ledger_hash=?').bind(ledgerHash).run();await env.LEDGER_DB.prepare('DELETE FROM google_project_links WHERE ledger_hash=?').bind(ledgerHash).run();return json({ok:true},200,origin,rid);}
    return json({error:'METHOD_NOT_ALLOWED'},405,origin,rid);
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
