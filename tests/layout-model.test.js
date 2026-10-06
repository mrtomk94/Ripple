import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PANELS, DEFAULT_LAYOUT, normalize, moveTo, moveBy, setWidth, toggleHidden, serialize } from '../public/layout-model.js';

test('default layout lists every panel once', () => {
  assert.deepEqual([...DEFAULT_LAYOUT.order].sort(), [...PANELS].sort());
  for (const p of PANELS) assert.ok(['half', 'full'].includes(DEFAULT_LAYOUT.width[p]), p);
});
test('normalize keeps known panels, drops unknown, adds missing at the end', () => {
  const l = normalize({ order: ['board', 'nope', 'map', 'board'], width: { map: 'full', board: 'weird' }, hidden: ['dash', 'ghost'] });
  assert.equal(l.order[0], 'board');
  assert.equal(l.order[1], 'map');
  assert.equal(l.order.length, PANELS.length);
  assert.equal(new Set(l.order).size, PANELS.length);
  assert.equal(l.width.map, 'full');
  assert.equal(l.width.board, DEFAULT_LAYOUT.width.board);
  assert.deepEqual(l.hidden, ['dash']);
});
test('normalize survives junk', () => {
  for (const junk of [null, 'x', 42, { order: 'no' }, { order: [1, 2] }]) assert.deepEqual(normalize(junk).order, DEFAULT_LAYOUT.order);
});
test('normalize never hides every panel', () => {
  assert.ok(normalize({ hidden: [...PANELS] }).hidden.length < PANELS.length);
});
test('moveTo and moveBy reorder without losing panels', () => {
  const start = normalize(DEFAULT_LAYOUT);
  const a = moveTo(start, 'board', 0);
  assert.equal(a.order[0], 'board');
  assert.equal(a.order.length, PANELS.length);
  const b = moveBy(a, 'board', 1);
  assert.equal(b.order[1], 'board');
  assert.deepEqual(moveBy(a, 'board', -1).order, a.order); // already first
  assert.equal(moveTo(start, 'ghost', 0), start);
  assert.notEqual(a, start); // returns a new layout
});
test('width and hide toggles', () => {
  const l = normalize(DEFAULT_LAYOUT);
  assert.equal(setWidth(l, 'map', 'full').width.map, 'full');
  assert.equal(setWidth(l, 'map', 'giant').width.map, l.width.map);
  const h = toggleHidden(l, 'dash');
  assert.ok(h.hidden.includes('dash'));
  assert.ok(!toggleHidden(h, 'dash').hidden.includes('dash'));
});
test('serialize round-trips through normalize', () => {
  const l = setWidth(moveTo(normalize(DEFAULT_LAYOUT), 'voices', 0), 'voices', 'full');
  assert.deepEqual(normalize(JSON.parse(serialize(l))), l);
});
