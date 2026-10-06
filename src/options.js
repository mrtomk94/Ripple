// Unusual options sweep from Cboe's public delayed chains (about 15 minutes late).
// The data shows that a trade happened, not who bought or sold, so flagged
// trades are shown for research and never scored as predictions.
import { UNIVERSE } from './watchlist.js';

export const RULES = Object.freeze({ minVolume: 1000, minRatio: 2, minPremium: 1_000_000, maxDte: 60, top: 20 });
export const OPTION_UNIVERSE = UNIVERSE.filter((t) => t !== 'SPY' && t !== 'QQQ');
const FETCH = { maxBytes: 40_000_000, timeoutMs: 60_000 };

const NY = (ms, opts) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', ...opts }).format(new Date(ms));
function nyParts(ms) {
  const date = NY(ms);
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms)).split(':').map(Number);
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date(ms));
  return { date, minutes: (h % 24) * 60 + m, weekend: wd === 'Sat' || wd === 'Sun' };
}
const OPEN = 9 * 60 + 30, CLOSE = 16 * 60;

export function isMarketOpenNY(ms) {
  const p = nyParts(ms);
  return !p.weekend && p.minutes >= OPEN && p.minutes < CLOSE;
}

// Hourly while the market is open, then once after the close. US holidays are not modeled.
export function shouldSweep(prev, ms) {
  if (!prev || !Number.isFinite(prev.at)) return true;
  const now = nyParts(ms);
  if (now.weekend) return false;
  if (isMarketOpenNY(ms)) return ms - prev.at >= 55 * 60e3;
  if (now.minutes < CLOSE) return false;
  const last = nyParts(prev.at);
  return last.date < now.date || last.minutes < CLOSE;
}

const OCC = /^([A-Z.]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/;
export function parseOcc(code) {
  const m = OCC.exec(String(code || ''));
  if (!m) return null;
  return { root: m[1], expiry: `20${m[2]}-${m[3]}-${m[4]}`, type: m[5] === 'C' ? 'call' : 'put', strike: Number(m[6]) / 1000 };
}

export function parseChain(text) {
  let d;
  try { d = JSON.parse(text)?.data; } catch { return null; }
  if (!d || !Array.isArray(d.options)) return null;
  const contracts = [];
  for (const o of d.options) {
    const occ = parseOcc(o.option);
    if (!occ) continue;
    const last = Number(o.last_trade_price);
    const mid = (Number(o.bid) + Number(o.ask)) / 2;
    const price = last > 0 ? last : mid > 0 ? mid : 0;
    contracts.push({ code: o.option, ...occ, volume: Number(o.volume) || 0, oi: Number(o.open_interest) || 0, price });
  }
  return { symbol: String(d.symbol || '').replace(/^_/, ''), price: Number(d.current_price) || null, contracts };
}

const dayNum = (ymd) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) / 864e5;

export function flagUnusual(chain, ms, rules = RULES) {
  if (!chain) return [];
  const today = dayNum(NY(ms));
  return chain.contracts
    .map((c) => ({ c, dte: dayNum(c.expiry) - today, premium: c.volume * c.price * 100 }))
    .filter(({ c, dte, premium }) => c.volume >= rules.minVolume && c.volume > rules.minRatio * c.oi
      && premium >= rules.minPremium && dte >= 0 && dte <= rules.maxDte)
    .map(({ c, dte, premium }) => ({
      ticker: chain.symbol, contract: c.code, type: c.type, strike: c.strike, expiry: c.expiry, dte,
      volume: c.volume, oi: c.oi, ratio: c.oi ? Math.round((c.volume / c.oi) * 10) / 10 : null,
      price: c.price, premium, underlying: chain.price,
      moneyness: chain.price ? c.strike / chain.price - 1 : null,
    }))
    .sort((a, b) => b.premium - a.premium);
}

export async function sweepOptions(tickers, fetchText, now = Date.now, concurrency = 3) {
  const list = [...new Set(tickers)];
  const flagged = [];
  let scanned = 0, failed = 0, i = 0;
  const worker = async () => {
    while (i < list.length) {
      const t = list[i++];
      try {
        const chain = parseChain(await fetchText(`https://cdn.cboe.com/api/global/delayed_quotes/options/${t}.json`, FETCH));
        if (!chain) throw new Error('bad chain');
        flagged.push(...flagUnusual(chain, now()));
        scanned++;
      } catch { failed++; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  flagged.sort((a, b) => b.premium - a.premium);
  return { at: now(), scanned, failed, rules: { ...RULES }, flagged: flagged.slice(0, RULES.top) };
}
