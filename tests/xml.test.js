import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed } from '../src/xml.js';
import { fx } from './helpers.js';

test('parses RSS items with CDATA titles and links', () => {
  const items = parseFeed(fx('bbc.xml'));
  assert.equal(items.length, 5);
  assert.equal(items[0].title, 'Oil prices jump after drone attack on Saudi refinery');
  assert.equal(items[0].link, 'https://www.bbc.co.uk/news/articles/aaa1');
  assert.equal(items[0].pubDate, 'Sun, 04 Oct 2026 09:00:00 GMT');
});
test('decodes HTML entities in titles', () => {
  const items = parseFeed(fx('bbc.xml'));
  assert.equal(items[4].title, 'Fish & chips shop wins "best in town"');
});
test('decodes &amp; in links', () => {
  const items = parseFeed(fx('gdacs.xml'));
  assert.equal(items[0].link, 'https://www.gdacs.org/report.aspx?eventtype=FL&eventid=1001');
});
test('exposes namespaced fields', () => {
  const items = parseFeed(fx('gdacs.xml'));
  assert.equal(items[0].fields['gdacs:alertlevel'], 'Red');
  assert.equal(items[0].fields['geo:lat'], '23.7');
});
test('parses Atom entries', () => {
  const items = parseFeed(fx('atom.xml'));
  assert.equal(items.length, 1);
  assert.equal(items[0].link, 'https://example.org/a1');
  assert.equal(items[0].pubDate, '2026-10-04T10:00:00Z');
});
test('returns empty list for garbage', () => {
  assert.deepEqual(parseFeed('not xml at all'), []);
  assert.deepEqual(parseFeed(''), []);
});
