import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collect, collectToFile } from '../src/collect.js';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const ev = (id, daysAgo) => ({ id, cat: 'markets', sev: 2, title: id, link: `https://x/${id}`, date: new Date(NOW - daysAgo * 864e5).toISOString(), sectors: [], chain: [], src: 't', lat: null, lng: null });
const quiet = { info() {}, error() {} };
const src = (name, out) => ({ name, intervalMin: 15, feeds: [{ url: `https://${name}` }], parse: () => out });

test('merges new events with the previous run and drops expired ones', async () => {
  const out = await collect({
    sources: [src('a', [ev('new', 0)])], fetchText: async () => '', log: quiet, now: () => NOW,
    previous: { events: [ev('kept', 2), ev('old', 30)] },
  });
  assert.deepEqual(out.events.map((e) => e.id), ['new', 'kept']);
  assert.equal(out.generatedAt, NOW);
});
test('reports public health without error text', async () => {
  const out = await collect({
    sources: [src('ok', []), { ...src('down', []), parse: () => { throw new Error('HTTP 404 secret'); } }],
    fetchText: async () => '', log: quiet, now: () => NOW,
  });
  assert.equal(out.sources.ok.failing, false);
  assert.equal(out.sources.down.failing, true);
  assert.ok(!JSON.stringify(out).includes('secret'));
});
test('ignores a broken previous file', async () => {
  const out = await collect({ sources: [], fetchText: async () => '', log: quiet, now: () => NOW, previous: { events: 'nope' } });
  assert.deepEqual(out.events, []);
});
test('collectToFile reads the old file and writes the new one', async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'c-')), 'events.json');
  writeFileSync(file, JSON.stringify({ events: [ev('kept', 1)] }));
  await collectToFile(file, { sources: [src('a', [ev('new', 0)])], fetchText: async () => '', log: quiet, now: () => NOW });
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(saved.events.length, 2);
});
test('collectToFile starts fresh when the old file is missing or corrupt', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'c-'));
  const bad = join(dir, 'bad.json');
  writeFileSync(bad, '<html>404</html>');
  await collectToFile(bad, { sources: [], fetchText: async () => '', log: quiet, now: () => NOW });
  assert.deepEqual(JSON.parse(readFileSync(bad, 'utf8')).events, []);
  const missing = join(dir, 'missing.json');
  await collectToFile(missing, { sources: [], fetchText: async () => '', log: quiet, now: () => NOW });
  assert.deepEqual(JSON.parse(readFileSync(missing, 'utf8')).events, []);
});
