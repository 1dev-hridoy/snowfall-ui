/**
 * demo/app.js — playground logic for whiteout.
 *
 * Imports the built ESM bundle from ../dist, so run `npm run build` first.
 * Everything here is plain DOM: no framework, no build step for the demo.
 */
import {
  createSnowfall,
  PRESETS,
  DEFAULTS,
  SNOW_TYPES,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
  toSnippet,
  emojiFlake,
} from '../dist/index.js';

const $ = (id) => document.getElementById(id);

/**
 * Presets are partial configs. Resolve them against DEFAULTS so the panel shows
 * what the engine is actually using, not the slider minimum for unset keys.
 */
const resolve = (type) => ({ ...DEFAULTS, ...PRESETS[type] });

/* ── state ──────────────────────────────────────────────────────────────── */
const START = 'realistic';
let state = resolve(START);
let activeType = START;
let paused = false;

const stage = $('stage');

/* ── main stage ─────────────────────────────────────────────────────────── */
const snow = createSnowfall(stage, { ...state, interactive: true, mouseMode: 'repel' });

let fps = 0;
const frameHandler = (s) => {
  fps = s.fps;
  $('count-pill').innerHTML = `<b>${s.particles}</b> flakes`;
};
snow.update({ onFrame: frameHandler });

// Read the FPS number at a calmer cadence than the frame loop.
setInterval(() => {
  $('fps-pill').innerHTML = `<b>${paused ? 0 : fps}</b> fps`;
}, 500);

/* ── toast ──────────────────────────────────────────────────────────────── */
let toastTimer = 0;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 1600);
}

/* ── gallery: every preset rendered live in its own tiny canvas ─────────── */
const gallery = $('gallery');
const tiles = new Map();

for (const type of SNOW_TYPES) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'tile';
  tile.setAttribute('aria-pressed', String(type === activeType));
  tile.title = PRESET_DESCRIPTIONS[type];
  tile.dataset.type = type;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  tile.appendChild(canvas);

  const cap = document.createElement('span');
  cap.className = 'cap';
  const name = document.createElement('span');
  name.textContent = PRESET_LABELS[type];
  const num = document.createElement('span');
  num.className = 'n';
  num.textContent = String(PRESETS[type].count);
  cap.append(name, num);
  tile.appendChild(cap);

  tile.addEventListener('click', () => loadPreset(type));
  gallery.appendChild(tile);
  tiles.set(type, tile);

  // Thumbnails run the real engine at reduced density. Ten of them is cheap,
  // and it means a preview can never drift from the actual renderer.
  createSnowfall(tile, {
    ...PRESETS[type],
    count: Math.max(14, Math.round(PRESETS[type].count * 0.16)),
    interactive: false,
    pauseWhenOffscreen: true,
    pixelRatio: 1.5,
    zIndex: 1,
  });
  canvas.style.position = 'absolute';
  canvas.style.pointerEvents = 'none';
}

/* ── control schema ─────────────────────────────────────────────────────── */
const RANGE = (key, label, min, max, step, unit = '') => ({
  kind: 'range', key, label, min, max, step, unit,
});
const BOOL = (key, label) => ({ kind: 'bool', key, label });

