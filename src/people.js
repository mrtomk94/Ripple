// People whose statements move markets. Matching is by name in headlines;
// direct X / Truth Social posts are not fetched from those platforms.
export const PEOPLE = [
  { id: 'musk', name: 'Elon Musk', role: 'CEO of Tesla and SpaceX', re: /\b(?:Elon Musk|Musk)(?:'s)?\b/, tickers: ['TSLA', 'SPCX'] },
  { id: 'trump', name: 'Donald Trump', role: 'US President', re: /\b(?:Donald Trump|President Trump|Trump)(?:'s)?\b/, tickers: ['SPY', 'DJT'] },
  { id: 'zuckerberg', name: 'Mark Zuckerberg', role: 'CEO of Meta', re: /\b(?:Mark Zuckerberg|Zuckerberg)(?:'s)?\b/, tickers: ['META'] },
];

export const peopleIn = (text) => PEOPLE.filter((p) => p.re.test(String(text || ''))).map((p) => p.id);

export const PEOPLE_CHAIN = [
  'Statements from heads of state and big-company CEOs can move their stocks within minutes',
  'Follow-through matters more than the first headline: watch for official filings or orders',
];
