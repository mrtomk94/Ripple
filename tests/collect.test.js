import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collect, collectToFile } from '../src/collect.js';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const ev = (id, daysAgo) => ({ id, cat: 'markets', sev: 2, title: id, link: `https://x/${id}`, date: new Date(NOW - daysAgo * 864e5).toISOString(), sectors: [], chain: [], src: 't', lat: null, lng: null });
const quiet = { info() {}, error() {} };
const src = (name, out) => ({ name, intervalMin: 15, feeds: [{ url: `https://${name}` }], parse: () => out });

test('merges new events with the previous run and drops expired ones', async () => {
  const out = await collect({
    sources: [src('a', [ev('new', 0)])], fetchText: async () => '', log: quiet, now: () => NOW,
    previous: { events: [ev('kept', 2), ev('old', 30)] },
  });
  assert.deepEqual(out.events.map((e) => e.id), ['new', 'kept']);
  assert.equal(out.generatedAt, NOW);
});
test('reports public health without error text', async () => {
  const out = await collect({
    sources: [src('ok', []), { ...src('down', []), parse: () => { throw new Error('HTTP 404 secret'); } }],
    fetchText: async () => '', log: quiet, now: () => NOW,
  });
  assert.equal(out.sources.ok.failing, false);
  assert.equal(out.sources.down.failing, true);
  assert.ok(!JSON.stringify(out).includes('secret'));
});
test('ignores a broken previous file', async () => {
  const out = await collect({ sources: [], fetchText: async () => '', log: quiet, now: () => NOW, previous: { events: 'nope' } });
  assert.deepEqual(out.events, []);
});
test('collectToFile reads the old file and writes the new one', async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'c-')), 'events.json');
  writeFileSync(file, JSON.stringify({ events: [ev('kept', 1)] }));
  await collectToFile(file, { sources: [src('a', [ev('new', 0)])], fetchText: async () => '', log: quiet, now: () => NOW });
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(saved.events.length, 2);
});
test('collectToFile starts fresh when the old file is missing or corrupt', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'c-'));
  const bad = join(dir, 'bad.json');
  writeFileSync(bad, '<html>404</html>');
  await collectToFile(bad, { sources: [], fetchText: async () => '', log: quiet, now: () => NOW });
  assert.deepEqual(JSON.parse(readFileSync(bad, 'utf8')).events, []);
  const missing = join(dir, 'missing.json');
  await collectToFile(missing, { sources: [], fetchText: async () => '', log: quiet, now: () => NOW });
  assert.deepEqual(JSON.parse(readFileSync(missing, 'utf8')).events, []);
});

test('tracks predictions across runs and scores them a trading day later', async () => {
  const H = 3600e3;
  const csv = (price, date) => `Date,Open,High,Low,Close,Volume\n2026-10-01,1,1,1,${price},1\n${date},1,1,1,${price},1\n`;
  const fresh = { ...ev('oil', 0), sectors: [{ s: 'Energy', d: 1 }] };
  const prices = (xle, spy, date) => async (u) => (u.includes('xle') ? csv(xle, date) : u.includes('spy') ? csv(spy, date) : '');
  const first = await collect({ sources: [src('a', [fresh])], fetchText: prices(100, 500, '2026-10-06'), log: quiet, now: () => NOW });
  assert.equal(first.predictions.length, 1);
  assert.equal(first.predictions[0].start.price, 100);
  assert.equal(first.scorecard.pending, 1);
  const second = await collect({ sources: [src('a', [])], fetchText: prices(103, 505, '2026-10-07'), log: quiet, now: () => NOW + 26 * H, previous: first });
  assert.equal(second.predictions[0].tier, 'small');
  assert.equal(second.predictions[0].status, 'hit');
  assert.equal(second.scorecard.hitRate, 1);
});
test('weekend runs reuse Friday prices instead of refetching', async () => {
  const sat = Date.parse('2026-10-10T15:00:00Z');
  const previous = { market: { fetchedAt: sat - 20 * 3600e3, quotes: { SPY: { price: 1, date: '2026-10-09' } } }, options: { at: sat - 20 * 3600e3, flagged: [] } };
  const urls = [];
  const out = await collect({ sources: [], fetchText: async (u) => { urls.push(u); return ''; }, log: quiet, now: () => sat, previous });
  assert.equal(urls.length, 0);
  assert.equal(out.market.reused, true);
});

test('market data: watchlist and movers included, refetch skipped within 30 minutes', async () => {
  const hist = 'Date,Open,High,Low,Close,Volume\n2026-10-05,1,1,1,100,1\n2026-10-06,1,1,1,102,1\n';
  let calls = 0;
  const fetchText = async (u) => { if (u.includes('stooq')) { calls++; return hist; } return ''; };
  const first = await collect({ sources: [], fetchText, log: quiet, now: () => NOW });
  assert.ok(calls >= 30);
  assert.equal(first.market.quotes.NVDA.price, 102);
  assert.ok(first.watch.watchlist.some((r) => r.ticker === 'SPCX'));
  assert.ok(first.watch.movers.up.length > 0);
  calls = 0;
  const again = await collect({ sources: [], fetchText, log: quiet, now: () => NOW + 10 * 60e3, previous: first });
  assert.equal(calls, 0);
  assert.equal(again.market.quotes.NVDA.price, 102);
  calls = 0;
  await collect({ sources: [], fetchText, log: quiet, now: () => NOW + 40 * 60e3, previous: first });
  assert.ok(calls >= 30);
});

test('options sweep runs on schedule and is reused in between', async () => {
  const { readFileSync } = await import('node:fs');
  const chain = readFileSync(new URL('./fixtures/cboe-tsla.json', import.meta.url), 'utf8');
  const open = Date.parse('2026-10-06T17:45:00Z'); // 1:45 PM New York
  let cboe = 0;
  const fetchText = async (u) => { if (u.includes('cboe')) { cboe++; return chain; } return ''; };
  const first = await collect({ sources: [], fetchText, log: quiet, now: () => open });
  assert.ok(cboe > 10);
  assert.ok(first.options.flagged.length > 0);
  cboe = 0;
  const again = await collect({ sources: [], fetchText, log: quiet, now: () => open + 20 * 60e3, previous: first });
  assert.equal(cboe, 0);
  assert.deepEqual(again.options, first.options);
});
