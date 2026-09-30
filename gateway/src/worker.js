const MAX_BODY_BYTES = 3 * 1024 * 1024;
const WINDOW_MS = 60_000;
const buckets = new Map();

function json(data, status = 200, origin = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin'
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '600';
  }
  return new Response(JSON.stringify(data), { status, headers });
}
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
}
function corsOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  return origin && allowedOrigins(env).includes(origin) ? origin : '';
}
function rateKey(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}
function rateAllowed(request, env) {
  const limit = Math.max(1, Math.min(120, Number(env.RATE_LIMIT_PER_MINUTE) || 20));
  const now = Date.now(), key = rateKey(request), old = buckets.get(key);
  if (!old || now - old.start >= WINDOW_MS) { buckets.set(key, { start: now, count: 1 }); return true; }
  old.count += 1; return old.count <= limit;
}
async function readJson(request) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len && len > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
  return JSON.parse(text);
}
function validateExpense(body) {
  const image = body && body.image;
  if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) throw new Error('INVALID_IMAGE');
  return { image, lang: 'tha+eng' };
}
async function expenseOcr(payload, env) {
  if (!env.OCR_UPSTREAM_URL || !env.OCR_API_KEY) throw new Error('PROVIDER_NOT_CONFIGURED');
  const response = await fetch(env.OCR_UPSTREAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.OCR_API_KEY },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('PROVIDER_HTTP_' + response.status);
  const data = await response.json();
  return {
    text: String(data.text || '').slice(0, 20000),
    amount: Math.max(0, Number(data.amount) || 0),
    cat: String(data.cat || 'ค่าของ').slice(0, 80),
    sub: String(data.sub || '').slice(0, 160),
    partner: String(data.partner || '').slice(0, 160)
  };
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'area-ledger-ai-gateway', version: 1 });
    const origin = corsOrigin(request, env);
    if (request.method === 'OPTIONS') return origin ? json({ ok: true }, 204, origin) : json({ error: 'ORIGIN_DENIED' }, 403);
    if (url.pathname !== '/v1/ocr/expense' || request.method !== 'POST') return json({ error: 'NOT_FOUND' }, 404);
    if (!origin) return json({ error: 'ORIGIN_DENIED' }, 403);
    if (!rateAllowed(request, env)) return json({ error: 'RATE_LIMITED' }, 429, origin);
    try {
      const payload = validateExpense(await readJson(request));
      return json(await expenseOcr(payload, env), 200, origin);
    } catch (error) {
      const code = String(error && error.message || 'GATEWAY_ERROR');
      const status = code === 'PAYLOAD_TOO_LARGE' ? 413 : code === 'INVALID_IMAGE' ? 400 : code === 'PROVIDER_NOT_CONFIGURED' ? 503 : 502;
      return json({ error: code }, status, origin);
    }
  }
};
