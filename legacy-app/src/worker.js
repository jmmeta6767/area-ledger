const CANONICAL_GATEWAY='https://area-ledger-ai-gateway.areamaibab.workers.dev';
const CLIENT_CONTRACT='v1005-canonical-gateway';

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'no-referrer'
    }
  });
}

function gatewayPath(pathname){
  return pathname==='/health'||pathname==='/ready'||pathname.startsWith('/v1/');
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if((url.pathname==='/'||url.pathname==='/index.html')&&(request.method==='GET'||request.method==='HEAD')){
      const shell=await env.ASSETS.fetch(request),headers=new Headers(shell.headers);
      headers.set('Cache-Control','no-store');
      headers.set('Pragma','no-cache');
      return new Response(shell.body,{status:shell.status,statusText:shell.statusText,headers});
    }
    if(url.pathname==='/legacy-health'){
      return json({ok:true,service:'area-ledger-legacy-app',protocol:'1',clientContract:CLIENT_CONTRACT,canonicalGateway:CANONICAL_GATEWAY});
    }
    // Escape hatch for an old iPhone Safari Service Worker that serves redirects.
    // /v1/* is deliberately bypassed by existing SW scripts, so this page stays reachable.
    // Never delete localStorage, IndexedDB, CacheStorage or project/payroll records.
    if(url.pathname==='/v1/safari-repair'&&request.method==='GET'){
      const page=\`<!doctype html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AREA Ledger — แก้ Safari โดยไม่ลบข้อมูล</title>
<style>body{font:17px -apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:40px auto;padding:18px;line-height:1.65;color:#172536;background:#f8fafc}main{padding:22px;background:white;border-radius:20px}button,a{display:block;padding:12px 18px;margin-top:16px;border:0;border-radius:12px;background:#f4c533;color:#172536;font-size:17px;font-weight:650;text-align:center;text-decoration:none}small{display:block;color:#555}#back{display:none}</style></head>
<body><main><h1>แก้หน้าเว็บ Safari</h1>
<p>แก้เฉพาะ Service Worker ของโดเมนนี้ ไม่ลบข้อมูลโครงการ เงินเดือน หรือบัญชีในเครื่อง</p>
<button id="fix">ซ่อม Service Worker โดยไม่ล้างข้อมูล</button>
<p id="status" role="status"></p>
<a id="back" href="/index.html">เปิด AREA Ledger อีกครั้ง</a>
<small>ห้ามกดล้างข้อมูลเว็บไซต์ในตั้งค่า Safari เพื่อแก้ปัญหานี้</small>
</main><script>
document.getElementById('fix').addEventListener('click',async function(){
 const out=document.getElementById('status'),button=this;
 button.disabled=true;
 try{
  if(!('serviceWorker' in navigator)){out.textContent='ไม่พบ Service Worker ให้กดเปิด AREA Ledger อีกครั้ง';}
  else{
   const regs=await navigator.serviceWorker.getRegistrations();
   const own=regs.filter(r=>new URL(r.scope).origin===location.origin);
   const removed=await Promise.all(own.map(r=>r.unregister()));
   if(removed.some(x=>!x))throw new Error('ไม่สามารถยกเลิก Service Worker ได้');
   out.textContent='ซ่อมแล้ว: ยกเลิก Service Worker ของโดเมนนี้ '+own.length+' รายการ ข้อมูลยังอยู่ครบ';
  }
  document.getElementById('back').style.display='block';
 }catch(e){out.textContent='ยังซ่อมไม่สำเร็จ: '+String(e.message||e);button.disabled=false;}
});
</script></body></html>\`;
      return new Response(page,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    if(gatewayPath(url.pathname)){
      const target=new URL(url.pathname+url.search,CANONICAL_GATEWAY);
      const headers=new Headers(request.headers);
      headers.set('X-AREA-Legacy-App','g');
      return env.GATEWAY.fetch(new Request(target.toString(),{
        method:request.method,
        headers,
        body:['GET','HEAD'].includes(request.method)?undefined:request.body,
        redirect:'manual'
      }));
    }
    return env.ASSETS.fetch(request);
  }
};
