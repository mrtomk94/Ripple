import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HISTORY_TICKERS, getWeekly, compact, shouldRefresh, buildHistory, collectHistoryToFile, pagesUrl } from '../src/history.js';

const NOW = Date.parse('2026-10-06T20:00:00Z');
const H = 3600e3;
const weeks = (n, start = 100) => ['Date,Open,High,Low,Close,Volume', ...Array.from({ length: n }, (_, i) => {
  const d = new Date(Date.UTC(2021, 9, 4) + i * 7 * 864e5).toISOString().slice(0, 10);
  return `${d},1,1,1,${(start + i * 0.333).toFixed(4)},1`;
})].join('\n');

test('tracks the watchlist, movers universe, sector funds and SPY', () => {
  for (const t of ['NVDA', 'TSLA', 'SPCX', 'META', 'SPY', 'XLE', 'KRE', 'AMD']) assert.ok(HISTORY_TICKERS.includes(t), t);
  assert.equal(new Set(HISTORY_TICKERS).size, HISTORY_TICKERS.length);
});
test('weekly history: Stooq weekly over 5 years, Yahoo weekly as backup', async () => {
  const urls = [];
  const rows = await getWeekly('NVDA', async (u) => { urls.push(u); if (u.includes('stooq')) return 'No data'; return JSON.stringify({ chart: { result: [{ timestamp: Array.from({ length: 30 }, (_, i) => 1633000000 + i * 604800), indicators: { quote: [{ close: Array.from({ length: 30 }, (_, i) => 10 + i) }] } }] } }); }, () => NOW);
  assert.equal(rows.length, 30);
  assert.match(urls[0], /stooq\.com\/q\/d\/l\/\?s=nvda\.us&i=w&d1=2021\d{4}&d2=20261006/);
  assert.match(urls[1], /chart\/NVDA\?range=5y&interval=1wk/);
});
test('newly listed stocks (like SPCX) with a few months of data still get a chart', async () => {
  assert.equal((await getWeekly('SPCX', async () => weeks(17), () => NOW)).length, 17);
});
test('too little history counts as a failure', async () => {
  assert.equal(await getWeekly('X', async () => weeks(3), () => NOW), null);
  assert.equal(await getWeekly('X', async () => { throw new Error('x'); }, () => NOW), null);
});
test('compact keeps dates and rounds prices to cents', () => {
  const c = compact([{ date: '2026-01-02', close: 10.12345 }, { date: '2026-01-09', close: 11.999 }]);
  assert.deepEqual(c, { dates: ['2026-01-02', '2026-01-09'], closes: [10.12, 12] });
});
test('refresh twice a day at most', () => {
  assert.equal(shouldRefresh(null, NOW), true);
  assert.equal(shouldRefresh({ fetchedAt: NOW - 6 * H }, NOW), false);
  assert.equal(shouldRefresh({ fetchedAt: NOW - 13 * H }, NOW), true);
  assert.equal(shouldRefresh({ fetchedAt: 'x' }, NOW), true);
});
test('build: fetches every ticker, keeps old data for failures, reuses when fresh', async () => {
  const prev = { fetchedAt: NOW - 20 * H, series: { BAD: { dates: ['2025-01-03'], closes: [5] } } };
  const out = await buildHistory({ tickers: ['NVDA', 'BAD'], previous: prev, now: () => NOW,
    fetchText: async (u) => { if (/bad/i.test(u)) throw new Error('x'); return weeks(260); } });
  assert.equal(out.fetchedAt, NOW);
  assert.equal(out.series.NVDA.closes.length, 260);
  assert.deepEqual(out.series.BAD, prev.series.BAD);
  assert.equal(out.got, 1);
  let calls = 0;
  const again = await buildHistory({ tickers: ['NVDA'], previous: out, now: () => NOW + H, fetchText: async () => { calls++; return ''; } });
  assert.equal(calls, 0);
  assert.equal(again, out);
});
test('Pages address comes from the GitHub repository name', () => {
  assert.equal(pagesUrl('mrtomk94/Ripple'), 'https://mrtomk94.github.io/Ripple/history.json');
  assert.equal(pagesUrl(''), null);
  assert.equal(pagesUrl('bad name'), null);
});
test('history file: previous copy from disk or the live site, then written next to events.json', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'h-'));
  const file = join(dir, 'history.json');
  const fetchText = async (u) => { if (u.includes('github.io')) return JSON.stringify({ fetchedAt: NOW - H, series: { OLD: { dates: ['2025-01-03'], closes: [1] } } }); return weeks(260); };
  const fromSite = await collectHistoryToFile(file, { tickers: ['NVDA'], fetchText, now: () => NOW, repo: 'mrtomk94/Ripple' });
  assert.ok(fromSite.series.OLD); // fresh copy from the live site reused
  writeFileSync(file, JSON.stringify({ fetchedAt: NOW - 30 * H, series: {} }));
  const fromDisk = await collectHistoryToFile(file, { tickers: ['NVDA'], fetchText, now: () => NOW, repo: '' });
  assert.equal(fromDisk.series.NVDA.closes.length, 260);
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).series.NVDA.closes.length, 260);
});
