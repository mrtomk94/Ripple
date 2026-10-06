import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import official, { buildFeeds } from '../src/sources/official.js';
import { addPredictions } from '../src/predictions.js';
import { fx } from './helpers.js';

const NOW = Date.parse('2026-10-06T12:00:00Z');

// Fix 1
test('posts from the unofficial archive are marked unofficial', () => {
  const feed = buildFeeds({}).find((f) => f.kind === 'truth');
  const ev = official.parse(fx('trumpstruth.xml'), feed);
  assert.ok(ev.length > 0 && ev.every((e) => e.unofficial === true));
  const ucsb = official.parse(fx('ucsb-truth.xml'), buildFeeds({}).find((f) => f.kind === 'ucsb'));
  assert.equal(ucsb[0].unofficial, undefined);
});
test('unofficial events never become scored predictions', () => {
  const base = { title: 't', date: new Date(NOW - 3600e3).toISOString(), sev: 4, sectors: [{ s: 'Energy', d: 1 }] };
  const preds = addPredictions([], [{ ...base, id: 'u', unofficial: true }, { ...base, id: 'o' }], () => NOW);
  assert.deepEqual(preds.map((p) => p.eventId), ['o']);
});

// Fix 2
test('options panel forces numbers before putting them on the page', () => {
  const js = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const fn = js.slice(js.indexOf('function drawOptions'), js.indexOf('function render()'));
  for (const raw of ['${o.strike}', '${o.dte}', '${o.ratio}', 'o.volume.toLocaleString']) assert.ok(!fn.includes(raw), `raw ${raw} still in drawOptions`);
});

// Fix 3
test('every GitHub Action is pinned to a full commit SHA', () => {
  const yml = readFileSync(new URL('../.github/workflows/collect.yml', import.meta.url), 'utf8');
  const uses = [...yml.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
  assert.ok(uses.length >= 5);
  for (const u of uses) assert.match(u, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, u);
});
