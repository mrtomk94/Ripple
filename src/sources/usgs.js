import { makeEvent } from '../event.js';
import { quakeSeverity, regionImpacts, CHAINS } from '../classify/rules.js';

export default {
  name: 'usgs',
  intervalMin: 15,
  feeds: [{ url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson', label: 'USGS Earthquakes' }],
  parse(text) {
    let data;
    try { data = JSON.parse(text); } catch { return []; }
    return (data?.features || [])
      .filter((f) => f?.properties?.mag >= 6)
      .map((f) => {
        const p = f.properties;
        const [lng, lat] = f.geometry?.coordinates || [];
        return makeEvent({
          source: 'usgs', key: f.id, title: p.title, link: p.url, date: new Date(p.time).toISOString(),
          cat: 'weather', sev: quakeSeverity(p.mag), lat, lng, region: p.place,
          what: `A magnitude ${p.mag} earthquake struck ${p.place}${p.tsunami ? ', with a tsunami alert issued' : ''}.`,
          chain: CHAINS.weather,
          sectors: [{ s: 'Insurance', d: -1, why: 'Property and business claims' }, ...regionImpacts(lat, lng)],
          src: 'USGS Earthquake Hazards Program',
        });
      })
      .filter(Boolean);
  },
};
