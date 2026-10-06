import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOcc, parseChain, flagUnusual, sweepOptions, shouldSweep, isMarketOpenNY, RULES, OPTION_UNIVERSE } from '../src/options.js';
import { fx } from './helpers.js';

const NOW = Date.parse('2026-10-06T19:45:00Z'); // Tue 3:45 PM New York

test('parses OCC contract codes', () => {
  assert.deepEqual(parseOcc('TSLA261016C00250000'), { root: 'TSLA', expiry: '2026-10-16', type: 'call', strike: 250 });
  assert.deepEqual(parseOcc('BRK.B270115P00412500'), { root: 'BRK.B', expiry: '2027-01-15', type: 'put', strike: 412.5 });
  assert.equal(parseOcc('junk'), null);
});
test('parses a Cboe chain and skips junk rows', () => {
  const c = parseChain(fx('cboe-tsla.json'));
  assert.equal(c.symbol, 'TSLA');
  assert.equal(c.price, 250.5);
  assert.equal(c.contracts.length, 7);
  assert.equal(parseChain('nope'), null);
});
test('flags only big, new, near-term trades and ranks by premium', () => {
  const flagged = flagUnusual(parseChain(fx('cboe-tsla.json')), NOW);
  // C260: 9000 vol, 7.5x OI, $4.5M -> yes. P230: 4000 vol, 8x, $1.24M -> yes.
  // C300: $440k premium -> no. C250: vol < 2x OI -> no. 2027 expiry -> too far.
  // P240 9-Oct: 900 contracts -> too few. C270: no last trade -> uses mid 6.2 -> $1.86M, 10x -> yes.
  assert.deepEqual(flagged.map((f) => f.contract), ['TSLA261016C00260000', 'TSLA261023C00270000', 'TSLA261016P00230000']);
  const top = flagged[0];
  assert.equal(top.ticker, 'TSLA');
  assert.equal(top.type, 'call');
  assert.equal(top.premium, 9000 * 5.0 * 100);
  assert.equal(top.ratio, 7.5);
  assert.equal(top.dte, 10);
  assert.ok(Math.abs(top.moneyness - (260 / 250.5 - 1)) < 1e-9);
});
test('threshold edges are inclusive', () => {
  const chain = { symbol: 'X', price: 100, contracts: [{ code: 'X261016C00100000', root: 'X', expiry: '2026-10-16', type: 'call', strike: 100, volume: RULES.minVolume, oi: RULES.minVolume / 2 - 1, price: RULES.minPremium / RULES.minVolume / 100 }] };
  assert.equal(flagUnusual(chain, NOW).length, 1);
  chain.contracts[0].volume -= 1;
  assert.equal(flagUnusual(chain, NOW).length, 0);
});
test('sweep scans tickers, isolates failures, keeps the top 20', async () => {
  const seen = [];
  const out = await sweepOptions(['TSLA', 'BAD', 'TSLA'], async (u, opts) => {
    seen.push([u, opts]);
    if (u.includes('BAD')) throw new Error('x');
    return fx('cboe-tsla.json');
  }, () => NOW);
  assert.equal(out.scanned, 1);
  assert.equal(out.failed, 1);
  assert.equal(out.flagged.length, 3);
  assert.equal(out.at, NOW);
  assert.match(seen[0][0], /^https:\/\/cdn\.cboe\.com\/api\/global\/delayed_quotes\/options\/TSLA\.json$/);
  assert.ok(seen[0][1].maxBytes >= 30_000_000);
});
test('universe skips SPY and QQQ but includes the watchlist stocks', () => {
  assert.ok(!OPTION_UNIVERSE.includes('SPY') && !OPTION_UNIVERSE.includes('QQQ'));
  for (const t of ['TSLA', 'NVDA', 'META', 'SPCX']) assert.ok(OPTION_UNIVERSE.includes(t), t);
});
test('market hours in New York', () => {
  assert.equal(isMarketOpenNY(NOW), true);
  assert.equal(isMarketOpenNY(Date.parse('2026-10-06T13:00:00Z')), false); // 9:00 AM
  assert.equal(isMarketOpenNY(Date.parse('2026-10-10T16:00:00Z')), false); // Saturday
});
test('sweep schedule: hourly while open, once after the close, never twice on weekends', () => {
  const H = 3600e3;
  assert.equal(shouldSweep(null, NOW), true);
  assert.equal(shouldSweep({ at: NOW - 30 * 60e3 }, NOW), false);
  assert.equal(shouldSweep({ at: NOW - 56 * 60e3 }, NOW), true);
  const after = Date.parse('2026-10-06T20:40:00Z'); // 4:40 PM
  assert.equal(shouldSweep({ at: NOW }, after), true);           // last sweep before close
  assert.equal(shouldSweep({ at: after }, after + H), false);    // already did the after-close sweep
  const sat = Date.parse('2026-10-10T16:00:00Z');
  assert.equal(shouldSweep({ at: after }, sat), false);
});
