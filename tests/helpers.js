import { readFileSync } from 'node:fs';
export const fx = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
export const CATS = ['war', 'weather', 'energy', 'tech', 'markets'];
export function assertEventShape(assert, e) {
  assert.ok(e.id && typeof e.id === 'string', 'id');
  assert.ok(CATS.includes(e.cat), `cat ${e.cat}`);
  assert.ok(Number.isInteger(e.sev) && e.sev >= 1 && e.sev <= 5, `sev ${e.sev}`);
  assert.ok(typeof e.title === 'string' && e.title.length > 0, 'title');
  assert.ok(/^https?:\/\//.test(e.link), 'link');
  assert.ok(!Number.isNaN(Date.parse(e.date)), 'date');
  assert.ok(Array.isArray(e.sectors), 'sectors');
  assert.ok(Array.isArray(e.chain), 'chain');
  assert.ok(typeof e.src === 'string', 'src');
  if (e.lat !== null) { assert.ok(e.lat >= -90 && e.lat <= 90); assert.ok(e.lng >= -180 && e.lng <= 180); }
}
