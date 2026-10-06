import { parseFeed } from '../xml.js';
import { makeEvent } from '../event.js';
import { stormSeverity, regionImpacts, CHAINS } from '../classify/rules.js';

export default {
  name: 'nhc',
  intervalMin: 15,
  feeds: [
    { url: 'https://www.nhc.noaa.gov/index-at.xml', label: 'NOAA NHC Atlantic' },
    { url: 'https://www.nhc.noaa.gov/index-ep.xml', label: 'NOAA NHC Eastern Pacific' },
  ],
  parse(text, feed = {}) {
    return parseFeed(text)
      .filter((it) => it.fields['nhc:center'])
      .map((it) => {
        const [lat, lng] = it.fields['nhc:center'].split(',').map(Number);
        const wind = parseInt(it.fields['nhc:wind'], 10) || 0;
        const name = it.title.replace(/^Summary for\s+/i, '').replace(/\s*\(.*\)\s*$/, '');
        const stormId = (it.title.match(/\/([A-Z]{2}\d{6})\)/) || [])[1] || name;
        const sev = stormSeverity(wind);
        return makeEvent({
          source: 'nhc', key: stormId, title: name, link: it.link, date: it.pubDate, cat: 'weather', sev, lat, lng,
          region: feed.label?.replace('NOAA NHC ', '') || null,
          what: `${name} has sustained winds near ${wind} mph${it.fields['nhc:movement'] ? `, moving ${it.fields['nhc:movement']}` : ''}.`,
          chain: CHAINS.weather,
          sectors: [
            { s: 'Insurance', d: -1, why: 'Wind and flood claims' },
            ...regionImpacts(lat, lng),
            ...(sev >= 3 ? [{ s: 'Travel & airlines', d: -1, why: 'Flight and resort cancellations' }] : []),
          ],
          src: feed.label || 'NOAA National Hurricane Center',
        });
      })
      .filter(Boolean);
  },
};
