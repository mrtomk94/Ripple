import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchText } from '../src/fetch.js';

const fake = (status, body) => async (url, opts) => ({ ok: status < 400, status, text: async () => body, _opts: opts });

test('returns body text and sends a user agent', async () => {
  let seen;
  const text = await fetchText('https://x', { fetchFn: async (u, o) => { seen = o; return fake(200, 'hello')(); } });
  assert.equal(text, 'hello');
  assert.match(seen.headers['user-agent'], /Ripple/);
  assert.ok(seen.signal);
});
test('throws on HTTP errors', async () => {
  await assert.rejects(fetchText('https://x', { fetchFn: fake(503, '') }), /HTTP 503/);
});
test('throws on oversized responses', async () => {
  await assert.rejects(fetchText('https://x', { fetchFn: fake(200, 'x'.repeat(11)), maxBytes: 10 }), /too large/);
});
