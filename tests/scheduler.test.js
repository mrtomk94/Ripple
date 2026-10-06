import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScheduler } from '../src/scheduler.js';

function fakeStore() {
  const items = new Map();
  return { saved: 0, upsert(evs) { let n = 0; for (const e of evs) { if (!items.has(e.id)) n++; items.set(e.id, e); } return n; }, prune() {}, async save() { this.saved++; }, list() { return [...items.values()]; } };
}
const okSource = { name: 'ok', intervalMin: 15, feeds: [{ url: 'https://ok/feed', label: 'OK' }], parse: (text, feed) => [{ id: text + feed.label }] };
const badSource = { name: 'bad', intervalMin: 15, feeds: [{ url: 'https://bad/feed' }], parse: () => [] };
const noop = { info() {}, error() {} };

test('runs a source: fetch, parse, store, save', async () => {
  const store = fakeStore();
  const s = createScheduler({ sources: [okSource], store, log: noop, fetchText: async () => 'x', now: () => 1000 });
  await s.runSource(okSource);
  assert.equal(store.list().length, 1);
  assert.equal(store.saved, 1);
  assert.equal(s.status().ok.lastOk, 1000);
  assert.equal(s.status().ok.added, 1);
});
test('a failing source is recorded and does not throw', async () => {
  const store = fakeStore();
  const s = createScheduler({ sources: [badSource], store, log: noop, fetchText: async () => { throw new Error('down'); }, now: () => 5 });
  await s.runSource(badSource);
  assert.equal(s.status().bad.lastError, 'down');
  assert.equal(s.status().bad.lastErrorAt, 5);
});
test('one feed failing does not stop other feeds of the same source', async () => {
  const two = { ...okSource, name: 'two', feeds: [{ url: 'https://bad/1', label: 'A' }, { url: 'https://ok/2', label: 'B' }] };
  const store = fakeStore();
  const s = createScheduler({ sources: [two], store, log: noop, fetchText: async (u) => { if (u.includes('bad')) throw new Error('x'); return 'y'; }, now: () => 1 });
  await s.runSource(two);
  assert.equal(store.list().length, 1);
  assert.equal(s.status().two.lastError, 'x');
});
test('a parser crash is caught', async () => {
  const crash = { ...okSource, name: 'crash', parse: () => { throw new Error('boom'); } };
  const s = createScheduler({ sources: [crash], store: fakeStore(), log: noop, fetchText: async () => 'x', now: () => 1 });
  await s.runSource(crash);
  assert.equal(s.status().crash.lastError, 'boom');
});
test('start runs every source now and schedules each at its interval', async () => {
  const calls = [];
  const timers = [];
  const s = createScheduler({ sources: [okSource, { ...okSource, name: 'slow', intervalMin: 60 }], store: fakeStore(), log: noop,
    fetchText: async (u) => { calls.push(u); return 'x'; }, now: () => 1,
    setIntervalFn: (fn, ms) => { timers.push(ms); return timers.length; }, clearIntervalFn: () => {} });
  await s.start();
  assert.equal(calls.length, 2);
  assert.deepEqual(timers.sort((a, b) => a - b), [15 * 60e3, 60 * 60e3]);
  s.stop();
});
