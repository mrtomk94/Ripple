import { parseFeed } from '../xml.js';
import { makeEvent } from '../event.js';
import { classifyHeadline, findPlace } from '../classify/rules.js';
import { peopleIn, PEOPLE_CHAIN } from '../people.js';

// Stores only the headline, link and date from each outlet, plus our own tags.
export default {
  name: 'news',
  intervalMin: 30,
  feeds: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', label: 'BBC World', outlet: 'BBC' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', label: 'BBC Business', outlet: 'BBC' },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', label: 'BBC Technology', outlet: 'BBC' },
    { url: 'https://feeds.npr.org/1001/rss.xml', label: 'NPR News', outlet: 'NPR' },
    { url: 'https://feeds.npr.org/1006/rss.xml', label: 'NPR Business', outlet: 'NPR' },
    { url: 'https://www.theguardian.com/world/rss', label: 'The Guardian World', outlet: 'The Guardian' },
    { url: 'https://www.theguardian.com/business/rss', label: 'The Guardian Business', outlet: 'The Guardian' },
    { url: 'https://www.theguardian.com/technology/rss', label: 'The Guardian Technology', outlet: 'The Guardian' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', label: 'Al Jazeera', outlet: 'Al Jazeera' },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', label: 'CNBC Top News', outlet: 'CNBC' },
    { url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', label: 'CNBC World', outlet: 'CNBC' },
    { url: 'https://rss.dw.com/xml/rss-en-all', label: 'DW News', outlet: 'DW' },
  ],
  parse(text, feed = {}) {
    const label = feed.label || 'News';
    return parseFeed(text)
      .map((it) => {
        const people = peopleIn(it.title);
        const c = classifyHeadline(it.title)
          || (people.length ? { cat: 'markets', sev: 2, sectors: [], chain: PEOPLE_CHAIN, place: findPlace(it.title) } : null);
        if (!c) return null;
        return makeEvent({
          source: 'news', key: it.link, title: it.title, link: it.link, date: it.pubDate, cat: c.cat, sev: c.sev,
          lat: c.place?.lat, lng: c.place?.lng, region: c.place?.region,
          what: `Headline from ${label}, tagged automatically by keyword rules. Open the source for the full story.`,
          chain: c.chain, sectors: c.sectors, src: label, outlet: feed.outlet, people,
        });
      })
      .filter(Boolean);
  },
};
