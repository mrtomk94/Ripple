import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyHeadline } from '../src/classify/rules.js';

test('"trade war" is a markets story, not a war', () => {
  const r = classifyHeadline('US-China trade war escalates');
  assert.equal(r.cat, 'markets');
  assert.ok(!r.sectors.some((s) => s.s === 'Defense'));
});
test('"price war" is not a war', () => {
  assert.notEqual(classifyHeadline('Supermarket price war hits profits')?.cat, 'war');
});
test('real wars still count', () => {
  assert.equal(classifyHeadline('War in Sudan displaces millions').cat, 'war');
  assert.equal(classifyHeadline('Trade talks stall as war spreads to the border').cat, 'war');
});
test('figurative "storm" is not weather', () => {
  assert.equal(classifyHeadline('Storm over pay talks at council'), null);
  assert.equal(classifyHeadline('Political storm grows over budget'), null);
});
test('real storms still count', () => {
  for (const h of ['Tropical storm forms in the Gulf', 'Storm Ciaran batters southern England', 'Winter storm grounds flights', 'Storm surge floods coastal towns', 'Deadly storms hit Texas']) {
    assert.equal(classifyHeadline(h)?.cat, 'weather', h);
  }
});
test('"Ai Weiwei" is not AI tech, but "AI" still is', () => {
  assert.equal(classifyHeadline('Ai Weiwei opens exhibition'), null);
  assert.equal(classifyHeadline('AI startup raises record funding').cat, 'tech');
  assert.equal(classifyHeadline('Artificial intelligence rules agreed').cat, 'tech');
});
