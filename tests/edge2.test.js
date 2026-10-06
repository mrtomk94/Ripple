import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseChain, flagUnusual, sweepOptions, shouldSweep } from '../src/options.js';
import official, { buildFeeds } from '../src/sources/official.js';

const NOW = Date.parse('2026-10-06T17:45:00Z');

test('chain: index symbols lose the underscore, missing prices fall back to zero', () => {
  const c = parseChain(JSON.stringify({ data: { symbol: '_SPX', current_price: 0, options: [{ option: 'SPX261016C05000000', bid: 0, ask: 0, last_trade_price: 0 }] } }));
  assert.equal(c.symbol, 'SPX');
  assert.equal(c.price, null);
  assert.equal(c.contracts[0].price, 0);
  assert.equal(c.contracts[0].volume, 0);
  assert.equal(parseChain('{"data":{}}'), null);
});
test('flagUnusual handles no chain and no underlying price', () => {
  assert.deepEqual(flagUnusual(null, NOW), []);
  const chain = { symbol: 'X', price: null, contracts: [{ code: 'X261016P00010000', expiry: '2026-10-16', type: 'put', strike: 10, volume: 5000, oi: 0, price: 5 }] };
  const [f] = flagUnusual(chain, NOW);
  assert.equal(f.ratio, null); // all new contracts
  assert.equal(f.moneyness, null);
});
test('expired contracts are skipped', () => {
  const chain = { symbol: 'X', price: 10, contracts: [{ code: 'X261001C00010000', expiry: '2026-10-01', type: 'call', strike: 10, volume: 5000, oi: 0, price: 5 }] };
  assert.equal(flagUnusual(chain, NOW).length, 0);
});
test('sweep counts an unreadable chain as failed', async () => {
  const out = await sweepOptions(['A'], async () => 'not json', () => NOW);
  assert.equal(out.failed, 1);
  assert.equal(out.scanned, 0);
  assert.deepEqual(out.flagged, []);
});
test('no sweep before the open on a weekday when one already ran', () => {
  const premarket = Date.parse('2026-10-07T12:00:00Z'); // 8:00 AM Wednesday
  assert.equal(shouldSweep({ at: Date.parse('2026-10-06T20:30:00Z') }, premarket), false);
  assert.equal(shouldSweep({ at: 'x' }, premarket), true);
});
test('SEC feeds need a real-looking email', () => {
  assert.ok(!buildFeeds({ SEC_CONTACT_EMAIL: 'not-an-email' }).some((f) => f.kind === 'sec'));
  assert.ok(!buildFeeds({ SEC_CONTACT_EMAIL: '   ' }).some((f) => f.kind === 'sec'));
});
test('official parsers cope with missing parts', () => {
  const feeds = buildFeeds({ SEC_CONTACT_EMAIL: 'me@example.com' });
  const f = (k) => feeds.find((x) => x.kind === k);
  const [fr] = official.parse(JSON.stringify({ results: [{ title: 'Some Notice', html_url: 'https://fr/x', publication_date: '2026-10-01' }] }), f('fedreg'));
  assert.match(fr.title, /^Presidential document: Some Notice/);
  assert.deepEqual(official.parse(JSON.stringify({ results: 'x' }), f('fedreg')), []);
  const [sec] = official.parse('<feed><entry><title>8-K</title><link href="https://sec/x"/><updated>2026-10-01T00:00:00Z</updated></entry></feed>', f('sec'));
  assert.match(sec.title, /Current report$/);
  const [t] = official.parse('<rss><item><title>Short post title</title><link>https://t/1</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item></rss>', f('truth'));
  assert.equal(t.title, 'Short post title');
  assert.deepEqual(official.parse('<rss></rss>', { kind: 'unknown' }), []);
  assert.deepEqual(official.parse('<rss></rss>'), []);
});
test('very long posts without spaces are still cut to 160 characters', () => {
  const f = buildFeeds({}).find((x) => x.kind === 'truth');
  const [t] = official.parse(`<rss><item><title>x</title><link>https://t/2</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate><description>${'A'.repeat(400)}</description></item></rss>`, f);
  assert.ok(t.title.length <= 160);
  assert.ok(t.title.endsWith('…'));
});
