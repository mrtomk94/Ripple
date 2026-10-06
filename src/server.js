import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { CATEGORIES } from './event.js';
import { createStore } from './store.js';
import { createScheduler, publicHealth } from './scheduler.js';
import { fetchText } from './fetch.js';
import sources from './sources/index.js';

// The page only talks to this server (connect-src 'self').
const PAGE_CSP = [
  "default-src 'self'", "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src https://fonts.gstatic.com",
  "img-src 'self' data:", "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'",
].join('; ');

function send(res, status, body, type, extra = {}) {
  res.writeHead(status, {
    'content-type': type, 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', ...extra,
  });
  res.end(body);
}
// Fixed-window limiter per client. Old entries are swept so memory stays bounded.
export function createRateLimiter({ limit = 60, windowMs = 60e3, now = Date.now, maxTracked = 10000 } = {}) {
  const hits = new Map();
  const allow = (key) => {
    const t = now();
    if (hits.size >= maxTracked) for (const [k, v] of hits) if (t - v.start > windowMs) hits.delete(k);
    const entry = hits.get(key);
    if (!entry || t - entry.start > windowMs) { hits.set(key, { start: t, count: 1 }); return true; }
    entry.count++;
    return entry.count <= limit;
  };
  allow.size = () => hits.size;
  allow.windowMs = windowMs;
  return allow;
}

// Render sits behind a proxy, so the visitor's address is the first X-Forwarded-For entry.
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}



const json = (res, status, obj, extra = {}) => send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8', { 'cache-control': 'no-store', ...extra });

const STATIC = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };

export function createHandler({ store, status, publicDir, now = Date.now, limiter = createRateLimiter() }) {
  return async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method not allowed' });
      const { pathname, searchParams } = new URL(req.url, 'http://localhost');
      if (!limiter(clientIp(req))) {
        return json(res, 429, { error: 'too many requests' }, { 'retry-after': String(Math.ceil(limiter.windowMs / 1000)) });
      }
      if (pathname === '/api/events') {
        const cat = CATEGORIES.includes(searchParams.get('cat')) ? searchParams.get('cat') : undefined;
        const raw = parseInt(searchParams.get('limit'), 10);
        const limit = Number.isNaN(raw) ? 300 : Math.min(500, Math.max(1, raw));
        return json(res, 200, { generatedAt: now(), events: store.list({ cat, limit }) });
      }
      if (pathname === '/api/health') return json(res, 200, { ok: true, sources: publicHealth(status()) });
      if (STATIC[pathname]) {
        const [file, type] = STATIC[pathname];
        return send(res, 200, await readFile(join(publicDir, file)), type, { 'content-security-policy': PAGE_CSP, 'cache-control': 'no-cache' });
      }
      return json(res, 404, { error: 'not found' });
    } catch {
      return json(res, 500, { error: 'server error' });
    }
  };
}

export async function main(env = process.env) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const store = createStore({ file: join(env.DATA_DIR || join(root, 'data'), 'events.json') });
  await store.load();
  const scheduler = createScheduler({ sources, store, fetchText });
  const server = createServer(createHandler({ store, status: scheduler.status, publicDir: join(root, 'public') }));
  const port = Number(env.PORT) || 3000;
  server.listen(port, () => console.info(`Ripple listening on :${port}`));
  scheduler.start();
  const shutdown = async () => { scheduler.stop(); await store.save().catch(() => {}); server.close(() => process.exit(0)); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
