import { test } from 'node:test';
import assert from 'node:assert/strict';
import usgs from '../src/sources/usgs.js';
import nhc from '../src/sources/nhc.js';
import gdacs from '../src/sources/gdacs.js';
import eonet from '../src/sources/eonet.js';
import centralbanks from '../src/sources/centralbanks.js';
import news from '../src/sources/news.js';
import sources from '../src/sources/index.js';
import { fx, assertEventShape } from './helpers.js';

test('USGS keeps M6+ only and scores Taiwan quake higher', () => {
  const ev = usgs.parse(fx('usgs.geojson'));
  assert.equal(ev.length, 2);
  ev.forEach((e) => assertEventShape(assert, e));
  const tw = ev.find((e) => e.title.includes('Taiwan'));
  const ocean = ev.find((e) => e.title.includes('Sandwich'));
  assert.ok(tw.sev > ocean.sev);
  assert.ok(tw.sectors.some((s) => s.s === 'Semiconductors' && s.d === -1));
  assert.equal(tw.cat, 'weather');
});
test('USGS tolerates bad JSON', () => {
  assert.deepEqual(usgs.parse('{oops'), []);
});
test('NHC turns cyclone summaries into events, skips outlooks', () => {
  const ev = nhc.parse(fx('nhc-ep.xml'));
  assert.equal(ev.length, 1);
  assertEventShape(assert, ev[0]);
  assert.equal(ev[0].sev, 4);
  assert.equal(ev[0].lat, 19.1);
  assert.match(ev[0].title, /Hurricane Polo/);
});
test('NHC Gulf of Mexico storm touches energy', () => {
  const [e] = nhc.parse(fx('nhc-at.xml'));
  assert.equal(e.sev, 2);
  assert.ok(e.sectors.some((s) => s.s === 'Energy'));
});
test('GDACS keeps Orange and Red alerts only', () => {
  const ev = gdacs.parse(fx('gdacs.xml'));
  assert.equal(ev.length, 2);
  ev.forEach((e) => assertEventShape(assert, e));
  assert.equal(ev[0].sev, 5);
  assert.equal(ev[1].sev, 3);
  assert.ok(ev[1].sectors.some((s) => s.s === 'Agriculture'));
});
test('EONET keeps volcanoes and severe storms, uses latest position', () => {
  const ev = eonet.parse(fx('eonet.json'));
  assert.equal(ev.length, 2);
  ev.forEach((e) => assertEventShape(assert, e));
  const storm = ev.find((e) => e.title.includes('Kong-rey'));
  assert.equal(storm.lat, 20);
  assert.equal(storm.lng, 125);
});
test('EONET tolerates bad JSON', () => { assert.deepEqual(eonet.parse('nope'), []); });
test('central banks keep policy decisions only', () => {
  const fed = centralbanks.parse(fx('fed.xml'), { label: 'Federal Reserve' });
  const ecb = centralbanks.parse(fx('ecb.xml'), { label: 'ECB' });
  assert.equal(fed.length, 1);
  assert.equal(ecb.length, 1);
  [...fed, ...ecb].forEach((e) => assertEventShape(assert, e));
  assert.equal(fed[0].cat, 'markets');
  assert.ok(fed[0].sev >= 4);
});
test('news keeps market-relevant headlines and never stores descriptions', () => {
  const ev = news.parse(fx('bbc.xml'), { label: 'BBC World' });
  assert.equal(ev.length, 3);
  ev.forEach((e) => assertEventShape(assert, e));
  assert.ok(!JSON.stringify(ev).includes('must not be stored'));
  assert.match(ev[0].src, /BBC World/);
});
test('event ids are stable across parses', () => {
  const a = news.parse(fx('bbc.xml'), { label: 'BBC World' });
  const b = news.parse(fx('bbc.xml'), { label: 'BBC World' });
  assert.deepEqual(a.map((e) => e.id), b.map((e) => e.id));
});
test('news pulls from several trusted outlets', () => {
  const outlets = new Set(news.feeds.map((f) => f.outlet));
  for (const o of ['BBC', 'NPR', 'The Guardian', 'Al Jazeera', 'CNBC', 'DW']) assert.ok(outlets.has(o), o);
  assert.ok(news.feeds.every((f) => f.label && f.outlet));
});
test('news events record their outlet', () => {
  const [e] = news.parse(fx('bbc.xml'), { label: 'BBC World', outlet: 'BBC' });
  assert.equal(e.outlet, 'BBC');
});
test('source registry lists every source with https feeds', () => {
  assert.equal(sources.length, 6);
  for (const s of sources) {
    assert.ok(s.name && s.intervalMin > 0 && typeof s.parse === 'function');
    assert.ok(s.feeds.length > 0 && s.feeds.every((f) => f.url.startsWith('https://')));
  }
});
