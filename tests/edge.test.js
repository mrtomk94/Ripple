import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { decodeText, parseFeed } from '../src/xml.js';
import { makeEvent, stableId } from '../src/event.js';
import { createScheduler } from '../src/scheduler.js';
import { createHandler } from '../src/server.js';
import { classifyHeadline, regionImpacts } from '../src/classify/rules.js';
import centralbanks from '../src/sources/centralbanks.js';
import nhc from '../src/sources/nhc.js';

test('decodes numeric, hex and unknown entities safely', () => {
  assert.equal(decodeText('it&#39;s &#x41; &bogus; &#0;'), "it's A &bogus; &#0;");
  assert.equal(decodeText('<b>bold</b>  text'), 'bold text');
});
test('items with missing parts still parse', () => {
  const [it] = parseFeed('<rss><item><description>x</description></item></rss>');
  assert.equal(it.title, '');
  assert.equal(it.link, '');
});
const base = { source: 's', title: 'T', link: 'https://a', date: '2026-10-01T00:00:00Z', cat: 'markets', sev: 2 };
test('makeEvent rejects bad links, dates and categories', () => {
  assert.equal(makeEvent({ ...base, link: 'javascript:alert(1)' }), null);
  assert.equal(makeEvent({ ...base, date: 'nope' }), null);
  assert.equal(makeEvent({ ...base, cat: 'sports' }), null);
});
test('makeEvent nulls out-of-range coordinates and clamps severity', () => {
  const e = makeEvent({ ...base, lat: 200, lng: 10, sev: 99 });
  assert.equal(e.lat, null);
  assert.equal(e.lng, null);
  assert.equal(e.sev, 5);
  assert.equal(makeEvent({ ...base, sev: 'x' }).sev, 1);
});
test('makeEvent dedupes sectors and derives ETFs', () => {
  const e = makeEvent({ ...base, sectors: [{ s: 'Energy', d: 1 }, { s: 'Energy', d: -1 }, null] });
  assert.equal(e.sectors.length, 1);
  assert.deepEqual(e.watch, ['XLE']);
  assert.equal(stableId('a', 'k'), stableId('a', 'k'));
});
test('falling headline flips sentiment-following sectors', () => {
  const r = classifyHeadline('Oil prices plunge as demand falls');
  assert.equal(r.sectors.find((s) => s.s === 'Energy').d, -1);
  assert.equal(r.sectors.find((s) => s.s === 'Travel & airlines').d, 1);
});
test('neutral headline gives mixed direction', () => {
  assert.equal(classifyHeadline('OPEC meets in Vienna').sectors[0].d, 0);
});
test('region impacts need numbers', () => {
  assert.deepEqual(regionImpacts(null, 1), []);
  assert.ok(regionImpacts(26, 52).some((s) => s.s === 'Energy'));
});
test('central bank and NHC parsers work without feed info', () => {
  const xml = '<rss><item><title>FOMC statement</title><link>https://fed/a</link><pubDate>Wed, 28 Oct 2026 18:00:00 GMT</pubDate></item></rss>';
  assert.equal(centralbanks.parse(xml)[0].src, 'Central bank');
  const storm = '<rss><item><title>Summary for Tropical Storm Zed</title><link>https://nhc/z</link><pubDate>Sat, 03 Oct 2026 21:00:00 GMT</pubDate><nhc:center>10, -40</nhc:center><nhc:wind>40 mph</nhc:wind></item></rss>';
  const [e] = nhc.parse(storm);
  assert.equal(e.title, 'Tropical Storm Zed');
  assert.equal(e.sev, 1);
});
test('scheduler logs a failed save and skips overlapping runs', async () => {
  const errors = [];
  let release;
  const gate = new Promise((r) => { release = r; });
  const src = { name: 'a', intervalMin: 1, feeds: [{ url: 'https://a' }], parse: () => [] };
  const store = { upsert: () => 0, prune() {}, save: async () => { throw new Error('disk full'); } };
  const s = createScheduler({ sources: [src], store, log: { info() {}, error: (m) => errors.push(m) }, fetchText: () => gate });
  const first = s.runSource(src);
  await s.runSource(src); // overlapping call returns immediately
  release('x');
  await first;
  assert.equal(s.status().a.runs, 1);
  assert.ok(errors.some((m) => m.includes('disk full')));
});
test('scheduler tracks sources it was not created with', async () => {
  const src = { name: 'late', intervalMin: 1, feeds: [], parse: () => [] };
  const s = createScheduler({ sources: [], store: { upsert: () => 0, prune() {}, save: async () => {} }, log: { info() {}, error() {} }, fetchText: async () => '' });
  await s.runSource(src);
  assert.equal(s.status().late.runs, 1);
});
test('server returns 500 without leaking details when the store throws', async () => {
  const handler = createHandler({ store: { list() { throw new Error('secret path /var/data'); } }, status: () => ({}), publicDir: '/nonexistent' });
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const r = await fetch(`${base}/api/events`);
  assert.equal(r.status, 500);
  assert.ok(!(await r.text()).includes('secret'));
  assert.equal((await fetch(`${base}/`)).status, 500); // missing page file
  server.close();
});
