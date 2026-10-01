const LEGACY_RECOVERY_SW='area-ledger-legacy-recovery-v1';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('site-ledger-v')).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
/* Recovery host is intentionally network-only. No app shell is cached here. */
self.addEventListener('fetch',()=>{});
