import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../src/store.js';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const ev = (id, daysAgo, extra = {}) => ({ id, cat: 'markets', sev: 2, title: id, link: `https://x/${id}`, date: new Date(NOW - daysAgo * 864e5).toISOString(), sectors: [], chain: [], src: 't', lat: null, lng: null, ...extra });
const dir = () => mkdtempSync(join(tmpdir(), 'ripple-'));

test('dedupes by id and reports new count', () => {
  const s = createStore({ file: join(dir(), 'e.json'), now: () => NOW });
  assert.equal(s.upsert([ev('a', 0), ev('b', 0)]), 2);
  assert.equal(s.upsert([ev('a', 0), ev('c', 0)]), 1);
  assert.equal(s.list().length, 3);
});
test('updates an existing event in place (e.g. storm moves)', () => {
  const s = createStore({ file: join(dir(), 'e.json'), now: () => NOW });
  s.upsert([ev('a', 0, { sev: 2 })]);
  s.upsert([ev('a', 0, { sev: 4 })]);
  assert.equal(s.list()[0].sev, 4);
});
test('lists newest first, filters by category, limits', () => {
  const s = createStore({ file: join(dir(), 'e.json'), now: () => NOW });
  s.upsert([ev('old', 3), ev('new', 0), ev('w', 1, { cat: 'war' })]);
  assert.deepEqual(s.list().map((e) => e.id), ['new', 'w', 'old']);
  assert.deepEqual(s.list({ cat: 'war' }).map((e) => e.id), ['w']);
  assert.equal(s.list({ limit: 1 }).length, 1);
});
test('prune drops events older than maxAgeDays', () => {
  const s = createStore({ file: join(dir(), 'e.json'), now: () => NOW, maxAgeDays: 14 });
  s.upsert([ev('fresh', 1), ev('stale', 20)]);
  s.prune();
  assert.deepEqual(s.list().map((e) => e.id), ['fresh']);
});
test('upsert ignores events already too old', () => {
  const s = createStore({ file: join(dir(), 'e.json'), now: () => NOW, maxAgeDays: 14 });
  assert.equal(s.upsert([ev('stale', 30)]), 0);
});
test('caps total size, keeping newest', () => {
  const s = createStore({ file: join(dir(), 'e.json'), now: () => NOW, maxEvents: 2 });
  s.upsert([ev('a', 3), ev('b', 2), ev('c', 1)]);
  assert.deepEqual(s.list().map((e) => e.id), ['c', 'b']);
});
test('saves and loads from disk', async () => {
  const file = join(dir(), 'e.json');
  const s = createStore({ file, now: () => NOW });
  s.upsert([ev('a', 0)]);
  await s.save();
  assert.ok(readFileSync(file, 'utf8').includes('"a"'));
  const s2 = createStore({ file, now: () => NOW });
  await s2.load();
  assert.equal(s2.list().length, 1);
});
test('load survives a missing or corrupt file', async () => {
  const d = dir();
  const s = createStore({ file: join(d, 'missing.json'), now: () => NOW });
  await s.load();
  assert.equal(s.list().length, 0);
  const bad = join(d, 'bad.json');
  writeFileSync(bad, '{corrupt');
  const s2 = createStore({ file: bad, now: () => NOW });
  await s2.load();
  assert.equal(s2.list().length, 0);
});

test('a fresh copy of a story keeps the outlets it was already confirmed by', () => {
  const s = createStore({ file: join(dir(), 'e.json'), now: () => NOW });
  s.upsert([ev('a', 0, { sources: [{ src: 'BBC World', outlet: 'BBC', link: 'https://b' }, { src: 'NPR News', outlet: 'NPR', link: 'https://n' }] })]);
  s.upsert([ev('a', 0, { sev: 4 })]);
  assert.equal(s.list()[0].sev, 4);
  assert.equal(s.list()[0].sources.length, 2);
});
