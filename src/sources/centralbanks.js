import { parseFeed } from '../xml.js';
import { makeEvent } from '../event.js';
import { CHAINS } from '../classify/rules.js';

const POLICY = /\b(FOMC|monetary policy|interest rates?|policy rates?|discount rate)\b/i;
const DECISION = /\b(FOMC statement|monetary policy decisions?|policy decision)\b/i;

export default {
  name: 'centralbanks',
  intervalMin: 60,
  feeds: [
    { url: 'https://www.federalreserve.gov/feeds/press_all.xml', label: 'Federal Reserve', lat: 38.9, lng: -77.04, region: 'United States' },
    { url: 'https://www.ecb.europa.eu/rss/press.html', label: 'European Central Bank', lat: 50.11, lng: 8.68, region: 'Eurozone' },
  ],
  parse(text, feed = {}) {
    return parseFeed(text)
      .filter((it) => POLICY.test(it.title) || POLICY.test(it.fields.category || ''))
      .map((it) => makeEvent({
        source: 'centralbanks', key: it.link, title: `${feed.label || 'Central bank'}: ${it.title}`, link: it.link, date: it.pubDate,
        cat: 'markets', sev: DECISION.test(it.title) ? 4 : 3, lat: feed.lat, lng: feed.lng, region: feed.region,
        what: 'An official policy release. Read the statement for the rate decision and tone.',
        chain: CHAINS.markets,
        sectors: [{ s: 'Banks & rate-sensitive', d: 0, why: 'Direction depends on the decision and guidance' }],
        src: feed.label || 'Central bank',
      }))
      .filter(Boolean);
  },
};
