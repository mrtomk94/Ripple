// Rule-based tagging. No AI: keyword rules, a small place lookup, and region boxes.
// Output directions are "pressure to research", never certainty.

const P = (pattern, region, lat, lng) => ({ re: pattern, region, lat, lng });
const W = (words) => new RegExp(`\\b(?:${words})\\b`, 'i');
// Order matters: more specific names first.
const PLACES = [
  P(W('gulf of mexico'), 'Gulf of Mexico', 25, -90), P(W('strait of hormuz|hormuz'), 'Strait of Hormuz', 26.6, 56.3),
  P(W('red sea|houthis?'), 'Red Sea', 15.5, 41.5), P(W('suez'), 'Suez Canal', 30.6, 32.3), P(W('panama canal'), 'Panama Canal', 9.1, -79.7),
  P(W('north korean?'), 'North Korea', 40, 127), P(W('south korean?|korean?'), 'South Korea', 36.5, 127.8),
  P(W('saudi(?: arabia)?'), 'Saudi Arabia', 24, 45), P(W('gaza'), 'Gaza', 31.4, 34.4), P(W('israeli?'), 'Israel', 31.5, 34.9),
  P(W('iran(?:ian)?'), 'Iran', 32, 53), P(W('iraqi?'), 'Iraq', 33, 44), P(W('yemeni?'), 'Yemen', 15.5, 48), P(W('syrian?'), 'Syria', 35, 38),
  P(W('lebanon|lebanese|hezbollah'), 'Lebanon', 33.9, 35.9), P(W('ukrain(?:e|ian)|kyiv'), 'Ukraine', 49, 31), P(W('russian?|moscow|kremlin'), 'Russia', 56, 38),
  P(W('taiwan(?:ese)?|tsmc'), 'Taiwan', 23.7, 121), P(W('chin(?:a|ese)|beijing'), 'China', 35, 105), P(W('japan(?:ese)?|tokyo'), 'Japan', 36, 138),
  P(W('india(?:n)?'), 'India', 21, 78), P(W('pakistani?'), 'Pakistan', 30, 70), P(W('bangladesh(?:i)?'), 'Bangladesh', 23.7, 90.4),
  P(W('vietnam(?:ese)?'), 'Vietnam', 16, 107), P(W('philippines|filipino'), 'Philippines', 13, 122), P(W('indonesian?'), 'Indonesia', -2, 118),
  P(W('australian?'), 'Australia', -25, 134), P(W('canad(?:a|ian)'), 'Canada', 56, -106), P(W('texas'), 'Texas', 31, -99),
  P(W('california'), 'California', 37, -120), P(W('florida'), 'Florida', 28, -82), P(W('mexic(?:o|an)'), 'Mexico', 23, -102),
  P(W('brazil(?:ian)?'), 'Brazil', -14, -51), P(W('argentin(?:a|e|ian)'), 'Argentina', -38, -64), P(W('chile(?:an)?'), 'Chile', -33, -71),
  P(W('venezuel(?:a|an)'), 'Venezuela', 7, -66), P(W('greenland'), 'Greenland', 72, -40), P(W('rotterdam|netherlands|dutch'), 'Netherlands', 52, 5),
  P(W('germany|german'), 'Germany', 51, 10), P(W('france|french'), 'France', 46, 2), P(W('italy|italian'), 'Italy', 42.5, 12.5),
  P(W('spain|spanish'), 'Spain', 40, -4), P(W('turkey|turkish'), 'Turkey', 39, 35), P(W('egypt(?:ian)?'), 'Egypt', 26.8, 30.8),
  P(W('nigerian?'), 'Nigeria', 9, 8), P(W('south africa(?:n)?'), 'South Africa', -29, 24), P(W('britain|british|england|london'), 'UK', 52.5, -1.5),
  P(/\bUK\b/, 'UK', 52.5, -1.5), P(W('europe(?:an)?|eurozone'), 'Europe', 50, 10), P(/\b(?:US|USA|U\.S\.)(?=[\s,.]|$)|\bunited states\b|\bamerican?\b|\bwashington\b/i, 'United States', 39, -98),
];

