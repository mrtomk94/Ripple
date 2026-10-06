import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHandler, createRateLimiter, clientIp } from '../src/server.js';
import { parseFeed } from '../src/xml.js';
import { fetchText } from '../src/fetch.js';

let server, base;
before(async () => {
  const pub = mkdtempSync(join(tmpdir(), 'pub-'));
  writeFileSync(join(pub, 'index.html'), '<script src="/app.js"></script>');
  writeFileSync(join(pub, 'app.js'), 'console.log(1)');
  const status = () => ({ usgs: { runs: 3, lastOk: 10, lastError: 'HTTP 403 from https://internal', lastErrorAt: 20, added: 1 } });
  server = createServer(createHandler({ store: { list: () => [] }, status, publicDir: pub, limiter: createRateLimiter({ limit: 3, windowMs: 60e3 }) }));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

// Fix 1
test('page CSP forbids inline scripts', async () => {
  const csp = (await fetch(`${base}/`)).headers.get('content-security-policy');
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.ok(!/script-src[^;]*unsafe-inline/.test(csp));
});
test('serves app.js as JavaScript', async () => {
  const r = await fetch(`${base}/app.js`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /javascript/);
});
test('real page has no inline script', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(!/<script>(?!\s*<\/script>)/.test(html), 'inline <script> found');
  assert.match(html, /<script src="\/app.js" defer><\/script>/);
});

// Fix 2
test('caps items per feed at 500', () => {
  const xml = '<rss>' + '<item><title>t</title></item>'.repeat(600) + '</rss>';
  assert.equal(parseFeed(xml).length, 500);
});
test('unclosed items are read in linear time', () => {
  const xml = '<item>'.repeat(300000);
  const t = performance.now();
  assert.deepEqual(parseFeed(xml), []);
  assert.ok(performance.now() - t < 300, `took ${performance.now() - t}ms`);
});
test('default download cap is 2 MB', async () => {
  const big = 'x'.repeat(2_000_001);
  await assert.rejects(fetchText('https://x', { fetchFn: async () => ({ ok: true, status: 200, text: async () => big }) }), /too large/);
});

// Fix 3
test('public health shows working/failing only, no error text', async () => {
  const body = await (await fetch(`${base}/api/health`, { headers: { 'x-forwarded-for': '9.9.9.1' } })).json();
  assert.deepEqual(body.sources.usgs, { runs: 3, lastOk: 10, failing: true });
  assert.ok(!JSON.stringify(body).includes('403'));
});

// Fix 4
test('rate limiter: 429 after limit, per IP', async () => {
  const hit = (ip) => fetch(`${base}/api/events`, { headers: { 'x-forwarded-for': ip } });
  for (let i = 0; i < 3; i++) assert.equal((await hit('1.1.1.1')).status, 200);
  const blocked = await hit('1.1.1.1');
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
  assert.equal((await hit('2.2.2.2')).status, 200);
});
test('rate limiter window resets', () => {
  let t = 0;
  const lim = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
  assert.equal(lim('a'), true);
  assert.equal(lim('a'), false);
  t = 1001;
  assert.equal(lim('a'), true);
});
test('rate limiter forgets old visitors so memory stays bounded', () => {
  let t = 0;
  const lim = createRateLimiter({ limit: 5, windowMs: 1000, now: () => t, maxTracked: 10 });
  for (let i = 0; i < 10; i++) lim(`ip${i}`);
  t = 5000;
  lim('new');
  assert.ok(lim.size() <= 2);
});
test('client IP comes from the first forwarded address, else the socket', () => {
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '5.5.5.5, 10.0.0.1' }, socket: {} }), '5.5.5.5');
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: '::1' } }), '::1');
  assert.equal(clientIp({ headers: {}, socket: {} }), 'unknown');
});

test('items with attributes are still read', () => {
  const items = parseFeed('<rdf><item rdf:about="https://a"><title>A</title></item><item\n><title>B</title></item><itemx><title>no</title></itemx></rdf>');
  assert.deepEqual(items.map((i) => i.title), ['A', 'B']);
});
