// Public view of source status: working or failing, never error text.
export const publicHealth = (status) => Object.fromEntries(Object.entries(status).map(([name, s]) => [
  name, { runs: s.runs, lastOk: s.lastOk, failing: Boolean(s.lastErrorAt && (!s.lastOk || s.lastErrorAt >= s.lastOk)) },
]));

const blankStatus = () => ({ runs: 0, lastOk: null, lastError: null, lastErrorAt: null, added: 0 });

export function createScheduler({
  sources, store, fetchText, log = console, now = Date.now,
  setIntervalFn = setInterval, clearIntervalFn = clearInterval,
}) {
  const state = Object.fromEntries(sources.map((s) => [s.name, blankStatus()]));
  const running = new Set();
  let timers = [];

  async function runSource(src) {
    if (running.has(src.name)) return;
    running.add(src.name);
    const st = state[src.name] ??= blankStatus();
    let ok = false;
    let added = 0;
    try {
      for (const feed of src.feeds) {
        try {
          added += store.upsert(src.parse(await fetchText(feed.url, feed.fetch), feed));
          ok = true;
        } catch (err) {
          st.lastError = err.message;
          st.lastErrorAt = now();
          log.error(`[${src.name}] ${feed.url}: ${err.message}`);
        }
      }
      st.runs++;
      if (ok) { st.lastOk = now(); st.added = added; }
      store.prune();
      await store.save();
      log.info(`[${src.name}] +${added} new`);
    } catch (err) {
      log.error(`[${src.name}] save failed: ${err.message}`);
    } finally {
      running.delete(src.name);
    }
  }

  return {
    runSource,
    status: () => structuredClone(state),
    async start() {
      timers = sources.map((s) => setIntervalFn(() => runSource(s), s.intervalMin * 60e3));
      await Promise.all(sources.map(runSource));
    },
    stop() { timers.forEach(clearIntervalFn); timers = []; },
  };
}
