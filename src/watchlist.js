// Stocks to watch, plus a wider set of large stocks scanned for the day's biggest movers.
const W = (ticker, name, sector, words) => ({ ticker, name, sector, re: words ? new RegExp(`\\b(?:${words})\\b`, 'i') : null });

export const WATCHLIST = [
  W('SPY', 'S&P 500', null, 's&p 500|s&p|wall street|stock market'),
  W('QQQ', 'Nasdaq 100', null, 'nasdaq'),
  W('NVDA', 'Nvidia', 'Semiconductors', 'nvidia'),
  W('MU', 'Micron', 'Semiconductors', 'micron'),
  W('TSLA', 'Tesla', 'Consumer discretionary', 'tesla'),
  W('SPCX', 'SpaceX', 'Defense', 'spacex|starlink'),
  W('META', 'Meta', 'Cloud & software', 'meta|facebook|instagram|whatsapp'),
  W('GOOGL', 'Alphabet (Google)', 'Cloud & software', 'google|alphabet|youtube'),
  W('NFLX', 'Netflix', 'Cloud & software', 'netflix'),
  W('AAPL', 'Apple', 'Cloud & software', 'apple|iphone'),
  W('MSFT', 'Microsoft', 'Cloud & software', 'microsoft'),
  W('AMZN', 'Amazon', 'Consumer discretionary', 'amazon'),
];

export const UNIVERSE = [...new Set([
  ...WATCHLIST.map((w) => w.ticker),
  'AMD', 'AVGO', 'TSM', 'INTC', 'QCOM', 'ARM', 'SMCI', 'ORCL', 'CRM', 'ADBE', 'PLTR', 'UBER', 'COIN', 'SHOP',
  'JPM', 'GS', 'XOM', 'CVX', 'LLY', 'UNH', 'WMT', 'COST', 'BA', 'LMT', 'DIS', 'NKE',
])];

const row = (ticker, q) => ({ ticker, price: q.price, changePct: q.changePct, trend: q.trend, ma20: q.ma20, ma50: q.ma50, date: q.date });

export function buildWatch(quotes, events, { universe = UNIVERSE, top = 5 } = {}) {
  const watchlist = WATCHLIST.map(({ ticker, name, sector, re }) => ({
    ticker, name, sector,
    ...(quotes[ticker] ? row(ticker, quotes[ticker]) : {}),
    mentions: re ? events.filter((e) => re.test(e.title || '')).map((e) => e.id).slice(0, 5) : [],
  }));
  const moves = universe.filter((t) => quotes[t] && Number.isFinite(quotes[t].changePct)).map((t) => row(t, quotes[t]));
  return {
    watchlist,
    movers: {
      up: moves.filter((m) => m.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, top),
      down: moves.filter((m) => m.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, top),
    },
  };
}