export function findPlace(text) {
  const t = String(text || '');
  const hit = PLACES.find((p) => p.re.test(t));
  return hit ? { region: hit.region, lat: hit.lat, lng: hit.lng } : null;
}

export const quakeSeverity = (m) => (m >= 7.8 ? 5 : m >= 7 ? 4 : m >= 6.5 ? 3 : m >= 6 ? 2 : 1);
export const stormSeverity = (mph) => (mph >= 130 ? 5 : mph >= 111 ? 4 : mph >= 74 ? 3 : mph >= 50 ? 2 : 1);

// Region boxes for physical events (quakes, storms): [latMin, latMax, lngMin, lngMax]
const REGION_IMPACTS = [
  { box: [21, 26.5, 119, 123], sectors: [{ s: 'Semiconductors', d: -1, why: 'Taiwan makes most of the world\'s advanced chips' }] },
  { box: [30, 46, 129, 146], sectors: [{ s: 'Semiconductors', d: -1, why: 'Japanese chip and parts factories' }, { s: 'Shipping & freight', d: 0, why: 'Japanese ports' }] },
  { box: [18, 31, -98, -80], sectors: [{ s: 'Energy', d: 0, why: 'Gulf of Mexico oil rigs and refineries may shut' }] },
  { box: [23, 30.5, 47, 57], sectors: [{ s: 'Energy', d: 1, why: 'Persian Gulf oil supply' }] },
  { box: [-45, -17, -76, -66], sectors: [{ s: 'Agriculture', d: 0, why: 'Chilean copper and farm exports' }] },
];
export function regionImpacts(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return [];
  return REGION_IMPACTS.filter(({ box: [a, b, c, d] }) => lat >= a && lat <= b && lng >= c && lng <= d).flatMap((r) => r.sectors);
}

export const CHAINS = {
  war: ['Fighting or threats raise risk on nearby supply routes', 'Governments lift defense spending and resupply orders', 'A ceasefire can reverse the move quickly'],
  energy: ['Fuel prices change costs for airlines, truckers and shippers', 'Higher fuel squeezes household spending; lower fuel frees it up', 'Energy prices feed into inflation and interest-rate expectations'],
  weather: ['Damage and shutdowns hit local business and transport', 'Insurers and reinsurers absorb the claims', 'Supply delays can ripple to factories far away'],
  tech: ['New tech shifts spending toward chips, cloud and power', 'Winners and losers can swing fast on hype', 'Data centers need electricity, which pulls in utilities'],
  markets: ['Rates and policy changes move bank stocks, property and the dollar', 'Trade costs flow through to shipping and store prices', 'Risk appetite shifts money between growth and defensive stocks'],
};