const SCHEMA = [
  {
    title: 'Amount',
    items: [
      RANGE('count', 'Flake count', 0, 900, 1),
      RANGE('minSize', 'Smallest flake', 0, 24, 0.5, 'px'),
      RANGE('maxSize', 'Largest flake', 0, 40, 0.5, 'px'),
    ],
  },
  {
    title: 'Motion',
    items: [
      RANGE('minSpeed', 'Slowest fall', 0, 400, 5, 'px/s'),
      RANGE('maxSpeed', 'Fastest fall', 0, 600, 5, 'px/s'),
      RANGE('wind', 'Wind', -300, 300, 5, 'px/s'),
      RANGE('gust', 'Gust swell', 0, 200, 5, 'px/s'),
      RANGE('gustSpeed', 'Gust period', 1, 20, 0.5, 's'),
      RANGE('sway', 'Sway width', 0, 140, 1, 'px'),
      RANGE('swaySpeed', 'Sway rate', 0, 5, 0.1),
    ],
  },
  {
    title: 'Surface',
    items: [
      { kind: 'color', key: 'color', label: 'Flake color' },
      { kind: 'palette', key: 'colors', label: 'Palette' },
      { kind: 'color', key: 'glowColor', label: 'Glow color' },
      RANGE('blur', 'Glow blur', 0, 40, 1, 'px'),
      RANGE('opacity', 'Opacity', 0, 1, 0.01),
      BOOL('rotation', 'Rotate flakes'),
      RANGE('minRotationSpeed', 'Spin, min', -6, 0, 0.1),
      RANGE('maxRotationSpeed', 'Spin, max', 0, 6, 0.1),
      BOOL('parallax', 'Depth parallax'),
      BOOL('flicker', 'Flicker'),
      RANGE('flickerSpeed', 'Flicker rate', 0, 14, 0.1),
    ],
  },
  {
    title: 'Pointer',
    items: [
      BOOL('interactive', 'React to pointer'),
      {
        kind: 'seg',
        key: 'mouseMode',
        label: 'Mode',
        options: [
          { v: 'repel', t: 'repel' },
          { v: 'attract', t: 'attract' },
          { v: 'trail', t: 'trail' },
        ],
      },
      RANGE('mouseRadius', 'Radius', 0, 400, 5, 'px'),
      RANGE('mouseForce', 'Force', 0, 5, 0.1),
    ],
  },
  {
    title: 'Performance',
    items: [
      RANGE('fps', 'Frame cap', 0, 120, 1, 'fps'),
      RANGE('pixelRatio', 'Pixel ratio', 1, 3, 0.5),
      BOOL('pauseWhenOffscreen', 'Pause offscreen'),
      BOOL('respectReducedMotion', 'Respect reduced motion'),
    ],
  },
  {
    title: 'Custom flake',
    items: [
      {
        kind: 'text',
        key: 'customImage',
        label: 'Image URL or data URI',
        placeholder: 'https://… or data:image/svg+xml,…',
      },
      { kind: 'emoji', label: 'Or pick an emoji' },
    ],
  },
  {
    title: 'Export',
    items: [{ kind: 'export' }],
  },
];

/* ── panel builder ──────────────────────────────────────────────────────── */
const panelBody = $('panel-body');
const inputs = new Map();

function fieldShell(labelText, key) {
  const field = document.createElement('div');
  field.className = 'field';
  const top = document.createElement('div');
  top.className = 'top';
  const label = document.createElement('label');
  label.textContent = labelText;
  if (key) label.htmlFor = `f-${key}`;
  top.appendChild(label);
  field.appendChild(top);
  return { field, top, label };
}

function fmt(value, step) {
  if (!Number.isFinite(value)) return '—';
  if (step >= 1) return String(Math.round(value));
  return value.toFixed(step < 0.1 ? 2 : 1);
}

function buildRange(item) {
  const { field, top } = fieldShell(item.label, item.key);
  const num = document.createElement('span');
  num.className = 'num';
  top.appendChild(num);

  const input = document.createElement('input');
  input.type = 'range';
  input.id = `f-${item.key}`;
  input.min = item.min;
  input.max = item.max;
  input.step = item.step;
  input.value = state[item.key] ?? item.min;

  const paint = (v) => {
    num.textContent = `${fmt(v, item.step)}${item.unit ? ' ' + item.unit : ''}`;
  };
  paint(Number(input.value));

  input.addEventListener('input', () => {
    const v = Number(input.value);
    state[item.key] = v;
    paint(v);
    apply();
  });

  field.appendChild(input);
  inputs.set(item.key, { el: input, paint, item });
  return field;
}

function buildBool(item) {
  const row = document.createElement('div');
  row.className = 'switch';

  const label = document.createElement('span');
  label.className = 'lbl';
  label.textContent = item.label;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `f-${item.key}`;
  input.checked = Boolean(state[item.key]);

  const track = document.createElement('label');
  track.className = 'track';
  track.htmlFor = input.id;

  input.addEventListener('change', () => {
    state[item.key] = input.checked;
    apply();
  });

  row.append(label, input, track);
  inputs.set(item.key, { el: input, item });
  return row;
}

function buildColor(item) {
  const { field, top } = fieldShell(item.label, item.key);

  const sw = document.createElement('span');
  sw.className = 'sw';
  const input = document.createElement('input');
  input.type = 'color';
  input.id = `f-${item.key}`;
  input.value = toHex(state[item.key]);
  sw.style.background = input.value;
  sw.appendChild(input);
  top.appendChild(sw);

  input.addEventListener('input', () => {
    state[item.key] = input.value;
    sw.style.background = input.value;
    apply();
  });

  inputs.set(item.key, { el: input, item });
  return field;
}

