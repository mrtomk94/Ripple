import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStooqHistory, parseYahooHistory, summarize, getHistory, getMarket, isWeekendNY } from '../src/market.js';
import { fx } from './helpers.js';

test('parses Stooq daily history oldest-first', () => {
  const rows = parseStooqHistory(fx('stooq-hist.csv'));
  assert.equal(rows.length, 60);
  assert.equal(rows[0].date, '2026-07-20');
  assert.equal(rows.at(-1).close, 94.75);
  assert.deepEqual(parseStooqHistory('No data'), []);
});
test('parses Yahoo history, skipping empty bars, using New York dates', () => {
  const rows = parseYahooHistory(fx('yahoo-hist.json'));
  assert.deepEqual(rows.map((r) => r.close), [195, 198, 201.5]);
  assert.equal(rows.at(-1).date, '2026-10-05');
  assert.deepEqual(parseYahooHistory('bad'), []);
});
test('summarize: price, daily change, moving averages, trend', () => {
  const s = summarize(parseStooqHistory(fx('stooq-hist.csv')));
  assert.equal(s.price, 94.75);
  assert.equal(s.prev, 94.5);
  assert.ok(Math.abs(s.changePct - (94.75 / 94.5 - 1)) < 1e-12);
  assert.ok(Math.abs(s.ma20 - 92.375) < 1e-9);
  assert.ok(s.ma50 < s.ma20);
  assert.equal(s.trend, 'up');
});
test('summarize: downtrend, short history, and too little data', () => {
  const down = Array.from({ length: 55 }, (_, i) => ({ date: `d${i}`, close: 200 - i }));
  assert.equal(summarize(down).trend, 'down');
  const short = Array.from({ length: 25 }, (_, i) => ({ date: `d${i}`, close: i % 2 ? 10 : 12 }));
  const s = summarize(short);
  assert.equal(s.ma50, null);
  assert.ok(['up', 'down', 'mixed'].includes(s.trend));
  assert.equal(summarize([{ date: 'a', close: 1 }]), null);
});
test('getHistory: Stooq with a date range, Yahoo as backup', async () => {
  const urls = [];
  const now = () => Date.parse('2026-10-06T15:00:00Z');
  const s = await getHistory('NVDA', async (u) => { urls.push(u); if (u.includes('stooq')) return 'No data'; return fx('yahoo-hist.json'); }, now);
  assert.equal(s.price, 201.5);
  assert.match(urls[0], /stooq\.com\/q\/d\/l\/\?s=nvda\.us&i=d&d1=2026\d{4}&d2=20261006/);
  assert.match(urls[1], /query1\.finance\.yahoo\.com\/v8\/finance\/chart\/NVDA\?range=6mo&interval=1d/);
  assert.equal(await getHistory('NVDA', async () => { throw new Error('x'); }, now), null);
});
test('getMarket: each ticker once, bad symbols skipped, failures dropped', async () => {
  const seen = [];
  const out = await getMarket(['XLE', 'XLE', 'BAD', 'no way'], async (u) => { seen.push(u); if (/bad/i.test(u)) throw new Error('x'); return fx('stooq-hist.csv'); });
  assert.deepEqual(Object.keys(out), ['XLE']);
  assert.equal(seen.filter((u) => u.includes('xle')).length, 1);
  assert.ok(!seen.some((u) => u.includes('no way')));
});
test('weekend check uses New York time', () => {
  assert.equal(isWeekendNY(Date.parse('2026-10-10T15:00:00Z')), true);  // Saturday
  assert.equal(isWeekendNY(Date.parse('2026-10-06T15:00:00Z')), false); // Tuesday
  assert.equal(isWeekendNY(Date.parse('2026-10-10T02:00:00Z')), false); // Friday night in NY
});
