const C='site-ledger-v600-stable-source-candidate';
const CORE=['./','index.html','icon-180.png','icon-192.png','icon-512.png','manifest.webmanifest','area-logo-header.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('site-ledger-v')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
  const navigation=e.request.mode==='navigate';
  e.respondWith(fetch(e.request,navigation?{cache:'no-store'}:undefined).then(async r=>{
    if(r&&r.ok){try{const c=await caches.open(C);await c.put(navigation?'./':e.request,r.clone());}catch(ignore){/* A cache quota error must not reject the network response. */}}
    if(navigation&&(!r||!r.ok)){const c=await caches.open(C),cached=await c.match('./')||await c.match('index.html');if(cached)return cached;}
    return r;
  }).catch(async()=>{const c=await caches.open(C);return (navigation?(await c.match('./')||await c.match('index.html')):await c.match(e.request))||new Response('Offline',{status:503});}));
});
