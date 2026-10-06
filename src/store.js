import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export function createStore({ file, now = Date.now, maxAgeDays = 14, maxEvents = 1000 }) {
  const items = new Map();
  const maxAge = maxAgeDays * 864e5;
  const fresh = (e) => now() - Date.parse(e.date) <= maxAge;
  const newestFirst = (a, b) => Date.parse(b.date) - Date.parse(a.date);

  function enforceCap() {
    if (items.size <= maxEvents) return;
    const keep = [...items.values()].sort(newestFirst).slice(0, maxEvents);
    items.clear();
    keep.forEach((e) => items.set(e.id, e));
  }

  return {
    upsert(events) {
      let added = 0;
      for (const e of events) {
        if (!e?.id || !fresh(e)) continue;
        const old = items.get(e.id);
        if (!old) added++;
        items.set(e.id, old?.sources && !e.sources ? { ...e, sources: old.sources } : e);
      }
      enforceCap();
      return added;
    },
    list({ cat, limit } = {}) {
      const out = [...items.values()].filter((e) => !cat || e.cat === cat).sort(newestFirst);
      return limit ? out.slice(0, limit) : out;
    },
    prune() {
      for (const [id, e] of items) if (!fresh(e)) items.delete(id);
    },
    async load() {
      try {
        const data = JSON.parse(await readFile(file, 'utf8'));
        if (Array.isArray(data)) this.upsert(data);
      } catch { /* missing or corrupt file: start empty */ }
    },
    async save() {
      await mkdir(dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await writeFile(tmp, JSON.stringify([...items.values()]));
      await rename(tmp, file);
    },
  };
}
