// Free, no-key price quotes: Stooq first, Yahoo chart API as a backup.
// A quote is { price, date } where date is the trading day (YYYY-MM-DD, New York time).

export function parseStooq(text) {
  const lines = String(text || '').trim().split(/\r?\n/);
  if (lines.length < 2 || !/^Symbol,Date/i.test(lines[0])) return null;
  const cols = lines[0].split(',');
  const vals = lines[1].split(',');
  const row = Object.fromEntries(cols.map((c, i) => [c.toLowerCase(), vals[i]]));
  const price = Number(row.close);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || '') || !Number.isFinite(price) || price <= 0) return null;
  return { price, date: row.date };
}

const nyDate = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(ms));

export function parseYahoo(text) {
  let meta;
  try { meta = JSON.parse(text)?.chart?.result?.[0]?.meta; } catch { return null; }
  const price = Number(meta?.regularMarketPrice);
  const time = Number(meta?.regularMarketTime);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(time)) return null;
  return { price, date: nyDate(time * 1000) };
}

const PROVIDERS = [
  { url: (t) => `https://stooq.com/q/l/?s=${t.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`, parse: parseStooq },
  { url: (t) => `https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=1d&interval=1d`, parse: parseYahoo },
];

export async function getQuote(ticker, fetchText) {
  for (const p of PROVIDERS) {
    try {
      const q = p.parse(await fetchText(p.url(ticker)));
      if (q) return q;
    } catch { /* try the next provider */ }
  }
  return null;
}

export async function getQuotes(tickers, fetchText) {
  const unique = [...new Set(tickers)].filter((t) => /^[A-Z.]{1,6}$/.test(t));
  const out = {};
  for (const t of unique) {
    const q = await getQuote(t, fetchText);
    if (q) out[t] = q;
  }
  return out;
}
