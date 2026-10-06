import { parseFeed } from '../xml.js';
import { makeEvent } from '../event.js';
import { classifyHeadline } from '../classify/rules.js';

// Stores only the headline, link and date from each outlet, plus our own tags.
export default {
  name: 'news',
  intervalMin: 30,
  feeds: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', label: 'BBC World' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', label: 'BBC Business' },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', label: 'BBC Technology' },
  ],
  parse(text, feed = {}) {
    const label = feed.label || 'News';
    return parseFeed(text)
      .map((it) => {
        const c = classifyHeadline(it.title);
        if (!c) return null;
        return makeEvent({
          source: 'news', key: it.link, title: it.title, link: it.link, date: it.pubDate, cat: c.cat, sev: c.sev,
          lat: c.place?.lat, lng: c.place?.lng, region: c.place?.region,
          what: `Headline from ${label}, tagged automatically by keyword rules. Open the source for the full story.`,
          chain: c.chain, sectors: c.sectors, src: label,
        });
      })
      .filter(Boolean);
  },
};
