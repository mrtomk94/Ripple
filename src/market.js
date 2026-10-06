// Free daily price history (no API key): Stooq first, Yahoo chart API as backup.
// From history we get the current price, today's change, and 20/50-day averages.

const nyDate = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(ms));
const ymd = (ms) => nyDate(ms).replaceAll('-', '');

export function isWeekendNY(ms) {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date(ms));
  return day === 'Sat' || day === 'Sun';
}

export function parseStooqHistory(text) {
  const lines = String(text || '').trim().split(/\r?\n/);
  if (!/^Date,/i.test(lines[0] || '')) return [];
  const cols = lines[0].toLowerCase().split(',');
  const di = cols.indexOf('date'), ci = cols.indexOf('close');
  return lines.slice(1).map((l) => l.split(',')).map((v) => ({ date: v[di], close: Number(v[ci]) }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(r.close) && r.close > 0);
}

export function parseYahooHistory(text) {
  let r;
  try { r = JSON.parse(text)?.chart?.result?.[0]; } catch { return []; }
  const ts = r?.timestamp || [];
  const closes = r?.indicators?.quote?.[0]?.close || [];
  return ts.map((t, i) => ({ date: nyDate(t * 1000), close: closes[i] === null ? NaN : Number(closes[i]) }))
    .filter((x) => Number.isFinite(x.close) && x.close > 0);
}

const avg = (rows, n) => (rows.length >= n ? rows.slice(-n).reduce((s, r) => s + r.close, 0) / n : null);

export function summarize(rows) {
  if (!rows || rows.length < 2) return null;
  const last = rows.at(-1), prev = rows.at(-2);
  const ma20 = avg(rows, 20), ma50 = avg(rows, 50);
  const refs = [ma20, ma50].filter((m) => m !== null);
  let trend = 'mixed';
  if (refs.length && refs.every((m) => last.close > m)) trend = 'up';
  else if (refs.length && refs.every((m) => last.close < m)) trend = 'down';
  return { price: last.close, date: last.date, prev: prev.close, changePct: last.close / prev.close - 1, ma20, ma50, trend };
}

const PROVIDERS = [
  { url: (t, now) => `https://stooq.com/q/d/l/?s=${t.toLowerCase()}.us&i=d&d1=${ymd(now - 120 * 864e5)}&d2=${ymd(now)}`, parse: parseStooqHistory },
  { url: (t) => `https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=6mo&interval=1d`, parse: parseYahooHistory },
];

export async function getHistory(ticker, fetchText, now = Date.now) {
  for (const p of PROVIDERS) {
    try {
      const s = summarize(p.parse(await fetchText(p.url(ticker, now()))));
      if (s) return s;
    } catch { /* next provider */ }
  }
  return null;
}

export async function getMarket(tickers, fetchText, now = Date.now, concurrency = 4) {
  const list = [...new Set(tickers)].filter((t) => /^[A-Z.]{1,6}$/.test(t));
  const out = {};
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const t = list[i++];
      const s = await getHistory(t, fetchText, now);
      if (s) out[t] = s;
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  return Object.fromEntries(list.filter((t) => out[t]).map((t) => [t, out[t]]));
}
