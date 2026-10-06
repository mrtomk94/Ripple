// Minimal, dependency-free RSS/Atom reader. Feeds are untrusted text: we only
// extract leaf element text and never evaluate anything.
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeText(raw) {
  return String(raw)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
      if (code[0] !== '#') return NAMED[code.toLowerCase()] ?? m;
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export const MAX_ITEMS = 500;

// Linear scan for <item>/<entry> blocks: each search continues from where the
// last one ended, so a feed full of unclosed tags can't trigger rescans.
function* blocks(xml, tag) {
  const open = new RegExp(`<${tag}(?=[\\s>])`, 'g');
  const close = `</${tag}>`;
  let m;
  while ((m = open.exec(xml))) {
    const start = xml.indexOf('>', m.index);
    const end = start === -1 ? -1 : xml.indexOf(close, start);
    if (end === -1) return;
    yield xml.slice(start + 1, end);
    open.lastIndex = end + close.length;
  }
}
const LEAF = /<([\w:.-]+)(?:\s[^>]*)?>((?:<!\[CDATA\[[\s\S]*?\]\]>|[^<])*)<\/\1>/g;
const ATOM_LINK = /<link\b[^>]*\bhref="([^"]+)"/;

export function parseFeed(xml) {
  if (typeof xml !== 'string' || !xml) return [];
  const items = [];
  for (const body of [...blocks(xml, 'item'), ...blocks(xml, 'entry')]) {
    if (items.length >= MAX_ITEMS) break;
    const fields = {};
    for (const [, tag, text] of body.matchAll(LEAF)) {
      if (!(tag in fields)) fields[tag] = decodeText(text);
    }
    const atomHref = body.match(ATOM_LINK);
    items.push({
      title: fields.title ?? '',
      link: fields.link || (atomHref ? decodeText(atomHref[1]) : ''),
      pubDate: fields.pubDate || fields.updated || fields.published || fields['dc:date'] || '',
      fields,
    });
  }
  return items;
}
