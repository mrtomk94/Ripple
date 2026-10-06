// Edit-layout mode. Only appears when the address has ?edit.
// Changes save in this browser; "Export layout" makes a layout.json to publish for everyone.
import { PANELS, DEFAULT_LAYOUT, normalize, moveTo, moveBy, setWidth, toggleHidden, serialize } from './layout-model.js';

const KEY = 'ripple-layout';
const box = document.getElementById('panels');
const panel = (id) => box.querySelector(`[data-panel="${id}"]`);
const canEdit = new URLSearchParams(location.search).has('edit');
let layout = normalize(DEFAULT_LAYOUT);
let published = layout;

function readLocal() {
  try { const raw = localStorage.getItem(KEY); return raw ? normalize(JSON.parse(raw)) : null; } catch { return null; }
}
function save() {
  try { localStorage.setItem(KEY, serialize(layout)); } catch { /* storage off: layout lasts for this visit */ }
}

function apply() {
  for (const id of layout.order) {
    const el = panel(id);
    if (!el) continue;
    box.appendChild(el);
    el.dataset.w = layout.width[id];
    if (layout.hidden.includes(id)) el.dataset.hidden = ''; else delete el.dataset.hidden;
    const bar = el.querySelector('.editbar');
    if (bar) {
      bar.querySelector('[data-act="width"]').textContent = layout.width[id] === 'full' ? 'Make half' : 'Make full';
      bar.querySelector('[data-act="hide"]').textContent = layout.hidden.includes(id) ? 'Show' : 'Hide';
    }
  }
}

function update(next) { layout = next; apply(); save(); }

function addBars() {
  for (const id of PANELS) {
    const el = panel(id);
    if (!el || el.querySelector('.editbar')) continue;
    const bar = document.createElement('div');
    bar.className = 'editbar';
    bar.innerHTML = `<span class="grip" role="button" tabindex="-1" aria-label="Drag to move ${el.dataset.title}">⠿</span>
      <span class="et">${el.dataset.title}</span>
      <button data-act="up" aria-label="Move ${el.dataset.title} up">↑</button>
      <button data-act="down" aria-label="Move ${el.dataset.title} down">↓</button>
      <button data-act="width"></button>
      <button data-act="hide"></button>`;
    el.prepend(bar);
    bar.addEventListener('click', (e) => {
      const act = e.target.closest('button')?.dataset.act;
      if (act === 'up') update(moveBy(layout, id, -1));
      if (act === 'down') update(moveBy(layout, id, 1));
      if (act === 'width') update(setWidth(layout, id, layout.width[id] === 'full' ? 'half' : 'full'));
      if (act === 'hide') update(toggleHidden(layout, id));
      if (act === 'up' || act === 'down') el.scrollIntoView({ block: 'nearest' });
    });
    startDrag(bar.querySelector('.grip'), id);
  }
}

// Pointer-event drag: works with mouse, pen and touch.
function startDrag(grip, id) {
  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    const el = panel(id);
    el.classList.add('dragging');
    document.body.classList.add('dragging-active');
    let timer = null;
    const move = (ev) => {
      const edge = 70;
      clearInterval(timer);
      if (ev.clientY < edge || ev.clientY > innerHeight - edge) {
        const dir = ev.clientY < edge ? -14 : 14;
        timer = setInterval(() => scrollBy(0, dir), 16);
      }
      grip.style.visibility = 'hidden';
      const under = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-panel]');
      grip.style.visibility = '';
      if (!under || under === el) return;
      const r = under.getBoundingClientRect();
      const halfWide = r.width < box.getBoundingClientRect().width * 0.75;
      const before = halfWide ? ev.clientX < r.left + r.width / 2 : ev.clientY < r.top + r.height / 2;
      const rest = layout.order.filter((x) => x !== id);
      const t = rest.indexOf(under.dataset.panel);
      const index = before ? t : t + 1;
      if (layout.order.indexOf(id) !== index) update(moveTo(layout, id, index));
    };
    const end = () => {
      clearInterval(timer);
      el.classList.remove('dragging');
      document.body.classList.remove('dragging-active');
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', end);
      grip.removeEventListener('pointercancel', end);
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  });
}

function showExport() {
  const json = serialize(layout);
  const wrap = document.createElement('div');
  wrap.className = 'exportbox';
  wrap.innerHTML = `<div class="inner" role="dialog" aria-modal="true" aria-labelledby="exh">
    <h2 id="exh" style="margin-top:0">Publish this layout for everyone</h2>
    <ol>
      <li>Click <b>Download layout.json</b>.</li>
      <li>On GitHub, open your repo, then the <b>public</b> folder.</li>
      <li>Click <b>Add file</b>, then <b>Upload files</b>, drop in <b>layout.json</b> (replace the old one), and commit.</li>
    </ol>
    <textarea readonly aria-label="Layout file">${json.replace(/</g, '&lt;')}</textarea>
    <div class="row">
      <button class="btn" data-x="dl">Download layout.json</button>
      <button class="ghost" data-x="copy">Copy</button>
      <button class="ghost" data-x="close">Close</button>
      <span class="status" data-x="msg"></span>
    </div></div>`;
  document.body.appendChild(wrap);
  const msg = wrap.querySelector('[data-x="msg"]');
  wrap.addEventListener('click', async (e) => {
    const x = e.target.dataset.x;
    if (x === 'close' || e.target === wrap) wrap.remove();
    if (x === 'dl') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = 'layout.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    if (x === 'copy') {
      try { await navigator.clipboard.writeText(json); msg.textContent = 'Copied.'; } catch { wrap.querySelector('textarea').select(); msg.textContent = 'Press Ctrl+C to copy.'; }
    }
  });
  wrap.querySelector('[data-x="dl"]').focus();
}

function tools() {
  const t = document.createElement('div');
  t.className = 'edittools';
  t.setAttribute('role', 'toolbar');
  t.setAttribute('aria-label', 'Layout editor');
  document.body.appendChild(t);
  const render = () => {
    const on = document.body.classList.contains('editing');
    t.innerHTML = on
      ? `<span class="msg">Editing layout. Drag ⠿ to move. Changes save in this browser.</span>
         <button data-t="export">Export layout</button><button data-t="reset">Reset</button><button data-t="done">Done</button>`
      : '<button data-t="edit">Edit layout</button>';
  };
  t.addEventListener('click', (e) => {
    const a = e.target.dataset.t;
    if (a === 'edit') { document.body.classList.add('editing'); addBars(); apply(); }
    if (a === 'done') document.body.classList.remove('editing');
    if (a === 'reset' && confirm('Go back to the published layout? Your changes in this browser will be cleared.')) {
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      layout = published; apply();
    }
    if (a === 'export') showExport();
    render();
  });
  render();
}

async function init() {
  try {
    const r = await fetch('layout.json', { cache: 'no-store' });
    if (r.ok) published = normalize(await r.json());
  } catch { /* use the built-in default */ }
  layout = (canEdit && readLocal()) || published;
  apply();
  if (canEdit) tools();
}
init();
