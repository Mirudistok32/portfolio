/**
 * Живность пейзажа. Спрайты — строки пикселей, каждый кадр рисуются в живые холсты слоёв:
 * дальний (стая на гребне, летучие мыши), средний (мельница, дым, окна), передний (сова, стадо
 * с пастухом, ёжик, петух, пчёлы, бабочки) и экранный (журавли, голубь, вспугнутые птицы).
 * Кто виден, решает время суток: сова и мыши ночью, ёжик и журавли на рассвете, пчёлы и бабочки днём,
 * стадо и голубь днём и на закате. Таблица «зверь → время суток» — в tests/unit/fauna.test.ts.
 */

import { type Box, type Ctx, type Dims, type Geo, OFF, type Pt, S } from './draw';

type Rows = readonly string[];
type Pal = Readonly<Record<string, string>>;

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Layer = 'far' | 'mid' | 'fore' | 'fx';

/** Время года по календарю посетителя; ?season=winter и т. п. — посмотреть другое. */
export function season(): Season {
  const q = new URLSearchParams(location.search).get('season');
  if (q === 'winter' || q === 'spring' || q === 'summer' || q === 'autumn') return q;
  const m = new Date().getMonth();
  return m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
}

export interface Live {
  t: number;
  tod: number;
  night: number;
  dawn: number;
  day: number;
  dusk: number;
}

export interface LiveCtx {
  far: Ctx;
  mid: Ctx;
  fore: Ctx;
  fx: Ctx;
}

/** Тайник на звере: box в координатах холста своего слоя, null — зверя сейчас не видно. */
export interface Hit {
  id: string;
  layer: Layer;
  box: Box | null;
}

export interface Fauna {
  hits: readonly Hit[];
  reset: (d: Dims, geo: Geo, ew: number, eh: number) => void;
  setPage: (page: number, t: number, first: boolean) => void;
  /** Курсор в координатах переднего холста. */
  pointer: (p: Pt | null) => void;
  frame: (L: Live, c: LiveCtx) => void;
  poke: (id: string, t: number) => void;
  howl: (t: number) => void;
}

/* ---------- спрайты: смотрят вправо, «.» — прозрачно ---------- */

const OWL: Rows = ['t...t', 'bbbbb', 'bbbbb', 'bbbbb', 'bcccb', 'bcccb', '.f.f.'];
const OWL_WINGS: Rows = [
  '..t...t..',
  '..bbbbb..',
  '.bbbbbbb.',
  'bbbbbbbbb',
  'b.bcccb.b',
  '..bcccb..',
  '...f.f...',
];
const OWL_PAL: Pal = { t: '#4A3B4F', b: '#4A3B4F', c: '#7A6670', f: '#D99A3A' };

const WOLF_HOWL: Rows = [
  '......r.',
  '...r.rk.',
  '...rkkk.',
  '...kkk..',
  '..rkkk..',
  '.rkkkk..',
  'rkkkkk..',
  'kk.k.k..',
];
const WOLF_SIT: Rows = [
  '........',
  '....r...',
  '...rkrrr',
  '...kkkkk',
  '..rkkk..',
  '.rkkkk..',
  'rkkkkk..',
  'kk.k.k..',
];
const WOLF_PAL: Pal = { k: '#0B0818', r: '#5E6496' };

const BAT: Rows[] = [
  ['k...k', '.kkk.'],
  ['.kkk.', 'k...k'],
];
const BAT_PAL: Pal = { k: '#06040A' };

const COW_TOP = {
  stand: [
    '.........h.h',
    '.........wkw',
    '.wwwkkwwwwww',
    'wwkkkwwwkwpp',
    'wkkwwwwwww..',
    '.wwwwwwwww..',
  ],
  graze: [
    '............',
    '............',
    '.wwwkkwwww..',
    'wwkkkwwwkwh.',
    'wkkwwwwwwwkw',
    '.wwwwwwwwwpp',
  ],
  look: [
    '........h..h',
    '........wkkw',
    '.wwwkkwwwwww',
    'wwkkkwwwwppw',
    'wkkwwwwwww..',
    '.wwwwwwwww..',
  ],
};
const COW_LEGS: Rows[] = [
  ['..d.pd..d.d.', '..d..d..d.d.'],
  ['..d.pd..d.d.', '.d...d.d...d'],
];
type Pose = keyof typeof COW_TOP;
/** Поза × шаг: голова и туловище сверху, ноги снизу. */
const withLegs = (top: Rows) => COW_LEGS.map((l) => [...top, ...l]);
const COW: Record<Pose, Rows[]> = {
  stand: withLegs(COW_TOP.stand),
  graze: withLegs(COW_TOP.graze),
  look: withLegs(COW_TOP.look),
};
const COW_BW: Pal = {
  w: '#F2EEE6',
  k: '#2E2824',
  p: '#E59A9A',
  h: '#E6D9B8',
  d: '#4A3F36',
  t: '#2E2824',
};
const COW_BROWN: Pal = {
  w: '#A9683A',
  k: '#F2EEE6',
  p: '#E59A9A',
  h: '#E6D9B8',
  d: '#4A2F1E',
  t: '#4A2F1E',
};

