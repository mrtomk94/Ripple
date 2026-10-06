import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { CATEGORIES } from './event.js';
import { createStore } from './store.js';
import { createScheduler } from './scheduler.js';
import { fetchText } from './fetch.js';
import sources from './sources/index.js';

// The page only talks to this server (connect-src 'self').
const PAGE_CSP = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src https://fonts.gstatic.com",
  "img-src 'self' data:", "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'",
].join('; ');

function send(res, status, body, type, extra = {}) {
  res.writeHead(status, {
    'content-type': type, 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', ...extra,
  });
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8', { 'cache-control': 'no-store' });

export function createHandler({ store, status, publicDir, now = Date.now }) {
  const pagePath = join(publicDir, 'index.html');
  return async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method not allowed' });
      const { pathname, searchParams } = new URL(req.url, 'http://localhost');
      if (pathname === '/api/events') {
        const cat = CATEGORIES.includes(searchParams.get('cat')) ? searchParams.get('cat') : undefined;
        const raw = parseInt(searchParams.get('limit'), 10);
        const limit = Number.isNaN(raw) ? 300 : Math.min(500, Math.max(1, raw));
        return json(res, 200, { generatedAt: now(), events: store.list({ cat, limit }) });
      }
      if (pathname === '/api/health') return json(res, 200, { ok: true, sources: status() });
      if (pathname === '/' || pathname === '/index.html') {
        return send(res, 200, await readFile(pagePath), 'text/html; charset=utf-8', { 'content-security-policy': PAGE_CSP, 'cache-control': 'no-cache' });
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
