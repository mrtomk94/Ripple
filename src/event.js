import { createHash } from 'node:crypto';

export const CATEGORIES = ['war', 'weather', 'energy', 'tech', 'markets'];
export const SECTOR_ETF = {
  'Energy': 'XLE', 'Defense': 'ITA', 'Shipping & freight': 'IYT', 'Insurance': 'KIE',
  'Utilities & power': 'XLU', 'Consumer staples': 'XLP', 'Consumer discretionary': 'XLY',
  'Semiconductors': 'SMH', 'Cloud & software': 'IGV', 'Travel & airlines': 'JETS',
  'Agriculture': 'DBA', 'Banks & rate-sensitive': 'KRE',
};

const clampInt = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(n) || lo)));
const num = (n) => (typeof n === 'number' && Number.isFinite(n) ? n : null);

export function stableId(source, key) {
  return `${source}:${createHash('sha1').update(String(key)).digest('hex').slice(0, 16)}`;
}

export function dedupeSectors(list) {
  const seen = new Set();
  return list.filter((s) => s && !seen.has(s.s) && seen.add(s.s));
}

// Build a normalized event. Returns null when required pieces are missing.
export function makeEvent({ source, key, title, link, date, cat, sev, lat, lng, region, what, chain, sectors, src }) {
  const time = Date.parse(date);
  if (!title || !/^https?:\/\//.test(link || '') || Number.isNaN(time) || !CATEGORIES.includes(cat)) return null;
  let la = num(lat), lo = num(lng);
  if (la === null || lo === null || Math.abs(la) > 90 || Math.abs(lo) > 180) { la = null; lo = null; }
  const secs = dedupeSectors(sectors || []).slice(0, 6);
  return {
    id: stableId(source, key ?? link),
    cat, sev: clampInt(sev, 1, 5), title: String(title).slice(0, 160), link,
    date: new Date(time).toISOString(), lat: la, lng: lo, region: region || null,
    what: what || '', chain: chain || [], sectors: secs,
    watch: [...new Set(secs.map((s) => SECTOR_ETF[s.s]).filter(Boolean))],
    src: src || source,
  };
}
