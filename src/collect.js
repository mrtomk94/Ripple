// One-shot collector for free hosting: run every source once, merge with the
// previous run's events, write a static events.json. Run by GitHub Actions.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { collectHistoryToFile, HISTORY_TICKERS } from './history.js';
import { createStore } from './store.js';
import { corroborate } from './corroborate.js';
import { createScheduler, publicHealth } from './scheduler.js';
import { addPredictions, updatePredictions, neededTickers, scorecard } from './predictions.js';
import { getMarket, isWeekendNY } from './market.js';
import { UNIVERSE, buildWatch } from './watchlist.js';
import { SECTOR_ETF } from './event.js';
import { BENCHMARK } from './predictions.js';
import { sweepOptions, shouldSweep, OPTION_UNIVERSE } from './options.js';

const MARKET_REFRESH_MS = 30 * 60e3;

export async function collect({ sources, fetchText, previous = {}, log = console, now = Date.now }) {
  const store = createStore({ file: join(tmpdir(), `ripple-${process.pid}.json`), now });
  if (Array.isArray(previous.events)) store.upsert(previous.events);
  const noSave = { upsert: (e) => store.upsert(e), prune: () => store.prune(), save: async () => {} };
  const scheduler = createScheduler({ sources, store: noSave, fetchText, log, now });
  for (const s of sources) await scheduler.runSource(s);
  const events = corroborate(store.list()).slice(0, 500);
  let predictions = addPredictions(Array.isArray(previous.predictions) ? previous.predictions : [], events, now);
  const market = await marketData({ previous: previous.market, predictions, fetchText, now });
  const quotes = market.quotes;
  predictions = updatePredictions(predictions, quotes, now);
  return {
    generatedAt: now(), sources: publicHealth(scheduler.status()), events,
    market, watch: buildWatch(quotes, events),
    options: shouldSweep(previous.options, now()) ? await sweepOptions(OPTION_UNIVERSE, fetchText, now) : previous.options,
    predictions, scorecard: scorecard(predictions),
  };
}

// Prices for sector funds, the benchmark, the watchlist and the movers scan.
// Reused for 30 minutes (and over weekends) to stay gentle on the free sources.
async function marketData({ previous, predictions, fetchText, now }) {
  const t = now();
  const prevOk = previous && previous.quotes && Number.isFinite(previous.fetchedAt);
  if (prevOk && (t - previous.fetchedAt < MARKET_REFRESH_MS || (isWeekendNY(t) && t - previous.fetchedAt < 3 * 864e5))) {
    return { ...previous, reused: true };
  }
  const wanted = [...new Set([...Object.values(SECTOR_ETF), BENCHMARK, ...UNIVERSE, ...neededTickers(predictions)])];
  const quotes = await getMarket(wanted, fetchText, now);
  return { fetchedAt: t, asked: wanted.length, got: Object.keys(quotes).length, quotes };
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
  const file = process.argv[2] || 'public/events.json';
  const out = await collectToFile(file, { sources, fetchText });
  const hist = await collectHistoryToFile(join(dirname(file), 'history.json'), { tickers: HISTORY_TICKERS, fetchText });
  console.info(`History: ${Object.keys(hist.series || {}).length} tickers${hist.got === undefined ? '' : `, ${hist.got}/${hist.asked} refreshed`}.`);
  const failing = Object.entries(out.sources).filter(([, s]) => s.failing).map(([n]) => n);
  console.info(`Collected ${out.events.length} events.${failing.length ? ` Failing: ${failing.join(', ')}` : ' All sources OK.'}`);
  if (out.options) console.info(`Options: ${out.options.flagged.length} unusual trades from ${out.options.scanned} chains (${out.options.failed} failed).`);
  console.info(`Prices: ${out.market.reused ? 'reused from last run' : `${out.market.got}/${out.market.asked} quotes`}. Predictions: ${out.scorecard.pending} pending, ${out.scorecard.scored} scored${out.scorecard.hitRate === null ? '' : `, ${Math.round(out.scorecard.hitRate * 100)}% hit rate`}.`);
}