const SHEP: Rows[] = [
  ['.hh..', 'hhhh.', '.ff.s', 'rrr.s', 'rrrrs', 'rrr.s', '.bb.s', '.b.bs', '.k.k.'],
  ['.hh..', 'hhhh.', '.ff.s', 'rrr.s', 'rrrrs', 'rrr.s', '.bb.s', '..bbs', '..kk.'],
];
const SHEP_PIPE: Rows = [
  '.hh..',
  'hhhh.',
  '.ffpp',
  'rrrr.',
  'rrr..',
  'rrr..',
  '.bb..',
  '.b.b.',
  '.k.k.',
];
const SHEP_PAL: Pal = {
  h: '#E2C268',
  f: '#F0C8A0',
  r: '#C8443A',
  b: '#3E4A6A',
  k: '#3A2A1E',
  s: '#7A5232',
  p: '#7A5232',
};
const NOTE: Rows = ['.k', '.k', 'kk'];
const NOTE_PAL: Pal = { k: '#2E2824' };

/** Ёжик с узелком на палочке: в мультфильме он несёт медвежонку малиновое варенье. */
const HOG: Rows[] = [
  [
    'uxu.......',
    'uuu.......',
    '..l.......',
    '...ls.s...',
    '...sSsSs..',
    '..sssssfe.',
    '..ssssfffn',
    '...f..f...',
  ],
  [
    'uxu.......',
    'uuu.......',
    '..l.......',
    '...ls.s...',
    '...sSsSs..',
    '..sssssfe.',
    '..ssssfffn',
    '....f..f..',
  ],
];
const HOG_CURL: Rows = ['....s.s...', '...sSsSs..', '..sssssss.', '..sSsSsss.', '...sssss..'];
const HOG_PAL: Pal = {
  s: '#5E5048',
  S: '#8A7A68',
  f: '#D9B48A',
  e: '#1A1412',
  n: '#1A1412',
  u: '#F2EEE6',
  x: '#C8443A',
  l: '#7A5232',
};

const ROOSTER: Rows[] = [
  ['...rr.', 't..hhy', 'tt.bhw', 'ttbbb.', '.tbbb.', '..y.y.'],
  ['....rr', 't..hhy', 'tt.bh.', 'ttbbb.', '.tbbb.', '..y.y.'],
];
const ROOSTER_PAL: Pal = {
  r: '#E0402E',
  h: '#F0B060',
  y: '#F2C84A',
  w: '#E0402E',
  b: '#B5502E',
  t: '#24382C',
};

const MOTH: Rows[] = [
  ['w.w', 'wbw'],
  ['.w.', '.b.'],
];
const MOTH_COLORS = ['#F5F1EA', '#F2D04A', '#E8823A', '#7FB2F0'];

/** Журавль издалека — галочка: крылья вверх, вровень, вниз, вровень. */
const CRANE: Rows[] = [
  ['k.....k', '.k...k.', '..kkk..'],
  ['.......', 'kk...kk', '..kkk..'],
  ['.......', '..kkk..', 'kk...kk'],
  ['.......', 'kk...kk', '..kkk..'],
];
/** Снизу журавлей подсвечивает восходящее солнце: светлые на тёмном верху неба. */
const CRANE_PAL: Pal = { k: '#F4B8C4' };

/** Голубь летит влево с письмом в клюве. */
const PIGEON: Rows[] = [
  ['..ww...', '..www..', 'ehbbbtt', 'E......'],
  ['.......', 'ehbbbtt', '..www..', 'E.ww...'],
];
const PIGEON_BARE = PIGEON.map((f) => f.map((r) => r.replace(/[eE]/g, '.')));
const PIGEON_PAL: Pal = {
  h: '#6E7891',
  b: '#A3ACBF',
  t: '#6E7891',
  w: '#E3E7EF',
  e: '#F7F3EA',
  E: '#C8443A',
};
const LETTER: Rows = ['eee', 'eEe'];

const BIRD: Rows[] = [
  ['k...k', '.k.k.', '..k..'],
  ['.....', 'kk.kk', '..k..'],
];
const BIRD_PAL: Pal = { k: '#241C2E' };

const MILL_PAL: Pal = { a: '#5A3E2A', s: '#E8E0CC' };

/* ---------- рисование ---------- */

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - (1 - p) ** 2;

/** Ночной оттенок, к которому темнеют спрайты. */
const DUSK = [16, 12, 27];
const tinted = new WeakMap<Pal, Map<number, Pal>>();

/** Палитра при освещённости lum: 1 — день, 0 — ночной силуэт. */
function shade(pal: Pal, lum: number): Pal {
  const q = Math.round(clamp(lum) * 16);
  if (q === 16) return pal;
  let byQ = tinted.get(pal);
  if (!byQ) tinted.set(pal, (byQ = new Map()));
  let out = byQ.get(q);
  if (!out) {
    const o: Record<string, string> = {};
    for (const k in pal) {
      const n = parseInt(pal[k].slice(1), 16);
      const ch = (sh: number, i: number) =>
        Math.round(DUSK[i] + (((n >> sh) & 255) - DUSK[i]) * (q / 16));
      o[k] = `rgb(${ch(16, 0)},${ch(8, 1)},${ch(0, 2)})`;
    }
    byQ.set(q, (out = o));
  }
  return out;
}

