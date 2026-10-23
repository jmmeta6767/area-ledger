// Strict propagation check: never accept a stale/wrong SHA or environment.
// Inject dependencies only in synthetic tests, not in deployed acceptance.
export async function waitForExactAppBuild({
  origin, sha, environment, attempts = 15, delayMs = 2000,
  fetcher = fetch, sleeper = ms => new Promise(resolve => setTimeout(resolve, ms))
}) {
  if (!/^[0-9a-f]{40}$/i.test(String(sha || ''))) throw new Error('Invalid exact-build SHA');
  if (!['staging','production'].includes(environment)) throw new Error('Invalid exact-build environment');
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 30) throw new Error('Invalid exact-build attempts');
  let last = 'no response';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    // Cache-busting query also bypasses stale shared HTML edge caches.
    const url = new URL('/', origin);
    url.searchParams.set('build', sha);
    url.searchParams.set('edge-probe', String(attempt));
    try {
      const res = await fetcher(url.toString(), {cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      if (!res.ok) last = 'HTTP '+res.status;
      else {
        const body = await res.text();
        const match = body.match(/var APP_BUILD=(\{[^\n]+\});/);
        if (!match) last = 'missing build marker';
        else {
          const build = JSON.parse(match[1]);
          if (build.sha === sha && build.environment === environment) {
            return {attempt, sha, environment};
          }
          last = 'wrong deployed identity sha='+String(build.sha).slice(0,40)+' environment='+String(build.environment).slice(0,20);
        }
      }
    } catch (err) { last = err?.name || 'network error'; }
    if (attempt < attempts) await sleeper(delayMs);
  }
  throw new Error('Exact app build never appeared at '+origin+' after '+attempts+
    ' attempts; expected='+sha+' '+environment+'; last='+last);
}
