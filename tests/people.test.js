import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE, peopleIn } from '../src/people.js';
import news from '../src/sources/news.js';

test('tracks Musk, Trump and Zuckerberg with linked tickers', () => {
  const ids = PEOPLE.map((p) => p.id);
  assert.deepEqual(ids, ['musk', 'trump', 'zuckerberg']);
  assert.deepEqual(PEOPLE.find((p) => p.id === 'musk').tickers, ['TSLA', 'SPCX']);
  assert.deepEqual(PEOPLE.find((p) => p.id === 'zuckerberg').tickers, ['META']);
});
test('matches names and common forms', () => {
  assert.deepEqual(peopleIn('Elon Musk says Starship will fly'), ['musk']);
  assert.deepEqual(peopleIn('Musk and Zuckerberg trade barbs'), ['musk', 'zuckerberg']);
  assert.deepEqual(peopleIn('President Trump signs order'), ['trump']);
  assert.deepEqual(peopleIn("Trump's tariff threat rattles markets"), ['trump']);
});
test('no false matches', () => {
  assert.deepEqual(peopleIn('Jazz trumpet player wins award'), []);
  assert.deepEqual(peopleIn('Muskrat population rises'), []);
  assert.deepEqual(peopleIn(''), []);
});
test('news keeps headlines about tracked people even without market keywords', () => {
  const xml = '<rss><item><title>Musk says he will visit Mars base</title><link>https://bbc/m</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item><item><title>Celebrity chef opens restaurant</title><link>https://bbc/c</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item></rss>';
  const ev = news.parse(xml, { label: 'BBC World', outlet: 'BBC' });
  assert.equal(ev.length, 1);
  assert.deepEqual(ev[0].people, ['musk']);
  assert.deepEqual(ev[0].sectors, []);
});
test('classified headlines also carry people', () => {
  const xml = '<rss><item><title>Trump announces new tariffs on Chinese imports</title><link>https://bbc/t</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item></rss>';
  const [e] = news.parse(xml, { label: 'BBC World', outlet: 'BBC' });
  assert.equal(e.cat, 'markets');
  assert.deepEqual(e.people, ['trump']);
});
