// Five years of weekly closing prices for every tracked ticker, written to
// public/history.json for the click-a-ticker chart. Refreshed twice a day.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseStooqHistory, parseYahooHistory } from './market.js';
import { UNIVERSE } from './watchlist.js';
import { SECTOR_ETF } from './event.js';

export const HISTORY_TICKERS = [...new Set([...UNIVERSE, ...Object.values(SECTOR_ETF), 'SPY'])];
const REFRESH_MS = 12 * 3600e3;
const MIN_WEEKS = 4; // low enough for recent listings such as SPCX (June 2026)
const ymd = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(ms)).replaceAll('-', '');

const PROVIDERS = [
  { url: (t, now) => `https://stooq.com/q/d/l/?s=${t.toLowerCase()}.us&i=w&d1=${ymd(now - 5 * 365.25 * 864e5)}&d2=${ymd(now)}`, parse: parseStooqHistory },
  { url: (t) => `https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=5y&interval=1wk`, parse: parseYahooHistory },
];

export async function getWeekly(ticker, fetchText, now = Date.now) {
  for (const p of PROVIDERS) {
    try {
      const rows = p.parse(await fetchText(p.url(ticker, now())));
      if (rows.length >= MIN_WEEKS) return rows;
    } catch { /* next provider */ }
  }
  return null;
}

export const compact = (rows) => ({ dates: rows.map((r) => r.date), closes: rows.map((r) => Math.round(r.close * 100) / 100) });

export const shouldRefresh = (prev, ms) => !prev || !Number.isFinite(prev.fetchedAt) || ms - prev.fetchedAt >= REFRESH_MS;

export async function buildHistory({ tickers = HISTORY_TICKERS, previous = null, fetchText, now = Date.now, concurrency = 4 }) {
  if (!shouldRefresh(previous, now())) return previous;
  const series = { ...(previous?.series || {}) };
  const list = [...new Set(tickers)].filter((t) => /^[A-Z.]{1,6}$/.test(t));
  let i = 0, got = 0;
  const worker = async () => {
    while (i < list.length) {
      const t = list[i++];
      const rows = await getWeekly(t, fetchText, now);
      if (rows) { series[t] = compact(rows); got++; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  return { fetchedAt: now(), asked: list.length, got, series };
}

export function pagesUrl(repo) {
  const m = /^([\w.-]+)\/([\w.-]+)$/.exec(String(repo || ''));
  return m ? `https://${m[1].toLowerCase()}.github.io/${m[2]}/history.json` : null;
}

// Previous copy: this folder first (local runs), else the live site (GitHub Actions).
export async function collectHistoryToFile(file, { tickers, fetchText, now = Date.now, repo = process.env.GITHUB_REPOSITORY }) {
  let previous = null;
  try { previous = JSON.parse(await readFile(file, 'utf8')); } catch {
    const url = pagesUrl(repo);
    if (url) { try { previous = JSON.parse(await fetchText(url, { maxBytes: 5_000_000 })); } catch { /* first run */ } }
  }
  const out = await buildHistory({ tickers, previous, fetchText, now });
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(out));
  return out;
}
