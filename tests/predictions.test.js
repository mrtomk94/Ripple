import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addPredictions, updatePredictions, scorecard, neededTickers, BENCHMARK } from '../src/predictions.js';

const H = 3600e3;
const NOW = Date.parse('2026-10-05T15:00:00Z');
const event = (id, hoursAgo, sectors) => ({ id, title: `Event ${id}`, date: new Date(NOW - hoursAgo * H).toISOString(), sectors });
const q = (price, date) => ({ price, date });

test('adds one prediction per up/down sector with a fund, skips mixed and old events', () => {
  const preds = addPredictions([], [
    event('a', 1, [{ s: 'Energy', d: 1 }, { s: 'Travel & airlines', d: -1 }, { s: 'Insurance', d: 0 }]),
    event('old', 48, [{ s: 'Energy', d: 1 }]),
    event('b', 1, [{ s: 'Not a sector', d: 1 }]),
  ], () => NOW);
  assert.deepEqual(preds.map((p) => [p.ticker, p.d]), [['XLE', 1], ['JETS', -1]]);
  assert.equal(preds[0].status, 'pending');
});
test('does not duplicate predictions on later runs', () => {
  const ev = [event('a', 1, [{ s: 'Energy', d: 1 }])];
  const once = addPredictions([], ev, () => NOW);
  assert.equal(addPredictions(once, ev, () => NOW + H).length, 1);
});
test('needed tickers: pending funds plus the market benchmark', () => {
  const preds = addPredictions([], [event('a', 1, [{ s: 'Energy', d: 1 }])], () => NOW);
  assert.deepEqual(neededTickers(preds).sort(), [BENCHMARK, 'XLE'].sort());
  assert.deepEqual(neededTickers([]), []);
});

function lifecycle(d, xleEnd, spyEnd) {
  let preds = addPredictions([], [event('a', 1, [{ s: 'Energy', d }])], () => NOW);
  preds = updatePredictions(preds, { XLE: q(100, '2026-10-05'), SPY: q(500, '2026-10-05') }, () => NOW);
  return updatePredictions(preds, { XLE: q(xleEnd, '2026-10-06'), SPY: q(spyEnd, '2026-10-06') }, () => NOW + 25 * H)[0];
}
test('hit: fund beat the market in the predicted direction', () => {
  const p = lifecycle(1, 102, 505); // +2% vs +1%
  assert.equal(p.status, 'hit');
  assert.ok(Math.abs(p.excess - 0.01) < 1e-9);
});
test('miss: fund rose but lagged the market', () => {
  assert.equal(lifecycle(1, 100.5, 505).status, 'miss');
});
test('down prediction hits when the fund trails the market', () => {
  assert.equal(lifecycle(-1, 99, 500).status, 'hit');
});
test('tiny differences count as flat, not scored', () => {
  assert.equal(lifecycle(1, 101.02, 505).status, 'flat');
});
test('waits for the next trading day even after 24 hours (weekend)', () => {
  let preds = addPredictions([], [event('a', 1, [{ s: 'Energy', d: 1 }])], () => NOW);
  preds = updatePredictions(preds, { XLE: q(100, '2026-10-02'), SPY: q(500, '2026-10-02') }, () => NOW);
  preds = updatePredictions(preds, { XLE: q(100, '2026-10-02'), SPY: q(500, '2026-10-02') }, () => NOW + 30 * H);
  assert.equal(preds[0].status, 'pending');
});
test('waits at least 20 hours even if the date changed', () => {
  let preds = addPredictions([], [event('a', 1, [{ s: 'Energy', d: 1 }])], () => NOW);
  preds = updatePredictions(preds, { XLE: q(100, '2026-10-05'), SPY: q(500, '2026-10-05') }, () => NOW);
  preds = updatePredictions(preds, { XLE: q(110, '2026-10-06'), SPY: q(500, '2026-10-06') }, () => NOW + 5 * H);
  assert.equal(preds[0].status, 'pending');
});
test('missing quotes leave predictions pending; stale never-started ones expire', () => {
  let preds = addPredictions([], [event('a', 1, [{ s: 'Energy', d: 1 }])], () => NOW);
  preds = updatePredictions(preds, {}, () => NOW);
  assert.equal(preds[0].start, null);
  preds = updatePredictions(preds, {}, () => NOW + 5 * 24 * H);
  assert.equal(preds[0].status, 'expired');
});
test('resolved predictions are dropped 90 days after scoring', () => {
  const p = lifecycle(1, 102, 505);
  assert.equal(updatePredictions([p], {}, () => NOW + 92 * 24 * H).length, 0);
});
test('scorecard: hit rate overall and by sector, flat and pending excluded', () => {
  const mk = (sector, status, i) => ({ id: `${i}`, sector, ticker: 'X', status, resolvedAt: NOW + i, title: 't', d: 1, excess: 0.01 });
  const card = scorecard([mk('Energy', 'hit', 1), mk('Energy', 'miss', 2), mk('Energy', 'hit', 3), mk('Defense', 'miss', 4), mk('Defense', 'flat', 5), mk('Defense', 'pending', 6)]);
  assert.equal(card.scored, 4);
  assert.equal(card.hits, 2);
  assert.equal(card.hitRate, 0.5);
  assert.equal(card.pending, 1);
  assert.deepEqual(card.bySector.Energy, { hits: 2, scored: 3 });
  assert.equal(card.recent[0].id, '5'); // newest resolved first, includes flat
  assert.equal(scorecard([]).hitRate, null);
});
test('resolved predictions are kept before 90 days', () => {
  const p = lifecycle(1, 102, 505);
  assert.equal(updatePredictions([p], {}, () => NOW + 60 * 24 * H).length, 1);
});
