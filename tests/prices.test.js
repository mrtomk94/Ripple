import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStooq, parseYahoo, getQuote, getQuotes } from '../src/prices.js';
import { fx } from './helpers.js';

test('parses a Stooq quote', () => {
  assert.deepEqual(parseStooq(fx('stooq-xle.csv')), { price: 93.12, date: '2026-10-05' });
});
test('Stooq "no data" and junk give null', () => {
  assert.equal(parseStooq(fx('stooq-nd.csv')), null);
  assert.equal(parseStooq('<html>blocked</html>'), null);
});
test('parses a Yahoo quote with the exchange-local trading date', () => {
  assert.deepEqual(parseYahoo(fx('yahoo-xle.json')), { price: 93.15, date: '2026-10-05' });
  assert.equal(parseYahoo('{"chart":{"result":null}}'), null);
  assert.equal(parseYahoo('nope'), null);
});
test('falls back to Yahoo when Stooq fails', async () => {
  const urls = [];
  const q = await getQuote('XLE', async (u) => { urls.push(u); if (u.includes('stooq')) throw new Error('403'); return fx('yahoo-xle.json'); });
  assert.equal(q.price, 93.15);
  assert.match(urls[0], /stooq\.com.*xle\.us/);
  assert.match(urls[1], /query1\.finance\.yahoo\.com.*XLE/);
});
test('returns null when every provider fails', async () => {
  assert.equal(await getQuote('XLE', async () => { throw new Error('down'); }), null);
});
test('getQuotes fetches each ticker once and skips failures', async () => {
  const seen = [];
  const out = await getQuotes(['XLE', 'XLE', 'BAD'], async (u) => { seen.push(u); if (u.includes('bad')|| u.includes('BAD')) throw new Error('x'); return fx('stooq-xle.csv'); });
  assert.deepEqual(Object.keys(out), ['XLE']);
  assert.equal(seen.filter((u) => u.includes('xle')).length, 1);
});
