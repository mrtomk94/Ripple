# Ripple

An always-on radar that pulls world events from trusted sources, tags each one with the market sectors it could push up or down, and shows them on a live map.

It is a research tool, not financial advice. Markets often price news in within minutes.

## Sources

| Source | What | Checked every |
|---|---|---|
| USGS | Earthquakes, magnitude 6+ | 15 min |
| NOAA National Hurricane Center | Atlantic and Eastern Pacific storms | 15 min |
| GDACS (UN/EU) | Orange and red disaster alerts worldwide | 30 min |
| NASA EONET | Volcanoes and severe storms | 60 min |
| Federal Reserve, ECB | Monetary policy releases | 60 min |
| BBC, NPR, The Guardian, Al Jazeera, CNBC, DW | Headlines matching market keywords | 30 min |

When different outlets report the same story (shared key words, same category and place, within 36 hours, same direction), it becomes one item listing every outlet, shown as "Confirmed by N sources." Two feeds from the same outlet count once.

Only headlines, links, dates, and Ripple's own tags are stored. Article text is never copied. Events expire after 14 days.

Tagging is rule-based: keywords, a place lookup, and region boxes (for example, a quake near Taiwan flags semiconductors). No AI key is needed.

## Prediction scorecard

Every new event (under 24 hours old) that marks a sector up or down becomes a call on that sector's fund (for example Energy → XLE). Ripple records the fund and SPY prices on the next collection, then checks again after the next trading day closes (at least 20 hours later).

- **Hit:** the fund beat SPY in the predicted direction ("up" = outperformed, "down" = underperformed).
- **Miss:** it went the other way. **Tie:** within 0.1% of SPY, not counted.
- Mixed sectors aren't scored. Calls with no starting price after 4 days expire. Results are kept 90 days.
- A coin flip scores about 50%, so that is the bar to beat. Under 30 scored calls, the % is rough.

Each call also has a size from how big the news is: **Small** (severity 1–2), **Medium** (3), **Big** (4–5). Size is right when the direction is right and the move vs SPY lands in that tier: under 0.5%, 0.5–1.5%, over 1.5%.

## Watchlist and movers

`src/watchlist.js` lists the watchlist (SPY, QQQ, NVDA, MU, TSLA, SPCX, META, GOOGL, NFLX, AAPL, MSFT, AMZN) and about 40 large stocks scanned for the day's biggest movers. Each shows price, today's change, and trend vs its 20- and 50-day averages. Edit the file to change the lists.

Prices are daily history from Stooq (free, no key), with Yahoo's chart API as a backup. They refresh every 30 minutes on weekdays and are reused over weekends. The Actions log line `Prices: X/Y quotes` shows whether they are coming through.

## Run locally

Requires Node 22+. There are no npm dependencies.

```
npm start            # http://localhost:3000
npm test
npm run coverage     # fails if line coverage < 80%
```

## Free hosting: GitHub Actions + GitHub Pages (recommended, $0)

No server. Every 15 minutes a GitHub Action runs `src/collect.js`, which pulls every source once, merges with the last run's events, and publishes the page plus `events.json` to GitHub Pages.

1. Make the repo **public** (free Pages and unlimited Actions minutes need a public repo).
2. Repo **Settings > Pages > Source: GitHub Actions**.
3. Push to `main`, or go to **Actions > Collect feeds > Run workflow**.
4. Your site: `https://<user>.github.io/<repo>/`. Each run's log shows which sources are failing.

Note: GitHub pauses scheduled workflows in public repos after 60 days with no commits. It emails you first; click **Enable workflow** or push any small change.

## Paid hosting: Render (optional, always-on server)

1. Create a new GitHub repo and push this project to it.
2. In Render: **New > Blueprint**, pick the repo. Render reads `render.yaml` and creates an always-on web service with a 1 GB disk for saved events.
3. After deploy, open `/api/health` to see when each source last succeeded.

## API

- `GET /api/events?cat=war|weather|energy|tech|markets&limit=1-500`
- `GET /api/health`

## Adding a source

Add a file in `src/sources/` that exports `{ name, intervalMin, feeds: [{ url, label }], parse(text, feed) }`, returning events built with `makeEvent()`. Register it in `src/sources/index.js` and add a fixture plus tests.
