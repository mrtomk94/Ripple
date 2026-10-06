// Scores Ripple's own calls. Each up/down sector on a new event becomes a
// prediction on that sector's fund. One trading day later it is a hit if the
// fund beat (or, for "down", trailed) the overall market (SPY).
import { SECTOR_ETF } from './event.js';

export const BENCHMARK = 'SPY';
const H = 3600e3;
const NEW_EVENT_HOURS = 24;     // only call fresh news; old news is already priced in
const MIN_HOLD_HOURS = 20;      // at least most of a day between prices
const FLAT = 0.001;             // under 0.1% vs the market is a tie
const START_TIMEOUT_DAYS = 4;   // give up if we never got a starting price
const KEEP_DAYS = 90;

export function addPredictions(preds, events, now = Date.now) {
  const have = new Set(preds.map((p) => p.id));
  const out = [...preds];
  for (const e of events) {
    if (now() - Date.parse(e.date) > NEW_EVENT_HOURS * H) continue;
    for (const s of e.sectors || []) {
      const ticker = SECTOR_ETF[s.s];
      if (!ticker || (s.d !== 1 && s.d !== -1)) continue;
      const id = `${e.id}|${ticker}`;
      if (have.has(id)) continue;
      have.add(id);
      out.push({ id, eventId: e.id, title: e.title, sector: s.s, ticker, d: s.d, madeAt: now(), status: 'pending', start: null, end: null });
    }
  }
  return out;
}

export function neededTickers(preds) {
  const t = new Set(preds.filter((p) => p.status === 'pending').map((p) => p.ticker));
  return t.size ? [...t, BENCHMARK] : [];
}

function score(p, quotes, t) {
  const fund = quotes[p.ticker];
  const mkt = quotes[BENCHMARK];
  if (!p.start) {
    if (fund && mkt) return { ...p, start: { price: fund.price, mkt: mkt.price, date: fund.date } };
    return t - p.madeAt > START_TIMEOUT_DAYS * 24 * H ? { ...p, status: 'expired', resolvedAt: t } : p;
  }
  if (!fund || !mkt || fund.date <= p.start.date || t - p.madeAt < MIN_HOLD_HOURS * H) return p;
  const ret = fund.price / p.start.price - 1;
  const mktRet = mkt.price / p.start.mkt - 1;
  const excess = ret - mktRet;
  const status = Math.abs(excess) < FLAT ? 'flat' : Math.sign(excess) === p.d ? 'hit' : 'miss';
  return { ...p, end: { price: fund.price, mkt: mkt.price, date: fund.date }, ret, mktRet, excess, status, resolvedAt: t };
}

export function updatePredictions(preds, quotes, now = Date.now) {
  const t = now();
  return preds
    .map((p) => (p.status === 'pending' ? score(p, quotes, t) : p))
    .filter((p) => p.status === 'pending' || t - (p.resolvedAt ?? p.madeAt) <= KEEP_DAYS * 24 * H);
}

export function scorecard(preds) {
  const scored = preds.filter((p) => p.status === 'hit' || p.status === 'miss');
  const hits = scored.filter((p) => p.status === 'hit').length;
  const bySector = {};
  for (const p of scored) {
    const b = (bySector[p.sector] ??= { hits: 0, scored: 0 });
    b.scored++;
    if (p.status === 'hit') b.hits++;
  }
  const recent = preds
    .filter((p) => ['hit', 'miss', 'flat'].includes(p.status))
    .sort((a, b) => b.resolvedAt - a.resolvedAt)
    .slice(0, 15)
    .map(({ id, title, sector, ticker, d, status, excess }) => ({ id, title, sector, ticker, d, status, excess }));
  return {
    scored: scored.length, hits, hitRate: scored.length ? hits / scored.length : null,
    pending: preds.filter((p) => p.status === 'pending').length, bySector, recent,
  };
}
