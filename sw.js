const C='site-ledger-v137-doc-lifecycle';
const CORE=['./','index.html','icon-180.png','icon-192.png','icon-512.png','manifest.webmanifest','area-logo-header.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put('./',cp));}return r;}).catch(()=>caches.match('./').then(r=>r||caches.match('index.html'))));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request)));
});