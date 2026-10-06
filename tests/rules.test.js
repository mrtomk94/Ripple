import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyHeadline, findPlace, quakeSeverity, stormSeverity } from '../src/classify/rules.js';

test('quake severity grows with magnitude', () => {
  assert.equal(quakeSeverity(6.0), 2);
  assert.equal(quakeSeverity(6.6), 3);
  assert.equal(quakeSeverity(7.1), 4);
  assert.equal(quakeSeverity(8.0), 5);
});
test('storm severity follows wind speed', () => {
  assert.equal(stormSeverity(45), 1);
  assert.equal(stormSeverity(60), 2);
  assert.equal(stormSeverity(90), 3);
  assert.equal(stormSeverity(120), 4);
  assert.equal(stormSeverity(140), 5);
});
test('finds places in text', () => {
  assert.equal(findPlace('Drone attack on Saudi refinery').region, 'Saudi Arabia');
  assert.equal(findPlace('Flooding in Bangladesh').region, 'Bangladesh');
  assert.equal(findPlace('Nothing here'), null);
});
test('place matching uses whole words', () => {
  assert.equal(findPlace('Iranian talks')?.region, 'Iran');
  assert.equal(findPlace('Spaniel wins dog show'), null);
});
test('war headline: defense up, place found', () => {
  const r = classifyHeadline('Missile strikes hit Ukraine power grid');
  assert.equal(r.cat, 'war');
  assert.ok(r.sectors.some((s) => s.s === 'Defense' && s.d === 1));
  assert.equal(r.place.region, 'Ukraine');
});
test('airstrike is war, labour strike is not', () => {
  assert.equal(classifyHeadline('Airstrike on Gaza city').cat, 'war');
  assert.notEqual(classifyHeadline('Dock workers strike at port of Rotterdam')?.cat, 'war');
});
test('oil headline is energy and strong words raise severity', () => {
  const r = classifyHeadline('Oil prices jump after drone attack on Saudi refinery');
  assert.equal(r.cat, 'energy');
  assert.ok(r.sev >= 3);
  assert.ok(r.sectors.some((s) => s.s === 'Energy'));
});
test('chip headline is tech', () => {
  const r = classifyHeadline('Chipmaker shares surge as AI demand hits record');
  assert.equal(r.cat, 'tech');
  assert.ok(r.sectors.some((s) => s.s === 'Semiconductors'));
});
test('tariffs push down on shipping and discretionary', () => {
  const r = classifyHeadline('US announces new tariffs on Chinese imports');
  assert.equal(r.cat, 'markets');
  assert.ok(r.sectors.some((s) => s.s === 'Shipping & freight' && s.d === -1));
});
test('rate cut vs rate hike', () => {
  const cut = classifyHeadline('Central bank announces surprise rate cut');
  const hike = classifyHeadline('Central bank announces rate hike');
  assert.equal(cut.sectors.find((s) => s.s === 'Banks & rate-sensitive').d, 1);
  assert.equal(hike.sectors.find((s) => s.s === 'Banks & rate-sensitive').d, -1);
});
test('irrelevant headline returns null', () => {
  assert.equal(classifyHeadline('Celebrity chef opens new restaurant'), null);
  assert.equal(classifyHeadline(''), null);
});
test('every result has a chain and valid sectors', () => {
  const r = classifyHeadline('Heatwave sends power demand to record');
  assert.equal(r.cat, 'weather');
  assert.ok(r.chain.length >= 2);
  assert.ok(r.sectors.every((s) => [1, -1, 0].includes(s.d)));
});