// d: 1 up, -1 down, 0 mixed, '+' follows headline sentiment, '-' inverse of sentiment
const RULES = [
  { cat: 'energy', sev: 2, re: W('oil|crude|opec\\+?|brent|natural gas|lng|refiner(?:y|ies)|pipelines?|gasoline|petrol|fuel prices'),
    sectors: [{ s: 'Energy', d: '+', why: 'Producers earn more when prices rise' }, { s: 'Travel & airlines', d: '-', why: 'Fuel is a top cost' }] },
  { cat: 'war', sev: 3, strip: /\b(?:trade|price|bidding|talent|culture|turf|fare|tariff|chip|streaming|subsidy|currency)[- ]wars?\b/gi, re: W('air ?strikes?|missiles?|invasion|invade[sd]?|troops|shelling|drone (?:attack|strike)s?|military|war|artillery|bombing|bombed|coup|insurgents?'),
    sectors: [{ s: 'Defense', d: 1, why: 'Higher military spending' }, { s: 'Insurance', d: -1, why: 'War-risk claims and repricing' }] },
  { cat: 'weather', sev: 2, re: W('heat ?waves?|record heat'),
    sectors: [{ s: 'Utilities & power', d: 1, why: 'Air-conditioning demand' }, { s: 'Agriculture', d: 0, why: 'Heat stress on crops' }] },
  { cat: 'weather', sev: 2, re: W('hurricanes?|typhoons?|cyclones?|floods?|flooding|droughts?|wildfires?|earthquakes?|tsunami|blizzards?|landslides?|volcano(?:es)?|(?:tropical|winter|severe|ice|dust|snow|thunder|hail) ?storms?|storm surge|storms? (?:hits?|batters?|lash(?:es)?|slams?|pound(?:s)?|sweeps?|makes landfall|warnings?)'), also: /\bStorm [A-Z][a-z]+\b(?! over)/,
    sectors: [{ s: 'Insurance', d: -1, why: 'Property and business claims' }, { s: 'Agriculture', d: 0, why: 'Crop and supply disruption' }] },
  { cat: 'tech', sev: 2, also: /\bAI\b/, re: W('artificial intelligence|microchips?|chipmakers?|chip (?:makers?|industry|exports?|shortage|plants?|factor(?:y|ies)|stocks|giants?|ban)|semiconductors?|data cent(?:er|re)s?|quantum|robots?|robotics|nvidia|tsmc|openai|anthropic'),
    sectors: [{ s: 'Semiconductors', d: '+', why: 'Chip demand' }, { s: 'Cloud & software', d: '+', why: 'AI and software spending' }] },
  { cat: 'tech', sev: 2, re: W('cyber ?attacks?|hack(?:ed|ers?)|ransomware|outages?'),
    sectors: [{ s: 'Cloud & software', d: 0, why: 'Security spending up, victims hurt' }] },
  { cat: 'markets', sev: 3, re: W('rate cuts?|cuts? (?:interest )?rates'), sectors: [{ s: 'Banks & rate-sensitive', d: 1, why: 'Cheaper borrowing helps property and small caps' }] },
  { cat: 'markets', sev: 3, re: W('rate (?:hikes?|rises?|increases?)|raises? (?:interest )?rates'), sectors: [{ s: 'Banks & rate-sensitive', d: -1, why: 'Costlier borrowing weighs on property and lenders' }] },
  { cat: 'markets', sev: 3, re: W('tariffs?|trade war|export controls?|sanctions'),
    sectors: [{ s: 'Shipping & freight', d: -1, why: 'Less trade volume' }, { s: 'Consumer discretionary', d: -1, why: 'Imported goods cost more' }] },
  { cat: 'markets', sev: 2, re: W('ports?|shipping|freight|container ships?|dock workers?|canal'),
    sectors: [{ s: 'Shipping & freight', d: 0, why: 'Disruption raises rates but cuts volume' }] },
  { cat: 'markets', sev: 2, re: W('inflation|recession|jobs report|unemployment|gdp|stocks?|shares|stock market|ipo|bankrupt(?:cy)?|central bank|interest rates?'),
    sectors: [{ s: 'Banks & rate-sensitive', d: '+', why: 'Sensitive to growth and rates' }] },
];

const UP = W('surges?|soars?|jumps?|rall(?:y|ies)|record high|booms?|beats?|rises?|climbs?|gains?|hits record');
const DOWN = W('plunges?|slumps?|crash(?:es)?|falls?|drops?|slides?|tumbles?|sinks?|bans?|halts?|shortage');
const STRONG = W('record|surges?|soars?|plunges?|crash(?:es)?|jumps?|invasion|war|massive|biggest|emergency|collapse');

export function classifyHeadline(text) {
  const t = String(text || '');
  const hits = RULES.filter((r) => {
    const text = r.strip ? t.replace(r.strip, ' ') : t;
    return r.re.test(text) || (r.also ? r.also.test(text) : false);
  });
  if (!hits.length) return null;
  const mood = UP.test(t) ? 1 : DOWN.test(t) ? -1 : 0;
  const resolve = (d) => (d === '+' ? mood : d === '-' ? -mood : d);
  const seen = new Set();
  const sectors = [];
  for (const r of hits) for (const s of r.sectors) {
    if (seen.has(s.s)) continue;
    seen.add(s.s);
    sectors.push({ s: s.s, d: resolve(s.d) || 0, why: s.why });
  }
  const primary = hits[0];
  const sev = Math.min(5, Math.max(...hits.map((h) => h.sev)) + (STRONG.test(t) ? 1 : 0));
  return { cat: primary.cat, sev, sectors, chain: CHAINS[primary.cat], place: findPlace(t) };
}
