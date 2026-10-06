import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corroborate, headlineTokens } from '../src/corroborate.js';

const T = Date.parse('2026-10-06T12:00:00Z');
const OUTLET = { 'BBC World': 'BBC', 'BBC Business': 'BBC', 'NPR News': 'NPR', 'Al Jazeera': 'Al Jazeera', CNBC: 'CNBC', 'The Guardian': 'The Guardian' };
const n = (id, title, src, hoursAgo = 0, extra = {}) => ({ id, title, src, outlet: OUTLET[src], link: `https://${src.replace(/\s/g, '')}.example/${id}`, date: new Date(T - hoursAgo * 3600e3).toISOString(), cat: 'energy', sev: 3, region: 'Saudi Arabia', sectors: [], ...extra });

test('headline tokens drop filler words and plural endings', () => {
  assert.deepEqual([...headlineTokens('Oil prices jump after the drone attacks on Saudi refinery')].sort(),
    ['attack', 'drone', 'jump', 'oil', 'price', 'refinery', 'saudi'].sort());
});
test('same story from three outlets becomes one item with three sources', () => {
  const out = corroborate([
    n('a', 'Oil prices jump after drone attack on Saudi refinery', 'BBC World', 3),
    n('b', 'Oil surges as drones hit Saudi refinery', 'NPR News', 2),
    n('c', 'Drone attack on Saudi oil refinery sends prices higher', 'Al Jazeera', 1),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'a');
  assert.deepEqual(out[0].sources.map((s) => s.src), ['BBC World', 'NPR News', 'Al Jazeera']);
  assert.ok(out[0].sources.every((s) => s.link.startsWith('https://')));
});
test('different stories stay separate', () => {
  const out = corroborate([
    n('a', 'Oil prices jump after drone attack on Saudi refinery', 'BBC World'),
    n('b', 'Nvidia shares surge on record AI chip demand', 'CNBC', 0, { cat: 'tech', region: null }),
  ]);
  assert.equal(out.length, 2);
});
test('same outlet twice is not counted as confirmation', () => {
  const out = corroborate([
    n('a', 'Oil prices jump after drone attack on Saudi refinery', 'BBC World', 2),
    n('b', 'Oil prices jump after drone attack hits Saudi refinery', 'BBC Business', 1),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].sources.length, 1); // both BBC: one outlet
});
test('stories far apart in time, category, or place are not merged', () => {
  assert.equal(corroborate([n('a', 'Oil prices jump after drone attack on Saudi refinery', 'BBC World', 50), n('b', 'Oil prices jump after drone attack on Saudi refinery', 'NPR News', 0)]).length, 2);
  assert.equal(corroborate([n('a', 'Oil prices jump after drone attack on refinery', 'BBC World'), n('b', 'Oil prices jump after drone attack on refinery', 'NPR News', 0, { cat: 'war' })]).length, 2);
  assert.equal(corroborate([n('a', 'Oil prices jump after drone attack on refinery', 'BBC World'), n('b', 'Oil prices jump after drone attack on refinery', 'NPR News', 0, { region: 'Russia' })]).length, 2);
});
test('opposite moves on the same topic are not merged', () => {
  assert.equal(corroborate([
    n('a', 'Oil prices jump as Saudi output falls', 'BBC World'),
    n('b', 'Oil prices fall as Saudi output rises', 'NPR News'),
  ]).length, 2);
});
test('non-news events pass through untouched, and earlier merges are kept', () => {
  const quake = { id: 'q', title: 'M 7.1 - Taiwan', src: 'USGS Earthquake Hazards Program', link: 'https://usgs', date: new Date(T).toISOString(), cat: 'weather', sev: 4, sectors: [] };
  const merged = { ...n('a', 'Oil prices jump after drone attack on Saudi refinery', 'BBC World'), sources: [{ src: 'BBC World', outlet: 'BBC', link: 'https://bbc/a' }, { src: 'NPR News', outlet: 'NPR', link: 'https://npr/b' }] };
  const out = corroborate([quake, merged, n('c', 'Saudi refinery drone attack sends oil prices jumping', 'The Guardian', 0)]);
  assert.equal(out.length, 2);
  const oil = out.find((e) => e.id === 'a');
  assert.deepEqual(oil.sources.map((s) => s.src), ['BBC World', 'NPR News', 'The Guardian']);
  assert.equal(out.find((e) => e.id === 'q').sources, undefined);
});
