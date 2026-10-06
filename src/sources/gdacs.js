import { parseFeed } from '../xml.js';
import { makeEvent } from '../event.js';
import { regionImpacts, CHAINS } from '../classify/rules.js';

const TYPES = {
  TC: [{ s: 'Insurance', d: -1, why: 'Storm damage claims' }, { s: 'Shipping & freight', d: 0, why: 'Port closures' }],
  FL: [{ s: 'Insurance', d: -1, why: 'Flood claims' }, { s: 'Agriculture', d: 0, why: 'Crop losses' }],
  DR: [{ s: 'Agriculture', d: 0, why: 'Lower harvests raise crop prices but hurt farmers' }, { s: 'Utilities & power', d: 0, why: 'Low water cuts hydropower' }],
  EQ: [{ s: 'Insurance', d: -1, why: 'Property claims' }],
  VO: [{ s: 'Travel & airlines', d: -1, why: 'Ash closes airspace' }],
  WF: [{ s: 'Insurance', d: -1, why: 'Fire claims' }, { s: 'Utilities & power', d: -1, why: 'Utilities can be liable for fires' }],
};

export default {
  name: 'gdacs',
  intervalMin: 30,
  feeds: [{ url: 'https://www.gdacs.org/xml/rss.xml', label: 'GDACS (UN/EU disaster alerts)' }],
  parse(text, feed = {}) {
    return parseFeed(text)
      .filter((it) => ['Orange', 'Red'].includes(it.fields['gdacs:alertlevel']))
      .map((it) => {
        const lat = Number(it.fields['geo:lat']);
        const lng = Number(it.fields['geo:long']);
        const type = it.fields['gdacs:eventtype'];
        const red = it.fields['gdacs:alertlevel'] === 'Red';
        return makeEvent({
          source: 'gdacs', key: it.link, title: it.title, link: it.link, date: it.pubDate, cat: 'weather', sev: red ? 5 : 3,
          lat, lng, region: it.fields['gdacs:country'] || null,
          what: `${red ? 'Red' : 'Orange'} alert from the UN/EU disaster system: ${red ? 'major' : 'significant'} humanitarian impact expected.`,
          chain: CHAINS.weather,
          sectors: [...(TYPES[type] || TYPES.EQ), ...regionImpacts(lat, lng)],
          src: feed.label || 'GDACS',
        });
      })
      .filter(Boolean);
  },
};
