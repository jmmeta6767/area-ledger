/* Private evidence is uploaded only by owner action after fresh portable backup and consent. */
async function profitEvidenceHash(bytes){var hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}
function profitEvidenceBytes(dataUrl){var m=/^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(dataUrl||''));if(!m)throw Error('EVIDENCE_TYPE');var raw=atob(m[2]),bytes=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return {mime:m[1],bytes:bytes};}
function profitEvidenceType(bytes,mime){
 if(mime==='application/pdf')return bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45;
 if(mime==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime==='image/png')return [137,80,78,71,13,10,26,10].every(function(x,i){return bytes[i]===x;});
 if(mime==='image/webp')return String.fromCharCode.apply(null,bytes.slice(0,4))==='RIFF'&&String.fromCharCode.apply(null,bytes.slice(8,12))==='WEBP';return false;
}
async function profitHydrateEvidenceBackup(state){
 for(var p of state.projects||[]){for(var item of p.handoverEvidence||[]){
  var original=item.dataUrl||await idbRead('handover-original-v1:'+item.sha256);if(!original)throw Error('HANDOVER_EVIDENCE_ORIGINAL_MISSING');
  var parsed=profitEvidenceBytes(original);if(parsed.mime!==item.mime||parsed.bytes.length!==item.size||await profitEvidenceHash(parsed.bytes)!==item.sha256)throw Error('HANDOVER_EVIDENCE_CHECKSUM');item.dataUrl=original;
 }}return state;
}
function profitEvidenceHtml(pid){
 var p=proj(pid);if(!p)return '<p>ไม่พบโครงการ</p>';var files=p.handoverEvidence||[];
 return '<div class="project-form-head"><h3 id="evidenceFormTitle">หลักฐานส่งมอบส่วนตัว</h3><button data-act="closeSheet" aria-label="ปิด">×</button></div><div class="project-form-scroll profit-form"><p>'+esc(p.name)+'</p><p>PDF / JPEG / PNG / WebP ไม่เกิน 2 MB ต่อไฟล์ เก็บต้นฉบับในเครื่องและตรวจไฟล์ที่อัปโหลดกลับก่อนผูกโครงการ</p>'+files.map(function(f){return '<div class="profit-evidence-row"><b>'+esc(f.name)+'</b><small>'+esc(f.createdAt)+' · '+esc(f.mime)+' · '+f.size+' bytes</small><button class="btn" data-act="profitEvidenceOpen" data-id="'+esc(pid)+'" data-hash="'+esc(f.sha256)+'">ดาวน์โหลดต้นฉบับที่ตรวจแล้ว</button></div>';}).join('')+'<label for="profitEvidenceFile">เลือกไฟล์หลักฐาน</label><input type="file" style="display:block" id="profitEvidenceFile" accept="application/pdf,image/jpeg,image/png,image/webp"><label><input type="checkbox" id="profitEvidenceConsent">ยินยอมเก็บไฟล์นี้ในคลัง R2 ส่วนตัวของบัญชี และยืนยันว่าได้เก็บสำรองล่าสุดพร้อมตรวจเปิดรูป/ไฟล์ต้นฉบับแล้ว</label><p>ต้องเปิด Cloud Sync และสร้างสำรองข้อมูลรุ่นปัจจุบันภายใน 24 ชั่วโมงก่อนอัปโหลด ไม่มีการย้ายไฟล์เก่าอัตโนมัติ</p></div><div class="project-form-savebar"><button data-act="closeSheet">ปิด</button><button class="primary" data-act="profitEvidenceUpload" data-id="'+esc(pid)+'">อัปโหลดและตรวจไฟล์กลับ</button></div>';
}
async function profitEvidenceRead(item){
 var original=item.dataUrl||await idbRead('handover-original-v1:'+item.sha256);
 if(original){var local=profitEvidenceBytes(original);if(local.mime!==item.mime||local.bytes.length!==item.size||await profitEvidenceHash(local.bytes)!==item.sha256)throw Error('EVIDENCE_LOCAL_CHANGED');return local.bytes;}
 var headers=cloudHeaders();if(!headers)throw Error('EVIDENCE_NOT_CONNECTED');delete headers['Content-Type'];
 var response=await fetch(gatewayApiUrl('/v1/files/object?key='+encodeURIComponent(item.key)),{headers:headers,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('EVIDENCE_READ_FAILED');var bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length!==item.size||await profitEvidenceHash(bytes)!==item.sha256)throw Error('EVIDENCE_READBACK_MISMATCH');return bytes;
}
async function profitEvidenceUpload(pid,file,consent){
 if(S.role!=='owner'||U.profitEvidenceBusy||!proj(pid)||!file||!consent)throw Error('EVIDENCE_CONSENT_REQUIRED');
 if(!cloudSyncEnabled()||!cloudLedgerKey(false))throw Error('EVIDENCE_NOT_CONNECTED');
 if(!S.lastBackup||Date.now()-Number(S.lastBackup)>86400000||Number(S.lastBackup)>Date.now()||+S.lastBackupRevision!==+S.dataRevision)throw Error('EVIDENCE_FRESH_BACKUP_REQUIRED');
 if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>2*1024*1024)throw Error('EVIDENCE_TYPE_OR_SIZE');
 var snapshot=JSON.stringify(S),disk=storageCurrentRaw(),cloudKey=cloudLedgerKey(false);if(snapshot!==committedState||disk!==committedState)throw Error('EVIDENCE_UNCOMMITTED_STATE');U.profitEvidenceBusy=true;
 try{
  var bytes=new Uint8Array(await file.arrayBuffer());if(bytes.length!==file.size||!profitEvidenceType(bytes,file.type))throw Error('EVIDENCE_CONTENT_INVALID');
  var hash=await profitEvidenceHash(bytes),p=proj(pid);if((p.handoverEvidence||[]).some(function(x){return x.sha256===hash;}))return true;
  var data='';for(var i=0;i<bytes.length;i++)data+=String.fromCharCode(bytes[i]);var original='data:'+file.type+';base64,'+btoa(data),copyKey='handover-original-v1:'+hash;
  if(!await idbPut(copyKey,original)||await idbRead(copyKey)!==original)throw Error('EVIDENCE_BACKUP_FAILED');
  function current(){return JSON.stringify(S)===snapshot&&storageCurrentRaw()===disk&&cloudSyncEnabled()&&cloudLedgerKey(false)===cloudKey;}
  if(!current())throw Error('EVIDENCE_SOURCE_CHANGED');
  var ownerHash=await profitEvidenceHash(new TextEncoder().encode(cloudKey)),pendingKey='handover-pending-v1:'+ownerHash+':'+pid+':'+hash,pending=await idbRead(pendingKey),revision=p.handover&&p.handover.updatedAt||0,item=null;
  if(pending&&pending.sha256===hash&&pending.size===bytes.length&&pending.mime===file.type&&pending.handoverRevision===revision)item=pending;
  if(!item){
   var upload=await cloudFileUpload(original,'handover',pid+'@'+String(revision),file.name);
   if(!upload.ok||!upload.data||!upload.data.key||upload.data.indexed!==true||upload.data.sha256!==hash||upload.data.size!==bytes.length||upload.data.mime!==file.type)throw Error('EVIDENCE_UPLOAD_UNVERIFIED');
   item={key:upload.data.key,sha256:hash,size:bytes.length,mime:file.type,name:String(file.name||'evidence').slice(0,120),createdAt:new Date().toISOString(),handoverRevision:revision};
   if(!await idbPut(pendingKey,item))throw Error('EVIDENCE_PENDING_SAVE_FAILED');
  }
  // Force remote byte readback even though a verified local copy already exists.
  var headers=cloudHeaders();if(!headers)throw Error('EVIDENCE_NOT_CONNECTED');delete headers['Content-Type'];
  var response=await fetch(gatewayApiUrl('/v1/files/object?key='+encodeURIComponent(item.key)),{headers:headers,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('EVIDENCE_READ_FAILED');var remote=new Uint8Array(await response.arrayBuffer());if(remote.length!==bytes.length||await profitEvidenceHash(remote)!==hash)throw Error('EVIDENCE_READBACK_MISMATCH');
  if(!current())throw Error('EVIDENCE_SOURCE_CHANGED');
  var before=JSON.parse(snapshot);p=proj(pid);p.handoverEvidence=(p.handoverEvidence||[]).concat([item]);accountingAudit('handover-evidence','project',pid,null,{sha256:hash,size:item.size},'เพิ่มหลักฐานส่วนตัวที่ตรวจไฟล์กลับแล้ว');
  if(!await persist()){S=before;throw Error('EVIDENCE_SAVE_FAILED');}return true;
 }finally{U.profitEvidenceBusy=false;}
}
async function profitEvidenceAction(el){
 var a=el.getAttribute('data-act'),pid=el.getAttribute('data-id')||'',p=proj(pid);if(S.role!=='owner'||!p)return true;
 if(a==='profitEvidence'){U.sheet={kind:'profitEvidence',id:pid};render();return true;}
 if(a==='profitEvidenceOpen'){var item=(p.handoverEvidence||[]).find(function(x){return x.sha256===el.getAttribute('data-hash');});if(item){try{var bytes=await profitEvidenceRead(item);await saveFile(item.name,new Blob([bytes],{type:item.mime}));}catch(e){toast('ตรวจต้นฉบับไม่สำเร็จ · '+e.message);}}return true;}
 if(a==='profitEvidenceUpload'){
  var input=document.getElementById('profitEvidenceFile'),consent=!!(document.getElementById('profitEvidenceConsent')||{}).checked;
  if(!U.sheet||U.sheet.kind!=='profitEvidence'||U.sheet.id!==pid)return true;
  try{if(await profitEvidenceUpload(pid,input&&input.files&&input.files[0],consent)){render();toast('เก็บหลักฐานและตรวจไฟล์กลับแล้ว');}}catch(e){toast('ยังไม่ผูกไฟล์หลักฐาน · '+e.message+' · เก็บต้นฉบับไว้แล้วตรวจอีกครั้ง');}return true;
 }return true;
}
