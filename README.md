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
| BBC World, Business, Technology | Headlines matching market keywords | 30 min |

Only headlines, links, dates, and Ripple's own tags are stored. Article text is never copied. Events expire after 14 days.

Tagging is rule-based: keywords, a place lookup, and region boxes (for example, a quake near Taiwan flags semiconductors). No AI key is needed.

## Run locally

Requires Node 22+. There are no npm dependencies.

```
npm start            # http://localhost:3000
npm test
npm run coverage     # fails if line coverage < 80%
```

## Deploy to Render

1. Create a new GitHub repo and push this project to it.
2. In Render: **New > Blueprint**, pick the repo. Render reads `render.yaml` and creates an always-on web service with a 1 GB disk for saved events.
3. After deploy, open `/api/health` to see when each source last succeeded.

## API

- `GET /api/events?cat=war|weather|energy|tech|markets&limit=1-500`
- `GET /api/health`

## Adding a source

Add a file in `src/sources/` that exports `{ name, intervalMin, feeds: [{ url, label }], parse(text, feed) }`, returning events built with `makeEvent()`. Register it in `src/sources/index.js` and add a fixture plus tests.