function buildPalette(item) {
  const { field, top } = fieldShell(item.label, item.key);
  const wrap = document.createElement('div');
  wrap.className = 'swatches';

  const render = () => {
    wrap.textContent = '';
    const list = Array.isArray(state.colors) ? state.colors : [];
    list.forEach((color, i) => {
      const sw = document.createElement('span');
      sw.className = 'sw';
      sw.style.background = color;
      sw.title = `${color} — click to change, right-click to remove`;
      const input = document.createElement('input');
      input.type = 'color';
      input.value = toHex(color);
      input.addEventListener('input', () => {
        state.colors[i] = input.value;
        sw.style.background = input.value;
        apply();
      });
      sw.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        state.colors.splice(i, 1);
        render();
        apply();
      });
      sw.appendChild(input);
      wrap.appendChild(sw);
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'sw-add';
    add.textContent = '+';
    add.title = 'Add a color';
    add.addEventListener('click', () => {
      if (!Array.isArray(state.colors)) state.colors = [];
      state.colors.push(randomColor());
      render();
      apply();
    });
    wrap.appendChild(add);
  };

  render();
  field.appendChild(wrap);
  inputs.set('colors', { render, item });
  return field;
}

function buildSeg(item) {
  const { field } = fieldShell(item.label, item.key);
  const seg = document.createElement('div');
  seg.className = 'seg';

  const buttons = item.options.map((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = opt.t;
    b.setAttribute('aria-pressed', String(state[item.key] === opt.v));
    b.addEventListener('click', () => {
      state[item.key] = opt.v;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    });
    seg.appendChild(b);
    return b;
  });

  field.appendChild(seg);
  inputs.set(item.key, { el: seg, sync: () => {
    buttons.forEach((b, i) => {
      b.setAttribute('aria-pressed', String(state[item.key] === item.options[i].v));
    });
  }, item });
  return field;
}

function buildText(item) {
  const { field } = fieldShell(item.label, item.key);
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'txt';
  input.id = `f-${item.key}`;
  input.placeholder = item.placeholder || '';
  input.value = state[item.key] || '';
  input.addEventListener('input', () => {
    state[item.key] = input.value;
    // Typing an image implies the custom renderer.
    if (input.value && state.type !== 'custom') setType('custom');
    apply();
  });
  field.appendChild(input);
  inputs.set(item.key, { el: input, item });
  return field;
}

function buildEmoji() {
  const field = document.createElement('div');
  field.className = 'field';
  const wrap = document.createElement('div');
  wrap.className = 'swatches';

  const picks = ['❄️', '🍁', '🍂', '✨', '❤️', '⭐', '🎃', '🌸', '🫧', '🎄'];
  for (const emoji of picks) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw-add';
    b.style.fontSize = '14px';
    b.textContent = emoji;
    b.title = `Use ${emoji}`;
    b.addEventListener('click', () => {
      state.customImage = emojiFlake(emoji);
      state.type = 'custom';
      const textInput = inputs.get('customImage');
      if (textInput) textInput.el.value = state.customImage;
      setType('custom');
      apply();
      toast(`${emoji} flakes`);
    });
    wrap.appendChild(b);
  }

  field.appendChild(wrap);
  return field;
}

function buildExport() {
  const field = document.createElement('div');
  field.className = 'field';

  const row = document.createElement('div');
  row.className = 'btn-row';

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'btn solid';
  copy.textContent = 'copy config';
  copy.addEventListener('click', () => copyConfig());

  const json = document.createElement('button');
  json.type = 'button';
  json.className = 'btn ghost';
  json.textContent = 'copy JSON';
  json.addEventListener('click', () => copyText(JSON.stringify(state, null, 2), 'JSON copied'));

  row.append(copy, json);

  const out = document.createElement('pre');
  out.className = 'out';
  out.id = 'config-out';

  const hint = document.createElement('p');
  hint.className = 'hintline';
  hint.innerHTML =
    '<kbd>space</kbd> pause · <kbd>r</kbd> reset · <kbd>b</kbd> burst · ' +
    '<kbd>1</kbd>–<kbd>9</kbd> presets · <kbd>shift</kbd>+<kbd>←/→</kbd> cycle';

  field.append(row, out, hint);
  return field;
}

/* ── assemble the panel ─────────────────────────────────────────────────── */
for (const group of SCHEMA) {
  const section = document.createElement('section');
  section.className = 'group';
  const h = document.createElement('h3');
  h.textContent = group.title;
  section.appendChild(h);

  for (const item of group.items) {
    let node;
    switch (item.kind) {
      case 'range': node = buildRange(item); break;
      case 'bool': node = buildBool(item); break;
      case 'color': node = buildColor(item); break;
      case 'palette': node = buildPalette(item); break;
      case 'seg': node = buildSeg(item); break;
      case 'text': node = buildText(item); break;
      case 'emoji': node = buildEmoji(); break;
      case 'export': node = buildExport(); break;
      default: continue;
    }
    section.appendChild(node);
  }
  panelBody.appendChild(section);
}