/** Спрайт ногами в точку: x — середина, y — нижний ряд. Возвращает занятый прямоугольник. */
function put(c: Ctx, rows: Rows, pal: Pal, x: number, y: number, s: number, flip = false): Box {
  const w = rows[0].length;
  const x0 = x - ((w * s) >> 1);
  const y0 = y - rows.length * s + 1;
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < w; i++) {
      const ch = row[flip ? w - 1 - i : i];
      if (ch === '.') continue;
      c.fillStyle = pal[ch];
      c.fillRect(x0 + i * s, y0 + j * s, s, s);
    }
  }
  return { x0, y0, x1: x0 + w * s, y1: y + 1 };
}

const pad = (b: Box, p: number): Box => ({
  x0: b.x0 - p,
  y0: b.y0 - p,
  x1: b.x1 + p,
  y1: b.y1 + p,
});

/** Сколько длится вой стаи после клика по Луне. */
const HOWL = 7000;
/** За сколько стадо доходит на закате с луга до плетня, мс. */
const HOME = 18000;
const WINDOW_LIT = '#FFD27A';

interface Cow {
  from: number;
  to: number;
  /** Место у плетня на закате. */
  home: number;
  pal: Pal;
  /** Сдвиг от своего места на лугу: коровы понемногу переходят с места на место. */
  off: number;
  goal: number;
  dir: number;
  nextWander: number;
  headUp: number;
  nextHead: number;
  moo: number;
  hit: Hit;
}
interface Bee {
  x: number;
  y: number;
  goal: Pt;
  rest: number;
  home: boolean;
}
interface Moth {
  hx: number;
  hy: number;
  ph: number;
  pal: Pal;
}
interface Pigeon {
  x: number;
  y: number;
  /** Точки маршрута; последняя — внутри карточки Telegram. */
  path: Pt[];
  mail: boolean;
  caught: number;
}
interface Mover {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
}
interface Flight {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  born: number;
  dur: number;
  n: number;
}

