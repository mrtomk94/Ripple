import { makeEvent } from '../event.js';
import { CHAINS } from '../classify/rules.js';

const KEEP = {
  volcanoes: [{ s: 'Travel & airlines', d: -1, why: 'Ash clouds close airspace' }],
  severeStorms: [{ s: 'Insurance', d: -1, why: 'Storm claims' }, { s: 'Shipping & freight', d: 0, why: 'Ships reroute' }],
};

export default {
  name: 'eonet',
  intervalMin: 60,
  feeds: [{ url: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7', label: 'NASA EONET' }],
  parse(text) {
    let data;
    try { data = JSON.parse(text); } catch { return []; }
    return (data?.events || [])
      .map((e) => {
        const cat = (e.categories || []).map((c) => c.id).find((id) => id in KEEP);
        const points = (e.geometry || []).filter((g) => g.type === 'Point');
        const last = points[points.length - 1];
        if (!cat || !last) return null;
        const [lng, lat] = last.coordinates;
        return makeEvent({
          source: 'eonet', key: e.id, title: e.title, link: e.sources?.[0]?.url || `https://eonet.gsfc.nasa.gov/api/v3/events/${e.id}`,
          date: last.date, cat: 'weather', sev: 2, lat, lng, region: null,
          what: cat === 'volcanoes' ? 'An active volcano is being tracked by NASA.' : 'A severe storm is being tracked by NASA satellites.',
          chain: CHAINS.weather, sectors: KEEP[cat], src: 'NASA Earth Observatory (EONET)',
        });
      })
      .filter(Boolean);
  },
};
