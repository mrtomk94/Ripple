import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WATCHLIST, UNIVERSE, buildWatch } from '../src/watchlist.js';

const q = (price, changePct, trend = 'up') => ({ price, changePct, trend, ma20: 1, ma50: 1, date: '2026-10-06' });

test('watchlist has the requested names and S&P 500', () => {
  const t = WATCHLIST.map((w) => w.ticker);
  for (const x of ['SPY', 'TSLA', 'SPCX', 'META', 'GOOGL', 'NVDA', 'NFLX', 'MU']) assert.ok(t.includes(x), x);
  assert.ok(UNIVERSE.length >= 30);
  for (const x of t) assert.ok(UNIVERSE.includes(x));
});
test('builds watchlist rows with quotes and news mentions', () => {
  const events = [{ id: 'e1', title: 'Nvidia shares surge on AI chip demand' }, { id: 'e2', title: 'Tesla recalls cars' }, { id: 'e3', title: 'Musk says SpaceX will launch' }];
  const w = buildWatch({ NVDA: q(200, 0.03), TSLA: q(300, -0.02, 'down') }, events);
  const nvda = w.watchlist.find((r) => r.ticker === 'NVDA');
  assert.equal(nvda.price, 200);
  assert.deepEqual(nvda.mentions, ['e1']);
  assert.equal(w.watchlist.find((r) => r.ticker === 'SPCX').mentions[0], 'e3');
  assert.equal(w.watchlist.find((r) => r.ticker === 'META').price, undefined);
});
test('movers: biggest gainers and losers, largest first', () => {
  const m = { AAA: q(1, 0.05), BBB: q(1, 0.01), CCC: q(1, -0.04), DDD: q(1, -0.08), EEE: q(1, 0) };
  const { movers } = buildWatch(m, [], { universe: ['AAA', 'BBB', 'CCC', 'DDD', 'EEE'], top: 2 });
  assert.deepEqual(movers.up.map((r) => r.ticker), ['AAA', 'BBB']);
  assert.deepEqual(movers.down.map((r) => r.ticker), ['DDD', 'CCC']);
});
