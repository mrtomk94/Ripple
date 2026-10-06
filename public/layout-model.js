// Layout rules shared by the page (edit mode) and the tests. Pure functions:
// every change returns a new layout object.
export const PANELS = ['map', 'pressure', 'latest', 'voices', 'watch', 'options', 'dash', 'board'];
export const WIDTHS = ['half', 'full'];
export const DEFAULT_LAYOUT = Object.freeze({
  version: 1,
  order: [...PANELS],
  width: { map: 'half', pressure: 'half', latest: 'half', voices: 'half', watch: 'half', options: 'half', dash: 'full', board: 'full' },
  hidden: [],
});

const clone = (l) => ({ version: 1, order: [...l.order], width: { ...l.width }, hidden: [...l.hidden] });

export function normalize(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const order = [];
  for (const id of Array.isArray(s.order) ? s.order : []) if (PANELS.includes(id) && !order.includes(id)) order.push(id);
  for (const id of DEFAULT_LAYOUT.order) if (!order.includes(id)) order.push(id);
  const width = {};
  for (const id of PANELS) width[id] = WIDTHS.includes(s.width?.[id]) ? s.width[id] : DEFAULT_LAYOUT.width[id];
  let hidden = (Array.isArray(s.hidden) ? s.hidden : []).filter((id, i, a) => PANELS.includes(id) && a.indexOf(id) === i);
  if (hidden.length >= PANELS.length) hidden = hidden.slice(0, PANELS.length - 1);
  return { version: 1, order, width, hidden };
}

export function moveTo(layout, id, index) {
  if (!layout.order.includes(id)) return layout;
  const l = clone(layout);
  l.order.splice(l.order.indexOf(id), 1);
  l.order.splice(Math.max(0, Math.min(index, l.order.length)), 0, id);
  return l;
}

export const moveBy = (layout, id, delta) => moveTo(layout, id, layout.order.indexOf(id) + delta);

export function setWidth(layout, id, width) {
  if (!PANELS.includes(id) || !WIDTHS.includes(width)) return layout;
  const l = clone(layout);
  l.width[id] = width;
  return l;
}

export function toggleHidden(layout, id) {
  if (!PANELS.includes(id)) return layout;
  const l = clone(layout);
  l.hidden = l.hidden.includes(id) ? l.hidden.filter((x) => x !== id) : [...l.hidden, id];
  return normalize(l);
}

export const serialize = (layout) => JSON.stringify(normalize(layout), null, 2);