export function createFauna(o: {
  reduce: boolean;
  /** Карточка Telegram на текущей странице: туда голубь несёт письмо. */
  mailbox: () => DOMRect | null;
  delivered: () => void;
}): Fauna {
  const SEASON = season();
  const nBees = { winter: 0, spring: 5, summer: 8, autumn: 4 }[SEASON];
  const nMoths = { winter: 0, spring: 3, summer: 4, autumn: 1 }[SEASON];

  const hits: Hit[] = [];
  const hit = (id: string, layer: Layer) => {
    const h: Hit = { id, layer, box: null };
    hits.push(h);
    return h;
  };
  const hOwl = hit('owl', 'fore');
  const hHog = hit('hedgehog', 'fore');
  const hCock = hit('rooster', 'fore');
  const hHive = hit('hive', 'fore');
  const hCows = [hit('cow1', 'fore'), hit('cow2', 'fore'), hit('cow3', 'fore')];
  const hPigeon = hit('pigeon', 'fx');

  let d: Dims | null = null;
  let geo: Geo | null = null;
  let EW = 0;
  let EH = 0;
  let s = 1;
  let u = (v: number) => v;
  let page = 0;
  let last = 0;
  let ptr: Pt | null = null;

  const owl = { look: 0, nextLook: 0, blink: 0, nextBlink: 0, wings: 0 };
  let pack: Pt[] = [];
  let howlAt = -1e9;
  let farDirty = true;
  let litAt: number[] = [];
  const flick: number[] = [];
  let smoke: (Mover & { max: number })[] = [];
  let herd: Cow[] = [];
  let walk = 1;
  /** Путь стада с луга к плетню на закате: 0 — на лугу, 1 — дошли. */
  let home = 0;
  let lookUntil = 0;
  const shep = { from: 0, to: 0, home: 0, nextNote: 0, notes: [] as Mover[] };
  const hog = { x: 0, from: 0, to: 0, pauseUntil: 0, nextPause: 0, curl: 0 };
  const cock = { crowAt: -1e9, nextCrow: 0 };
  let bees: Bee[] = [];
  let beeFlowers: Pt[] = [];
  let hideUntil = 0;
  let chaseUntil = 0;
  let moths: Moth[] = [];
  let flock: Pt | null = null;
  let nextFlock = 0;
  let pigeon: Pigeon | null = null;
  let nextPigeon = 0;
  let letter: Mover | null = null;
  let birds: Mover[] = [];
  let flights: Flight[] = [];
  let nextFlight = 0;

  /** Когда загорится окно: ночью почти сразу, на закате по одному, чтобы это было видно. */
  const lightsUp = (t: number) => {
    if (o.reduce) return 0;
    if (page === 3) return t + 1500 + Math.random() * 12000;
    return page === 0 ? t + 300 + Math.random() * 2600 : 0;
  };

  function reset(dims: Dims, g: Geo, ew: number, eh: number) {
    d = dims;
    geo = g;
    EW = ew;
    EH = eh;
    s = Math.max(1, Math.round(dims.k));
    u = (v) => Math.max(1, Math.round(v * dims.k));
    const fx = (f: number) => Math.round(OFF + dims.VW * f);

    // Стая садится на склон левее башни мага, вожак выше всех
    pack = [];
    const R = g.ridge;
    if (R && g.ledge)
      for (let i = 0; i < 3; i++) {
        const x = Math.max(0, g.ledge - u(4) - i * u(9));
        pack.push({ x, y: dims.HFAR - Math.round(R[x]) + 1 });
      }
    farDirty = true;
    const now = performance.now();
    litAt = g.windows.map(() => lightsUp(now));
    smoke = [];
    herd = [0.47, 0.6, 0.73].map((to, i) => ({
      from: fx(0.2 - i * 0.07),
      to: fx(to),
      home: fx(0.8 + i * 0.08),
      pal: i === 1 ? COW_BROWN : COW_BW,
      off: 0,
      goal: 0,
      dir: 1,
      nextWander: 0,
      headUp: 0,
      nextHead: 0,
      moo: 0,
      hit: hCows[i],
    }));
    shep.from = fx(-0.02);
    shep.to = fx(0.4);
    shep.home = fx(0.7);
    shep.notes = [];
    hog.from = fx(0.32);
    hog.to = fx(0.64);
    hog.x = hog.from + u(8);
    const H = g.hive;
    beeFlowers = H ? g.flowers.filter((f) => Math.abs(f.x - H.x) < dims.VW * 0.16) : [];
    bees = H
      ? Array.from({ length: nBees }, () => ({ x: H.x, y: H.y, goal: H, rest: 0, home: true }))
      : [];
    moths = g.flowers.length
      ? Array.from({ length: nMoths }, (_, i) => {
          const f = g.flowers[(Math.random() * g.flowers.length) | 0];
          return {
            hx: f.x,
            hy: f.y,
            ph: Math.random() * 6.28,
            pal: { w: MOTH_COLORS[i % MOTH_COLORS.length], b: '#2E2824' },
          };
        })
      : [];
    hHive.box = g.apiary;
    pigeon = null;
    letter = null;
    flock = null;
    birds = [];
    flights = [];
  }

  function setPage(p: number, t: number, first: boolean) {
    page = p;
    if (p === 3) nextFlight = t + 2500;
    if (p === 0 || p === 3) litAt = litAt.map(() => lightsUp(t));
    if (o.reduce) home = p === 3 ? 1 : 0;
    if (p === 1) {
      walk = o.reduce ? 1 : 0;
      home = 0;
      hog.x = hog.from + u(8);
      hog.nextPause = t + 6000;
      cock.crowAt = t + 1700;
      cock.nextCrow = t + 25000;
      nextFlock = t + 4500;
    }
    if (p >= 2) {
      walk = 1;
      hideUntil = t + 1400;
      nextPigeon = t + 6000;
    }
    if (first || p === 0) return;
    lookUntil = t + 2600;
    if (o.reduce) return;
    // Смена времени суток вспугивает птиц с верхушек деревьев
    birds = Array.from({ length: 6 }, () => ({
      x: Math.random() * EW,
      y: EH * (0.66 + Math.random() * 0.14),
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.015 + Math.random() * 0.02),
      vy: -(0.018 + Math.random() * 0.015),
      born: t,
    }));
  }

  /* ---------- дальний план: летучие мыши у башни мага и стая на гребне ---------- */

  function far(c: Ctx, L: Live, t: number) {
    const on = L.night >= 0.02;
    if (!on && !farDirty) return;
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    farDirty = on;
    if (!on) return;
    c.globalAlpha = L.night;
    const T = geo!.tower;
    if (T)
      for (let i = 0; i < 3; i++) {
        const a = t * 0.0012 * (i === 1 ? -1 : 1) + i * 2.1;
        const x = T.x + Math.cos(a) * u(12 + i * 4);
        const y = T.y + u(5) + Math.sin(a) * u(4 + i) + Math.sin(t / 240 + i * 3) * 1.5;
        put(c, BAT[((t / 110 + i * 1.7) | 0) & 1], BAT_PAL, Math.round(x), Math.round(y), s);
      }
    const k = t - howlAt;
    if (k < HOWL) {
      c.globalAlpha = L.night * clamp(Math.min(k / 800, (HOWL - k) / 1000));
      pack.forEach((w, i) => {
        const up = (k + i * 700) % 2400 < 1600;
        put(c, up ? WOLF_HOWL : WOLF_SIT, WOLF_PAL, w.x, w.y, s, true);
      });
    }
    c.globalAlpha = 1;
  }

  /* ---------- средний план: окна, дым из труб, мельница ---------- */

  /** На закате огонь в окнах горит поверх дневного пейзажа: тёмное окно не закрашиваем. */
  function duskWindows(c: Ctx, L: Live, t: number) {
    c.globalAlpha = L.dusk;
    geo!.windows.forEach((w, i) => {
      if (t < litAt[i]) return;
      c.fillStyle = 'rgba(255,196,96,.4)';
      c.fillRect(w.x0 - 1, w.y0 - 1, w.x1 - w.x0 + 2, w.y1 - w.y0 + 2);
      c.fillStyle = WINDOW_LIT;
      c.fillRect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
    });
    c.globalAlpha = 1;
  }

  function mid(c: Ctx, L: Live, t: number, dt: number, lum: number) {
    const g = geo!;
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    // Ночью окна закрыты темнотой, пока не подошла их очередь, а горящие подрагивают от лучины
    if (L.night > 0.02) {
      c.globalAlpha = L.night;
      g.windows.forEach((w, i) => {
        if (t < litAt[i]) c.fillStyle = '#100C1B';
        else if (t < (flick[i] ?? 0)) c.fillStyle = 'rgba(255,226,150,.65)';
        else {
          if (!o.reduce && Math.random() < dt / 9000) flick[i] = t + 90 + Math.random() * 140;
          return;
        }
        c.fillRect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
      });
      c.globalAlpha = 1;
    }
    if (L.dusk > 0.02) duskWindows(c, L, t);
    // К вечеру топят печи: дым гуще, чаще и крупнее
    if (!o.reduce)
      for (const ch of g.chimneys)
        if (smoke.length < 48 + 72 * L.dusk && Math.random() < dt / (420 - 280 * L.dusk))
          smoke.push({
            x: ch.x,
            y: ch.y,
            vx: 0.003 + Math.random() * 0.003,
            vy: -(0.005 + Math.random() * 0.003),
            born: t,
            max: (3000 + Math.random() * 2500) * (1 + 0.5 * L.dusk),
          });
    const sa = 0.3 + 0.45 * lum + 0.25 * L.dusk;
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i];
      const q = (t - p.born) / p.max;
      if (q > 1) {
        smoke.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt + Math.sin((t - p.born + i * 300) / 500) * 0.02;
      p.y += p.vy * dt;
      c.fillStyle =
        L.night > 0.5 ? `rgba(70,64,92,${(1 - q) * sa})` : `rgba(236,234,242,${(1 - q) * sa})`;
      const z = 1 + Math.floor(q * (2.5 + 2 * L.dusk));
      c.fillRect(p.x | 0, p.y | 0, z, z);
    }
    if (g.mill) {
      const { x, y } = g.mill;
      const a0 = o.reduce ? 0.5 : t * 0.0005;
      const len = u(9);
      const P = shade(MILL_PAL, lum);
      for (let k = 0; k < 4; k++) {
        const a = a0 + (k * Math.PI) / 2;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        c.fillStyle = P.a;
        for (let i = 1; i <= len; i++)
          c.fillRect(Math.round(x + dx * i), Math.round(y + dy * i), 1, 1);
        c.fillStyle = P.s;
        for (let i = Math.round(len * 0.35); i <= len; i++)
          for (let w = 1; w <= u(2); w++)
            c.fillRect(Math.round(x + dx * i - dy * w), Math.round(y + dy * i + dx * w), 1, 1);
      }
      c.fillStyle = P.a;
      c.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  /* ---------- передний план ---------- */

  function fore(c: Ctx, L: Live, t: number, dt: number, wake: number, lum: number) {
    const g = geo!;
    const D = d!;
    const at = (x: number) => g.ground![Math.max(0, Math.min(D.W - 1, x))];

    // Сова: следит за курсором, моргает, на клик расправляет крылья
    hOwl.box = null;
    if (g.owl && L.night > 0.02) {
      if (t > owl.nextLook) {
        owl.look = ((Math.random() * 3) | 0) - 1;
        owl.nextLook = t + 2500 + Math.random() * 3500;
      }
      let look = owl.look;
      if (ptr) {
        const dx = ptr.x - g.owl.x;
        look = dx < -u(6) ? -1 : dx > u(6) ? 1 : 0;
      }
      if (t > owl.nextBlink) {
        owl.blink = t + 140;
        owl.nextBlink = t + 2500 + Math.random() * 4000;
      }
      const spread = t < owl.wings;
      c.globalAlpha = L.night;
      const b = put(c, spread ? OWL_WINGS : OWL, OWL_PAL, g.owl.x, g.owl.y, s);
      const ox = b.x0 + (spread ? 2 : 0) * s;
      const ey = b.y0 + 2 * s;
      c.fillStyle = OWL_PAL.f;
      c.fillRect(ox + (2 + look) * s, ey + s, s, s);
      if (t > owl.blink)
        for (const e of [1, 3]) {
          const ex = ox + (e + look) * s;
          c.fillStyle = 'rgba(242,208,74,.22)';
          c.fillRect(ex - 1, ey - 1, s + 2, s + 2);
          c.fillStyle = '#F2D04A';
          c.fillRect(ex, ey, s, s);
        }
      c.globalAlpha = 1;
      if (L.night > 0.5) hOwl.box = pad(b, 2);
    }

    // Петух на колу плетня: кричит, когда приходит рассвет
    hCock.box = null;
    if (g.perch && wake > 0.02) {
      if (!o.reduce && page === 1 && t > cock.nextCrow) {
        cock.crowAt = t;
        cock.nextCrow = t + 20000 + Math.random() * 15000;
      }
      const k = t - cock.crowAt;
      const crowing = k >= 0 && k < 1500;
      c.globalAlpha = wake;
      const b = put(c, ROOSTER[crowing ? 1 : 0], shade(ROOSTER_PAL, lum), g.perch.x, g.perch.y, s);
      // «Кукареку»: от клюва расходятся три дуги
      if (crowing)
        for (let j = 1; j <= 3; j++) {
          if (k < j * 180) continue;
          const ax = b.x1 + j * 2 * s;
          const ay = b.y0 + s;
          c.fillStyle = `rgba(255,246,216,${0.95 * (1 - k / 1500)})`;
          c.fillRect(ax - s, ay - j * s, s, s);
          c.fillRect(ax, ay - (j - 1) * s, s, (j * 2 - 1) * s);
          c.fillRect(ax - s, ay + j * s, s, s);
        }
      c.globalAlpha = 1;
      if (wake > 0.5) hCock.box = pad(b, 2);
    }

    // Стадо: на рассвете идёт от околицы на луг, днём пасётся, на закате уходит к плетню у костра;
    // пастух играет на дудочке
    if (page === 1 && walk < 1 && !o.reduce) walk = Math.min(1, walk + dt / 45000);
    if (page >= 2) walk = 1;
    if (!o.reduce) home = clamp(home + (page === 3 ? dt : -dt) / HOME);
    const p = easeOut(walk);
    const h = easeOut(home);
    const walking = walk < 1 || (home > 0 && home < 1);
    const back = home > 0 && page !== 3;
    herd.forEach((cow, i) => {
      cow.hit.box = null;
      if (wake < 0.02) return;
      if (!walking && !o.reduce) {
        if (t > cow.nextWander) {
          cow.goal = Math.round((Math.random() - 0.5) * u(14));
          cow.nextWander = t + 8000 + Math.random() * 9000;
        }
        const left = cow.goal - cow.off;
        if (Math.abs(left) > 0.5) {
          cow.off += Math.sign(left) * Math.min(Math.abs(left), dt * 0.002);
          cow.dir = Math.sign(left);
        }
        if (t > cow.nextHead) {
          cow.headUp = t + 1500 + Math.random() * 2000;
          cow.nextHead = t + 5000 + Math.random() * 7000;
        }
      }
      const x = Math.round(cow.from + (cow.to - cow.from) * p + (cow.home - cow.to) * h + cow.off);
      const moving = walking || Math.abs(cow.goal - cow.off) > 0.5;
      const pose: Pose =
        t < cow.moo || t < lookUntil ? 'look' : moving || t < cow.headUp ? 'stand' : 'graze';
      const flip = back || (!walking && cow.dir < 0);
      const P = shade(cow.pal, lum);
      c.globalAlpha = wake;
      const b = put(c, COW[pose][moving ? (x / (2 * s)) & 1 : 0], P, x, at(x) + 2, s, flip);
      // Хвост: висит у крупа и иногда отмахивается
      const tx = flip ? b.x1 : b.x0 - s;
      const sw = Math.sin(t / 600 + i * 2) > 0.5 ? s : 0;
      c.fillStyle = P.t;
      c.fillRect(tx, b.y0 + 3 * s, s, s);
      c.fillRect(tx + (flip ? sw : -sw), b.y0 + 4 * s, s, 2 * s);
      c.globalAlpha = 1;
      if (wake > 0.5) cow.hit.box = pad(b, 2);
    });
    if (wake > 0.02) {
      const x = Math.round(shep.from + (shep.to - shep.from) * p + (shep.home - shep.to) * h);
      c.globalAlpha = wake;
      const b = put(
        c,
        walking ? SHEP[(x / (2 * s)) & 1] : SHEP_PIPE,
        shade(SHEP_PAL, lum),
        x,
        at(x) + 2,
        s,
        back,
      );
      if (!walking && !o.reduce && t > shep.nextNote) {
        shep.notes.push({ x: b.x1 + s, y: b.y0 + 2 * s, vx: 0, vy: 0, born: t });
        shep.nextNote = t + 1800 + Math.random() * 1600;
      }
      shep.notes = shep.notes.filter((n) => t - n.born < 2200);
      const NP = shade(NOTE_PAL, lum);
      for (const n of shep.notes) {
        const age = t - n.born;
        c.globalAlpha = wake * (1 - age / 2200);
        put(
          c,
          NOTE,
          NP,
          Math.round(n.x + Math.sin(age / 300) * 1.5),
          Math.round(n.y - age * 0.004),
          s,
        );
      }
      c.globalAlpha = 1;
    }

    // Ёжик в тумане: бредёт по берегу ручья, останавливается и оглядывается, на клик сворачивается
    hHog.box = null;
    if (g.bank && L.dawn > 0.02) {
      const curled = t < hog.curl;
      if (!o.reduce && !curled) {
        if (t > hog.nextPause) {
          hog.pauseUntil = t + 1500 + Math.random() * 1500;
          hog.nextPause = hog.pauseUntil + 5000 + Math.random() * 5000;
        }
        if (t > hog.pauseUntil) hog.x += dt * 0.0022;
        if (hog.x > hog.to) hog.x = hog.from;
      }
      const x = Math.round(hog.x);
      const by = g.bank[x] >= 0 ? g.bank[x] - 1 : at(x) + 4;
      const pausing = t < hog.pauseUntil;
      const fade = clamp(Math.min((hog.x - hog.from) / u(4), (hog.to - hog.x) / u(4)));
      c.globalAlpha = L.dawn * fade;
      const rows = curled ? HOG_CURL : HOG[pausing ? 0 : (x / (2 * s)) & 1];
      const b = put(c, rows, shade(HOG_PAL, lum), x, by, s, pausing && hog.pauseUntil - t < 900);
      c.globalAlpha = 1;
      if (L.dawn > 0.5 && fade > 0.5) hHog.box = pad(b, 3);
    }

    // Пчёлы: летают от колоды к цветам, увязываются за курсором, после смены страницы прячутся.
    // Вне дневной вкладки они уходят в колоду и на курсор и клик не вылетают
    const H = g.hive;
    if (H && bees.length && L.day > 0.02) {
      const hiding = t < hideUntil || page !== 2;
      if (!hiding && ptr && Math.hypot(ptr.x - H.x, ptr.y - H.y) < u(26))
        chaseUntil = Math.max(chaseUntil, t + 1500);
      const chase = !hiding && t < chaseUntil;
      const lure = ptr ?? { x: H.x, y: H.y - u(8) };
      const pick = () =>
        beeFlowers.length && Math.random() < 0.8
          ? beeFlowers[(Math.random() * beeFlowers.length) | 0]
          : H;
      c.globalAlpha = L.day;
      bees.forEach((b, i) => {
        // В колоде пчела отдыхает и не рисуется
        if (b.home) {
          if (hiding || t < b.rest) return;
          b.home = false;
          b.rest = 0;
          b.goal = pick();
        }
        let tx = b.goal.x;
        let ty = b.goal.y;
        if (hiding) {
          tx = H.x;
          ty = H.y;
        } else if (chase) {
          tx = lure.x + Math.cos(t / 260 + i * 1.3) * u(4);
          ty = lure.y + Math.sin(t / 200 + i * 1.7) * u(3);
        }
        const dx = tx - b.x;
        const dy = ty - b.y;
        const dist = Math.hypot(dx, dy);
        const step = Math.min(dist, dt * (chase ? 0.03 : 0.02));
        if (dist > 0.01) {
          b.x += (dx / dist) * step;
          b.y += (dy / dist) * step;
        }
        if (dist < 1.5 && !chase) {
          if (hiding || b.goal === H) {
            b.home = true;
            b.rest = t + 600 + Math.random() * 2500;
            return;
          }
          if (!b.rest) b.rest = t + 500 + Math.random() * 2000;
          else if (t > b.rest) {
            b.rest = 0;
            b.goal = pick();
          }
        }
        const X = Math.round(b.x + Math.sin(t / 70 + i * 5) * 0.8);
        const Y = Math.round(b.y + Math.cos(t / 90 + i * 3) * 0.8);
        c.fillStyle = '#F2C230';
        c.fillRect(X, Y, s, s);
        c.fillStyle = '#2A2018';
        c.fillRect(X + (dx > 0 ? -s : s), Y, s, s);
        if (((t / 45 + i) | 0) & 1) {
          c.fillStyle = 'rgba(235,245,255,.85)';
          c.fillRect(X, Y - s, s, s);
        }
      });
      c.globalAlpha = 1;
    }

    // Бабочки над цветами: гаснут к ночи и к закату
    const flutter = L.day * (1 - L.dusk);
    if (flutter > 0.02 && moths.length) {
      c.globalAlpha = flutter;
      for (const m of moths) {
        const x = m.hx + Math.sin(t / 1700 + m.ph) * u(10) + Math.sin(t / 530 + m.ph * 2) * u(2);
        const y = m.hy - u(3) - Math.abs(Math.sin(t / 650 + m.ph)) * u(6);
        put(c, MOTH[Math.sin(t / 60 + m.ph) > 0 ? 0 : 1], m.pal, Math.round(x), Math.round(y), s);
      }
      c.globalAlpha = 1;
    }
  }

  /* ---------- небо поверх пейзажа: журавли, голубь, вспугнутые птицы, стаи на закате ---------- */

  /** На закате стаи летят со стороны солнца и садятся на верхушки леса: там и растворяются. */
  function homing(c: Ctx, L: Live, t: number) {
    if (page === 3 && L.dusk > 0.6 && t > nextFlight) {
      flights.push({
        x0: EW + 8,
        y0: EH * (0.05 + Math.random() * 0.14),
        x1: EW * (0.08 + Math.random() * 0.5),
        y1: EH * (0.68 + Math.random() * 0.06),
        born: t,
        dur: 10000 + Math.random() * 3000,
        n: 5 + ((Math.random() * 5) | 0),
      });
      nextFlight = t + 6000 + Math.random() * 3000;
    }
    flights = L.dusk < 0.02 ? [] : flights.filter((f) => t - f.born < f.dur);
    for (const f of flights) {
      const q = (t - f.born) / f.dur;
      const x = f.x0 + (f.x1 - f.x0) * q;
      const y = f.y0 + (f.y1 - f.y0) * q;
      c.globalAlpha = L.dusk * clamp((1 - q) / 0.12);
      // Вразнобой, а не клином: это не журавли
      for (let k = 0; k < f.n; k++) {
        const bx = x + ((k * 11) % 7) * 4 * s + k * 3 * s;
        const by = y + ((k * 5) % 7) * 2 * s + Math.sin(t / 700 + k * 1.9) * 1.2;
        put(c, BIRD[((t / 110 + k * 0.6) | 0) & 1], BIRD_PAL, Math.round(bx), Math.round(by), s);
      }
    }
    c.globalAlpha = 1;
  }

  function sky(c: Ctx, L: Live, t: number, dt: number) {
    hPigeon.box = null;
    if (o.reduce) return;

    homing(c, L, t);

    if (!flock && page === 1 && L.dawn > 0.6 && t > nextFlock)
      flock = { x: EW + 8, y: Math.round(EH * (0.1 + Math.random() * 0.1)) };
    if (flock) {
      flock.x -= dt * 0.016;
      c.globalAlpha = L.dawn * 0.95;
      // Клин: вожак впереди, остальные расходятся назад двумя крыльями
      for (let k = 0; k < 7; k++) {
        const row = (k + 1) >> 1;
        const side = k & 1 ? 1 : -1;
        const x = flock.x + row * 9 * s;
        const y = flock.y + side * row * 4 * s + Math.sin(t / 900 + k) * 0.6;
        put(c, CRANE[((t / 160 + k * 0.7) | 0) & 3], CRANE_PAL, Math.round(x), Math.round(y), s);
      }
      c.globalAlpha = 1;
      if (flock.x < -40 * s) {
        flock = null;
        nextFlock = t + 30000 + Math.random() * 12000;
      }
    }

    // Голубь несёт письмо в карточку Telegram: летит поверх панелей, ныряет в просвет справа
    // от карточки и пропадает за ней. Если карточки нет (на «Проектах» или за краем экрана), просто
    // пролетает мимо
    if (!pigeon && page >= 2 && L.day > 0.6 && t > nextPigeon) {
      const r = o.mailbox();
      const mail = !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight;
      const y = Math.round(EH * (0.13 + Math.random() * 0.05));
      const gx = mail ? (r.right + 24) / S : 0;
      const my = mail ? (r.top + r.height / 2) / S : 0;
      pigeon = {
        x: EW + 6,
        y,
        path: mail
          ? [
              { x: gx, y },
              { x: gx, y: my },
              { x: (r.right - 36) / S, y: my },
            ]
          : [{ x: -16, y: y + EH * 0.1 }],
        mail,
        caught: 0,
      };
    }
    if (pigeon) {
      const P = pigeon;
      if (P.caught) {
        P.x += dt * 0.05;
        P.y -= dt * 0.03;
      } else {
        const to = P.path[0];
        const dx = to.x - P.x;
        const dy = to.y - P.y;
        const dist = Math.hypot(dx, dy);
        const st = Math.min(dist, dt * 0.03);
        if (dist > 0.01) {
          P.x += (dx / dist) * st;
          P.y += (dy / dist) * st;
        }
        if (dist < 1.5) P.path.shift();
        if (!P.path.length) {
          if (P.mail && page >= 2) o.delivered();
          pigeon = null;
          nextPigeon = t + 28000 + Math.random() * 14000;
        }
      }
      if (pigeon) {
        c.globalAlpha = L.day;
        const b = put(
          c,
          (P.caught ? PIGEON_BARE : PIGEON)[((t / 130) | 0) & 1],
          PIGEON_PAL,
          Math.round(P.x),
          Math.round(P.y + Math.sin(t / 220) * 1.2),
          s,
          !!P.caught,
        );
        c.globalAlpha = 1;
        if (!P.caught && L.day > 0.5) hPigeon.box = pad(b, 3);
        else if (P.x > EW + 10 || P.y < -10) {
          pigeon = null;
          nextPigeon = t + 40000;
        }
      }
    }
    if (letter) {
      const age = t - letter.born;
      if (age > 1800) letter = null;
      else {
        letter.y += dt * 0.02;
        c.globalAlpha = L.day * (1 - age / 1800);
        put(
          c,
          LETTER,
          PIGEON_PAL,
          Math.round(letter.x + Math.sin(age / 200) * 2),
          Math.round(letter.y),
          s,
        );
        c.globalAlpha = 1;
      }
    }

    if (birds.length) {
      birds = birds.filter((b) => t - b.born < 2600);
      birds.forEach((b, i) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        c.globalAlpha = 1 - (t - b.born) / 2600;
        put(
          c,
          BIRD[((t / 90 + i) | 0) & 1],
          BIRD_PAL,
          Math.round(b.x),
          Math.round(b.y),
          s,
          b.vx < 0,
        );
      });
      c.globalAlpha = 1;
    }
  }

  return {
    hits,
    reset,
    setPage,
    pointer(p) {
      ptr = p;
    },
    frame(L, c) {
      if (!d || !geo) return;
      const t = L.t;
      const dt = Math.min(100, Math.max(0, t - last));
      last = t;
      // Дневные звери просыпаются к рассвету; освещённость перекрашивает их вместе с пейзажем
      const wake = clamp((L.tod - 0.12) / 0.2);
      const lum = 0.3 + 0.7 * Math.sqrt(clamp(L.tod));
      far(c.far, L, t);
      mid(c.mid, L, t, dt, lum);
      fore(c.fore, L, t, dt, wake, lum);
      sky(c.fx, L, t, dt);
    },
    poke(id, t) {
      if (id === 'owl') owl.wings = t + 1000;
      else if (id === 'hedgehog') hog.curl = t + 1800;
      else if (id === 'rooster') cock.crowAt = t;
      else if (id === 'hive') {
        hideUntil = 0;
        chaseUntil = t + 4000;
        for (const b of bees) b.rest = 0;
      } else if (id === 'pigeon' && pigeon && !pigeon.caught) {
        pigeon.caught = t;
        letter = { x: pigeon.x, y: pigeon.y + 2, vx: 0, vy: 0, born: t };
      } else if (id.startsWith('cow')) {
        const cow = herd[Number(id.slice(3)) - 1];
        if (cow) cow.moo = t + 1400;
      }
    },
    howl(t) {
      howlAt = t;
    },
  };
}
