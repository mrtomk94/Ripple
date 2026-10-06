import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHandler } from '../src/server.js';

let server, base;
const events = [{ id: 'a', cat: 'war', title: 'A' }, { id: 'b', cat: 'tech', title: 'B' }];
before(async () => {
  const pub = mkdtempSync(join(tmpdir(), 'pub-'));
  writeFileSync(join(pub, 'index.html'), '<h1>Ripple</h1>');
  const store = { list: ({ cat, limit } = {}) => events.filter((e) => !cat || e.cat === cat).slice(0, limit ?? 999) };
  const handler = createHandler({ store, status: () => ({ usgs: { lastOk: 1 } }), publicDir: pub, now: () => 42 });
  server = createServer(handler);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('GET /api/events returns all events with timestamp', async () => {
  const r = await fetch(`${base}/api/events`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /application\/json/);
  const body = await r.json();
  assert.equal(body.events.length, 2);
  assert.equal(body.generatedAt, 42);
});
test('filters by category and ignores unknown categories', async () => {
  assert.equal((await (await fetch(`${base}/api/events?cat=war`)).json()).events.length, 1);
  assert.equal((await (await fetch(`${base}/api/events?cat=<script>`)).json()).events.length, 2);
});
test('limit is clamped', async () => {
  assert.equal((await (await fetch(`${base}/api/events?limit=1`)).json()).events.length, 1);
  assert.equal((await (await fetch(`${base}/api/events?limit=-5`)).json()).events.length, 1);
});
test('GET /api/health reports source status', async () => {
  const body = await (await fetch(`${base}/api/health`)).json();
  assert.equal(body.ok, true);
  assert.equal(body.sources.usgs.lastOk, 1);
});
test('serves the page with security headers', async () => {
  const r = await fetch(`${base}/`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Ripple/);
  assert.ok(r.headers.get('content-security-policy'));
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});
test('does not serve files outside public', async () => {
  const r = await fetch(`${base}/../package.json`);
  assert.equal(r.status, 404);
  assert.equal((await fetch(`${base}/%2e%2e/package.json`)).status, 404);
});
test('unknown routes and methods', async () => {
  assert.equal((await fetch(`${base}/nope`)).status, 404);
  assert.equal((await fetch(`${base}/api/events`, { method: 'POST' })).status, 405);
});
