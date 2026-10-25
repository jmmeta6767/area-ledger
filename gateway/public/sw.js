const C='site-ledger-v800-business-stable-1-source-candidate-1102-ui-next';
const CORE=['./','index.html','icon-180.png','icon-192.png','icon-512.png','manifest.webmanifest','area-logo-header.jpg','payroll.html','assets/ledger-reliability.css','assets/area-ledger-menu-icons.css','assets/area-ledger-menu-icons.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('site-ledger-v')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
  const url=new URL(e.request.url);
  // Authentication and private API responses must never use the offline app shell or caches.
  if(url.pathname.startsWith('/v1/')||url.pathname==='/health'||url.pathname==='/ready')return;
  // Safari disallows SW navigation responses with redirects in their history.
  // Let the browser handle legacy g navigations directly; never clear user data.
  if(e.request.mode==='navigate'&&self.location.hostname==='g.areamaibab.workers.dev')return;
  const navigation=e.request.mode==='navigate';
  const navCacheKey=(url.pathname==='/payroll.html'||url.pathname==='/portfolio.html')?url.pathname.slice(1):'./';
  e.respondWith(fetch(e.request,navigation?{cache:'no-store'}:undefined).then(async r=>{
    // Always return a fresh non-redirecting Response for successful HTML
    // navigations. This also handles WebKit cases without reliable .redirected.
    const headers=navigation&&r&&r.ok?new Headers(r.headers):null;
    if(headers)headers.delete('Location');
    const result=navigation&&r&&r.ok
      ?new Response(r.body,{status:r.status,statusText:r.statusText,headers}):r;
    if(result&&result.ok&&!result.redirected){try{const c=await caches.open(C);await c.put(navigation?navCacheKey:e.request,result.clone());}catch(ignore){/* A cache quota error must not reject the network response. */}}
    if(navigation&&(!result||!result.ok)){const c=await caches.open(C),cached=navCacheKey==='./'?(await c.match('./')||await c.match('index.html')):await c.match(navCacheKey);if(cached)return cached;}
    return result;
  }).catch(async()=>{const c=await caches.open(C);return (navigation?(navCacheKey==='./'?(await c.match('./')||await c.match('index.html')):await c.match(navCacheKey)):await c.match(e.request))||new Response('Offline',{status:503});}));
});

