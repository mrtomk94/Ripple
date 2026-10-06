import { test } from 'node:test';
import assert from 'node:assert/strict';
import official, { buildFeeds } from '../src/sources/official.js';
import sources from '../src/sources/index.js';
import { fx, assertEventShape } from './helpers.js';

const feed = (kind) => buildFeeds({ SEC_CONTACT_EMAIL: 'me@example.com' }).find((f) => f.kind === kind);

test('feeds: official channels always on, SEC only with a contact email', () => {
  const kinds = buildFeeds({}).map((f) => f.kind);
  for (const k of ['fedreg', 'meta', 'ucsb', 'truth']) assert.ok(kinds.includes(k), k);
  assert.ok(!kinds.includes('sec'));
  const sec = buildFeeds({ SEC_CONTACT_EMAIL: 'me@example.com' }).filter((f) => f.kind === 'sec');
  assert.deepEqual(sec.map((f) => f.ticker), ['TSLA', 'META', 'SPCX']);
  assert.match(sec[0].fetch.headers['user-agent'], /me@example\.com/);
  assert.ok(buildFeeds({}).every((f) => f.url.startsWith('https://')));
  assert.ok(!buildFeeds({}).some((f) => f.url.includes('truthsocial.com')));
});
test('registered as a source', () => {
  assert.ok(sources.includes(official));
});
test('Federal Register: presidential documents, tagged Trump and classified', () => {
  const ev = official.parse(fx('fedreg.json'), feed('fedreg'));
  assert.equal(ev.length, 2);
  ev.forEach((e) => assertEventShape(assert, e));
  assert.deepEqual(ev[0].people, ['trump']);
  assert.match(ev[0].title, /Executive Order: Imposing Tariffs/);
  assert.equal(ev[0].cat, 'markets');
  assert.ok(ev[0].sectors.some((s) => s.s === 'Shipping & freight'));
  assert.ok(ev[0].sev >= 3);
  assert.equal(official.parse('nope', feed('fedreg')).length, 0);
});
test('Meta Newsroom: tagged Zuckerberg, tech by default', () => {
  const ev = official.parse(fx('meta-newsroom.xml'), feed('meta'));
  assert.equal(ev.length, 2);
  ev.forEach((e) => assertEventShape(assert, e));
  assert.deepEqual(ev[0].people, ['zuckerberg']);
  assert.equal(ev[0].cat, 'tech');
  assert.equal(ev[1].cat, 'tech');
});
test('UCSB daily Truth Social collections: title and link only', () => {
  const [e] = official.parse(fx('ucsb-truth.xml'), feed('ucsb'));
  assertEventShape(assert, e);
  assert.deepEqual(e.people, ['trump']);
  assert.match(e.title, /Truth Social Posts of October 4, 2026/);
  assert.ok(!JSON.stringify(e).includes('should not be stored'));
  assert.match(e.src, /American Presidency Project/);
});
test('trumpstruth.org posts: short excerpt as the title, classified, marked unofficial', () => {
  const ev = official.parse(fx('trumpstruth.xml'), feed('truth'));
  assert.equal(ev.length, 2);
  ev.forEach((e) => assertEventShape(assert, e));
  const tariff = ev[0];
  assert.ok(tariff.title.length <= 160);
  assert.match(tariff.title, /^We are putting a 50% TARIFF/);
  assert.equal(tariff.cat, 'markets');
  assert.ok(tariff.sectors.some((s) => s.d === -1));
  assert.match(tariff.src, /unofficial/i);
  assert.equal(ev[1].cat, 'markets');
  assert.deepEqual(ev[1].sectors, []);
});
test('SEC 8-K filings: company named, linked people', () => {
  const [e] = official.parse(fx('sec-tsla.atom'), feed('sec'));
  assertEventShape(assert, e);
  assert.match(e.title, /^Tesla files 8-K/);
  assert.deepEqual(e.people, ['musk']);
  assert.equal(e.cat, 'markets');
});
