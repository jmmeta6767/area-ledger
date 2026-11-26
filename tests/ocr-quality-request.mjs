import assert from 'node:assert/strict';
import crypto from 'node:crypto';
// Transport retry only. Content/schema/numerical verification remains outside this function.
export async function requestOcrFixture({base,kind,imageBase64,mime='image/png',id,fetchImpl=fetch,pause=ms=>new Promise(r=>setTimeout(r,ms)),makeRequestId=()=>('quality-'+crypto.randomBytes(12).toString('hex')),maxAttempts=3}){
 assert(['boq','expense'].includes(kind));assert(Number.isInteger(maxAttempts)&&maxAttempts>=1&&maxAttempts<=4);
 const history=[];
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  const rid=makeRequestId();
  const response=await fetchImpl(base+'/v1/ocr/'+kind,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,'X-AREA-Gateway-Version':'1','X-AREA-Request-ID':rid},body:JSON.stringify({image:'data:'+mime+';base64,'+imageBase64,lang:'tha+eng'}),signal:AbortSignal.timeout(60000)});
  const data=await response.json();history.push({attempt,status:response.status,error:typeof data?.error==='string'?data.error:null});
  if(response.status===200){assert.equal(response.headers.get('X-AREA-Request-ID'),rid,id+' response request identity');assert.equal(response.headers.get('X-AREA-Gateway-Version'),'1',id+' response gateway identity');return {data,requestId:rid,attempts:attempt,history};}
  const transient=response.status===502&&/^PROVIDER_HTTP_(408|429|5[0-9][0-9])$/.test(data?.error||'');
  if(!(transient||[429,503,504].includes(response.status))||attempt===maxAttempts)throw Error(id+' OCR HTTP '+response.status+' '+JSON.stringify(data)+'; attempts='+JSON.stringify(history));
  await pause(2500*attempt);
 }
}
