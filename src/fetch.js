export async function fetchText(url, { timeoutMs = 20000, maxBytes = 2_000_000, headers = {}, fetchFn = fetch } = {}) {
  const res = await fetchFn(url, {
    headers: { 'user-agent': 'Ripple/0.2 (world event radar)', accept: 'application/rss+xml, application/xml, application/json, text/xml;q=0.9, */*;q=0.5', ...headers },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > maxBytes) throw new Error('response too large');
  return text;
}
