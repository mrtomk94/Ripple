// Merge the same story reported by different trusted outlets into one event,
// listing every outlet that carried it. A story counts once, and "confirmed by
// N sources" shows how widely it is being reported.

const STOP = new Set('the a an of on in to for at by with from and or is are was were be been its it as after amid over into new says said say will could would may more than up out off but not this that these those has have had who what why how us uk'.split(' '));
const UP = /\b(?:jumps?|surges?|soars?|rises?|rallies|rally|climbs?|gains?|higher|record high|spikes?)\b/i;
const DOWN = /\b(?:falls?|plunges?|drops?|slumps?|sinks?|tumbles?|slides?|lower|crash(?:es)?|declines?)\b/i;
const WINDOW_MS = 36 * 3600e3;

export function headlineTokens(title) {
  const words = String(title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/);
  return new Set(words
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .filter((w) => w.length >= 3 && !STOP.has(w)));
}

// Direction of the first move word, so "oil jumps" and "oil falls" never merge.
function mood(title) {
  const t = String(title || '');
  const u = t.search(UP), d = t.search(DOWN);
  if (u === -1 && d === -1) return 0;
  if (d === -1 || (u !== -1 && u < d)) return 1;
  return -1;
}

const sourceOf = (e) => ({ src: e.src, outlet: e.outlet, link: e.link });

function sameStory(cluster, e, tokens) {
  const base = cluster.event;
  if (base.cat !== e.cat) return false;
  if (Math.abs(Date.parse(base.date) - Date.parse(e.date)) > WINDOW_MS) return false;
  if (base.region && e.region && base.region !== e.region) return false;
  const m1 = cluster.mood, m2 = mood(e.title);
  if (m1 && m2 && m1 !== m2) return false;
  let shared = 0;
  for (const t of tokens) if (cluster.tokens.has(t)) shared++;
  return shared >= 3 && shared / Math.min(tokens.size, cluster.tokens.size) >= 0.5;
}

export function corroborate(events) {
  const out = [];
  const clusters = [];
  const sorted = [...events].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  for (const e of sorted) {
    if (!e.outlet) { out.push(e); continue; }
    const tokens = headlineTokens(e.title);
    const hit = clusters.find((c) => sameStory(c, e, tokens));
    const incoming = e.sources?.length ? e.sources : [sourceOf(e)];
    if (!hit) {
      const event = { ...e, sources: [] };
      const c = { event, tokens: new Set(tokens), mood: mood(e.title) };
      for (const s of incoming) if (!event.sources.some((x) => x.outlet === s.outlet)) event.sources.push(s);
      clusters.push(c);
      out.push(event);
      continue;
    }
    for (const t of tokens) hit.tokens.add(t);
    if (!hit.mood) hit.mood = mood(e.title);
    for (const s of incoming) if (!hit.event.sources.some((x) => x.outlet === s.outlet)) hit.event.sources.push(s);
    hit.event.sev = Math.max(hit.event.sev, e.sev);
  }
  return out.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
