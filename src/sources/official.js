// Official channels and archives for the "Big voices" panel.
import { parseFeed, decodeText } from '../xml.js';
import { makeEvent } from '../event.js';
import { classifyHeadline, CHAINS } from '../classify/rules.js';
import { PEOPLE_CHAIN } from '../people.js';

const SEC = [
  { ticker: 'TSLA', company: 'Tesla', people: ['musk'] },
  { ticker: 'META', company: 'Meta', people: ['zuckerberg'] },
  { ticker: 'SPCX', company: 'SpaceX', people: ['musk'] },
];

export function buildFeeds(env = process.env) {
  const feeds = [
    { kind: 'fedreg', label: 'Federal Register', people: ['trump'], url: 'https://www.federalregister.gov/api/v1/documents.json?conditions%5Btype%5D%5B%5D=PRESDOCU&order=newest&per_page=20' },
    { kind: 'meta', label: 'Meta Newsroom', people: ['zuckerberg'], url: 'https://about.fb.com/news/feed/' },
    { kind: 'ucsb', label: 'American Presidency Project (UC Santa Barbara)', people: ['trump'], url: 'https://www.presidency.ucsb.edu/taxonomy/term/423/all/feed' },
    { kind: 'truth', label: "Trump's Truth (trumpstruth.org, unofficial archive)", people: ['trump'], url: 'https://trumpstruth.org/feed' },
  ];
  const email = String(env.SEC_CONTACT_EMAIL || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    for (const c of SEC) {
      feeds.push({
        kind: 'sec', label: `SEC EDGAR (${c.company})`, ...c,
        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${c.ticker}&type=8-K&dateb=&owner=include&count=10&output=atom`,
        fetch: { headers: { 'user-agent': `Ripple world-event radar ${email}` } },
      });
    }
  }
  return feeds;
}

function excerpt(text, max = 160) {
  const t = decodeText(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

function tagged({ feed, key, title, link, date, defaults, what, unofficial }) {
  const c = classifyHeadline(title);
  return makeEvent({
    source: 'official', key: key || link, title, link, date,
    cat: c?.cat || defaults.cat, sev: Math.max(c?.sev || 0, defaults.sev),
    lat: c?.place?.lat, lng: c?.place?.lng, region: c?.place?.region,
    what, chain: c?.chain || PEOPLE_CHAIN, sectors: c?.sectors || [], src: feed.label, people: feed.people, unofficial,
  });
}

const PARSERS = {
  fedreg(text, feed) {
    let r;
    try { r = JSON.parse(text)?.results; } catch { return []; }
    return (Array.isArray(r) ? r : []).map((d) => {
      const title = `${d.subtype || 'Presidential document'}: ${d.title}`;
      const ev = tagged({ feed, key: d.document_number, title, link: d.html_url, date: d.publication_date,
        defaults: { cat: 'markets', sev: 3 }, what: 'Official presidential document published in the Federal Register.' });
      if (ev) ev.title = title;
      return ev;
    });
  },
  meta: (text, feed) => parseFeed(text).map((it) => tagged({ feed, title: it.title, link: it.link, date: it.pubDate,
    defaults: { cat: 'tech', sev: 1 }, what: 'Official announcement from the Meta Newsroom.' })),
  ucsb: (text, feed) => parseFeed(text).map((it) => makeEvent({ source: 'official', key: it.link, title: it.title, link: it.link,
    date: it.pubDate, cat: 'markets', sev: 2, what: "A day of President Trump's Truth Social posts, archived by UC Santa Barbara's American Presidency Project. Open the link to read them.",
    chain: PEOPLE_CHAIN, sectors: [], src: feed.label, people: feed.people })),
  truth: (text, feed) => parseFeed(text).map((it) => {
    const body = it.fields.description || it.title;
    return tagged({ feed, title: excerpt(body), link: it.link, date: it.pubDate, defaults: { cat: 'markets', sev: 1 },
      what: 'Truth Social post by Donald Trump, from an unofficial public archive. Check the original before acting on it.', unofficial: true });
  }),
  sec: (text, feed) => parseFeed(text).map((it) => {
    const form = it.title.replace(/^8-K\s*(?:-\s*)?/, '').trim() || 'Current report';
    return makeEvent({ source: 'official', key: it.link, title: `${feed.company} files 8-K: ${form}`, link: it.link, date: it.pubDate,
      cat: 'markets', sev: 3, what: `${feed.company} filed a current report (Form 8-K) with the SEC, which companies use to announce major events.`,
      chain: CHAINS.markets, sectors: [], src: feed.label, people: feed.people });
  }),
};

export default {
  name: 'official',
  intervalMin: 30,
  feeds: buildFeeds(),
  parse(text, feed = {}) {
    const p = PARSERS[feed.kind];
    return p ? p(text, feed).filter(Boolean) : [];
  },
};