/* ── sync + apply ───────────────────────────────────────────────────────── */
function syncControls() {
  for (const [key, entry] of inputs) {
    if (entry.sync) { entry.sync(); continue; }
    if (entry.render) { entry.render(); continue; }
    const { el, item, paint } = entry;
    if (!el || !item) continue;

    const value = state[key];
    if (item.kind === 'bool') el.checked = Boolean(value);
    else if (item.kind === 'color') {
      el.value = toHex(value);
      if (el.parentElement) el.parentElement.style.background = el.value;
    } else if (item.kind === 'text') el.value = value || '';
    else if (item.kind === 'range') {
      el.value = value ?? item.min;
      if (paint) paint(Number(el.value));
    }
  }
}

function apply() {
  // `type` must travel with the config so the engine swaps renderers.
  // `onFrame` is re-attached explicitly: `state` carries `onFrame: undefined`
  // from DEFAULTS, and spreading it would wipe the live callback.
  snow.update({ ...state, type: state.type || activeType, onFrame: frameHandler });
  syncPresetUI();
  const out = $('config-out');
  if (out) out.textContent = toSnippet(state);
}

function syncPresetUI() {
  for (const [type, tile] of tiles) {
    tile.setAttribute('aria-pressed', String(type === activeType));
  }
  const label = PRESET_LABELS[activeType] || 'Custom';
  $('panel-title').textContent = label;
  // Keep the kicker short; the full description lives on the tile tooltip.
  $('stage-kicker').textContent = `preset · ${label.toLowerCase()}`;
  $('stage-line').innerHTML = `${label} <i>snow</i>`;
}

/* ── preset switching ───────────────────────────────────────────────────── */
function setType(type) {
  activeType = type;
  state.type = type;
}

function loadPreset(type) {
  state = resolve(type);
  setType(type);
  syncControls();
  apply();
  toast(`${PRESET_LABELS[type]} preset`);
}

function resetCurrent() {
  loadPreset(activeType);
}

/* ── clipboard ──────────────────────────────────────────────────────────── */
async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    // Clipboard API needs a secure context; fall back to a selection copy.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(message);
    } catch {
      toast('copy blocked by browser');
    }
    ta.remove();
  }
}

function copyConfig() {
  const snippet =
    `import { createSnowfall } from 'whiteout';\n\n` +
    `createSnowfall('#scene', ${toSnippet(state)});\n`;
  copyText(snippet, 'config copied');
}

/* ── HUD buttons ────────────────────────────────────────────────────────── */
const pauseBtn = $('btn-pause');
pauseBtn.addEventListener('click', () => togglePause());

function togglePause() {
  paused = !paused;
  if (paused) snow.pause();
  else snow.resume();
  pauseBtn.setAttribute('aria-pressed', String(paused));
  pauseBtn.textContent = paused ? 'resume' : 'pause';
  $('fps-pill').innerHTML = `<b>${paused ? 0 : fps}</b> fps`;
}

$('btn-burst').addEventListener('click', () => burst());
$('btn-reset').addEventListener('click', () => resetCurrent());

/** Re-seed the field: drop the current particles and respawn from the top. */
function burst() {
  const n = state.count ?? 150;
  snow.update({ count: 0 });
  requestAnimationFrame(() => {
    snow.update({ count: n });
  });
  toast('field flushed');
}

/* ── keyboard ───────────────────────────────────────────────────────────── */
window.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  if (e.code === 'Space') { e.preventDefault(); togglePause(); return; }
  if (e.key === 'r' || e.key === 'R') { resetCurrent(); return; }
  if (e.key === 'b' || e.key === 'B') { burst(); return; }

  const idx = Number(e.key);
  if (Number.isInteger(idx) && idx >= 1 && idx <= 9 && SNOW_TYPES[idx - 1]) {
    loadPreset(SNOW_TYPES[idx - 1]);
    return;
  }

  if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault();
    const i = SNOW_TYPES.indexOf(activeType);
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + SNOW_TYPES.length) % SNOW_TYPES.length;
    loadPreset(SNOW_TYPES[next]);
  }
});

/* ── helpers ────────────────────────────────────────────────────────────── */
function toHex(color) {
  if (typeof color !== 'string') return '#ffffff';
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return '#' + color.slice(1).split('').map((c) => c + c).join('');
  }
  const m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) {
    const hex = (n) => Number(n).toString(16).padStart(2, '0');
    return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
  }
  return '#ffffff';
}

function randomColor() {
  const palette = ['#ff5d8f', '#ffd166', '#5ce1e6', '#a78bfa', '#7bed9f', '#ff9f68', '#ffffff'];
  return palette[Math.floor(Math.random() * palette.length)];
}

/* ── boot ───────────────────────────────────────────────────────────────── */
syncControls();
apply();
