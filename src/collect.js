// One-shot collector for free hosting: run every source once, merge with the
// previous run's events, write a static events.json. Run by GitHub Actions.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createStore } from './store.js';
import { createScheduler, publicHealth } from './scheduler.js';

export async function collect({ sources, fetchText, previous = {}, log = console, now = Date.now }) {
  const store = createStore({ file: join(tmpdir(), `ripple-${process.pid}.json`), now });
  if (Array.isArray(previous.events)) store.upsert(previous.events);
  const noSave = { upsert: (e) => store.upsert(e), prune: () => store.prune(), save: async () => {} };
  const scheduler = createScheduler({ sources, store: noSave, fetchText, log, now });
  for (const s of sources) await scheduler.runSource(s);
  return { generatedAt: now(), sources: publicHealth(scheduler.status()), events: store.list({ limit: 500 }) };
}

export async function collectToFile(file, opts) {
  let previous = {};
  try { previous = JSON.parse(await readFile(file, 'utf8')); } catch { /* first run or bad file */ }
  const out = await collect({ ...opts, previous });
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(out));
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { fetchText } = await import('./fetch.js');
  const sources = (await import('./sources/index.js')).default;
  const out = await collectToFile(process.argv[2] || 'public/events.json', { sources, fetchText });
  const failing = Object.entries(out.sources).filter(([, s]) => s.failing).map(([n]) => n);
  console.info(`Collected ${out.events.length} events.${failing.length ? ` Failing: ${failing.join(', ')}` : ' All sources OK.'}`);
}
