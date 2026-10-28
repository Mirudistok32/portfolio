/**
 * Статичные слои пиксельного пейзажа. Рисуются один раз в маленькие canvas (1 пиксель = 4 CSS-пикселя),
 * дальше браузер только двигает и смешивает их через transform и opacity.
 */

export type Ctx = CanvasRenderingContext2D;

export const S = 4;
/** Холсты сдвинуты на 64px влево, чтобы параллакс за мышью не открывал край. */
export const OFF = 16;

export interface Dims {
  VW: number;
  H: number;
  W: number;
  WS: number;
  m: number;
  k: number;
  HFAR: number;
  HMID: number;
  HFORE: number;
  HGROUND: number;
}

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Pt {
  x: number;
  y: number;
}

export interface Geo {
  water: [number, number][];
  dew: [number, number][];
  fires: Pt[];
  wolf: Pt | null;
  stream: Box | null;
  terem: Box[];
  /** Сфера на шпиле башни мага, в координатах дальнего холста. */
  tower: Pt | null;
  /** Высота гребня передних гор по x и левый край площадки под башней: вниз по склону выходит стая. */
  ridge: Float32Array | null;
  ledge: number;
  /** Окна терема, храма и изб: ночью зажигаются по одному. */
  windows: Box[];
  chimneys: Pt[];
  /** Ось крыльев мельницы. */
  mill: Pt | null;
  /** Линия травы переднего плана по x: по ней идёт стадо. */
  ground: Int16Array | null;
  /** Верхний берег ручья по x, -1 вне ручья: по нему бредёт ёжик. */
  bank: Int16Array | null;
  /** Сук сухого дерева, где ночью сидит сова. */
  owl: Pt | null;
  /** Высокий кол плетня под петуха. */
  perch: Pt | null;
  /** Леток колоды и сама пасека. */
  hive: Pt | null;
  apiary: Box | null;
  flowers: Pt[];
}

export const emptyGeo = (): Geo => ({
  water: [],
  dew: [],
  fires: [],
  wolf: null,
  stream: null,
  terem: [],
  tower: null,
  ridge: null,
  ledge: 0,
  windows: [],
  chimneys: [],
  mill: null,
  ground: null,
  bank: null,
  owl: null,
  perch: null,
  hive: null,
  apiary: null,
  flowers: [],
});

export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function disc(ctx: Ctx, cx: number, cy: number, r: number) {
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

/** Приплюснутый эллипс: сугроб, клуб тумана. */
function blob(ctx: Ctx, cx: number, cy: number, w: number, h: number) {
  for (let j = -h; j <= h; j++) {
    const rw = Math.round(w * Math.sqrt(1 - (j / (h + 0.5)) ** 2));
    ctx.fillRect(cx - rw, cy + j, rw * 2 + 1, 1);
  }
}

function checker(ctx: Ctx, a: string, b: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const x = c.getContext('2d')!;
  x.fillStyle = a;
  x.fillRect(0, 0, 2, 2);
  x.fillStyle = b;
  x.fillRect(0, 0, 1, 1);
  x.fillRect(1, 1, 1, 1);
  return ctx.createPattern(c, 'repeat')!;
}

export const SKIES = [
  ['#05040B', '#08060F', '#0C0917', '#110C20', '#17102A', '#1E1534', '#261A3D'],
  ['#151337', '#26204F', '#432A63', '#6D3469', '#A3456A', '#D6635F', '#F2955A'],
  ['#2066B6', '#2F79C9', '#4690D8', '#66A6E2', '#8EBEEB', '#B9D7F3', '#DDEDF9'],
];

export function drawSky(ctx: Ctx, cols: string[], w: number, h: number) {
  const bh = h / cols.length;
  cols.forEach((c, i) => {
    const y0 = Math.floor(i * bh);
    ctx.fillStyle = c;
    ctx.fillRect(0, y0, w, Math.ceil(bh) + 1);
    if (i) {
      ctx.fillStyle = checker(ctx, c, cols[i - 1]);
      ctx.fillRect(0, y0, w, 2);
    }
  });
}

export interface Planet {
  id: string;
  x: number;
  y: number;
  r: number;
  base: string;
  light: string;
  dark: string;
  bands?: [string, string];
  ring?: string;
  craters?: string;
  clouds?: string;
  moonlet?: boolean;
  text: string;
  cx?: number;
  cy?: number;
  rr?: number;
}

export const PLANETS: Planet[] = [
  {
    id: 'jup',
    x: 0.74,
    y: 0.12,
    r: 0.05,
    base: '#C08A5A',
    light: '#E7C08F',
    dark: '#6E4A35',
    bands: ['#A4704A', '#D9A877'],
    text: 'Газовый гигант. Размером примерно с node_modules.',
  },
  {
    id: 'ring',
    x: 0.94,
    y: 0.28,
    r: 0.034,
    base: '#C9A75A',
    light: '#F1D88E',
    dark: '#7A6233',
    ring: '#E8D3A0',
    text: 'Планета с золотыми кольцами. Видимо, здесь добывают золото для «Героев».',
  },
  {
    id: 'mars',
    x: 0.5,
    y: 0.1,
    r: 0.02,
    base: '#B84A32',
    light: '#E27A55',
    dark: '#6A2418',
    craters: '#8E3523',
    text: 'Марс. Отсюда стартовали марсиане Уэллса. Пока тихо.',
  },
  {
    id: 'moon',
    x: 0.31,
    y: 0.11,
    r: 0.022,
    base: '#A9A3B5',
    light: '#E3DEEA',
    dark: '#5E586C',
    craters: '#7F788E',
    text: 'Луна. Барбикен из романа Верна уже заряжает пушку.',
  },
  {
    id: 'ice',
    x: 0.62,
    y: 0.17,
    r: 0.018,
    base: '#6FB6D8',
    light: '#C8ECFA',
    dark: '#2F5E7A',
    text: 'Ледяная планета. Здесь хранится кэш, который никто не сбрасывал.',
  },
  {
    id: 'emerald',
    x: 0.05,
    y: 0.4,
    r: 0.024,
    base: '#3E9C7E',
    light: '#8FE0BE',
    dark: '#1C4E40',
    clouds: '#B9F0D8',
    text: 'Изумрудная планета. Ведьмаки сюда не летают: до контрактов слишком далеко.',
  },
  {
    id: 'violet',
    x: 0.95,
    y: 0.5,
    r: 0.026,
    base: '#7B5BC4',
    light: '#B79BF0',
    dark: '#3B2A66',
    moonlet: true,
    text: 'Фиолетовая планета со спутником. Неразлучны, как Геральт и Плотва.',
  },
];

function planet(ctx: Ctx, p: Planet, d: Dims) {
  const cx = Math.round(OFF + d.VW * p.x);
  const cy = Math.round(d.H * p.y);
  const r = Math.max(4, Math.round(d.m * p.r));
  p.cx = cx;
  p.cy = cy;
  p.rr = r;
  const ring = (back: boolean) => {
    const R = r * 1.85;
    for (let a = 0; a < Math.PI * 2; a += 0.015) {
      const s = Math.sin(a);
      if (s < 0 !== back) continue;
      for (const q of [1, 0.86]) {
        ctx.fillStyle = q === 1 ? p.ring! : 'rgba(120,96,50,.9)';
        ctx.fillRect(
          Math.round(cx + Math.cos(a) * R * q),
          Math.round(cy + s * R * q * 0.28 - Math.cos(a) * R * q * 0.1),
          1,
          1,
        );
      }
    }
  };
  if (p.ring) ring(true);
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -w; x <= w; x++) {
      const light = (-x * 0.62 - y * 0.55) / r;
      let col = p.bands ? p.bands[Math.floor((y + r) / Math.max(2, r / 3)) % 2] : p.base;
      if (light > 0.38 || (light > 0.3 && (x + y) & 1)) col = p.light;
      else if (light < -0.42 || (light < -0.34 && (x + y) & 1)) col = p.dark;
      ctx.fillStyle = col;
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  const r2 = rng(p.id.length * 31 + r);
  if (p.craters) {
    ctx.fillStyle = p.craters;
    for (let i = 0; i < 4; i++)
      disc(
        ctx,
        cx + Math.round((r2() - 0.6) * r),
        cy + Math.round((r2() - 0.6) * r),
        Math.max(1, Math.round(r * (0.1 + r2() * 0.12))),
      );
  }
  if (p.clouds) {
    ctx.fillStyle = p.clouds;
    for (let i = 0; i < 6; i++) {
      const yy = Math.round((r2() - 0.5) * r * 1.4);
      const ww = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)));
      ctx.fillRect(cx - Math.round(ww * r2()), cy + yy, Math.max(1, Math.round(ww * 0.8)), 1);
    }
  }
  if (p.ring) ring(false);
  if (p.moonlet) {
    ctx.fillStyle = '#CFC6E6';
    disc(
      ctx,
      cx + Math.round(r * 1.7),
      cy - Math.round(r * 0.9),
      Math.max(1, Math.round(r * 0.25)),
    );
  }
}

export function drawCosmos(ctx: Ctx, d: Dims) {
  const r = rng(7);
  const n = Math.round((d.WS * d.H) / 85);
  for (let i = 0; i < n; i++) {
    const x = (r() * d.WS) | 0;
    const y = (r() * d.H * 0.78) | 0;
    const q = r();
    ctx.fillStyle = q < 0.7 ? '#4F4870' : q < 0.92 ? '#A9A1C6' : '#E9D9A8';
    ctx.fillRect(x, y, 1, 1);
    if (q > 0.988) {
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
    }
  }
  // Млечный путь: полоса плотных тусклых звёзд по диагонали
  for (let i = 0; i < n * 0.9; i++) {
    const t = r();
    const x = t * d.WS;
    const y = d.H * (0.04 + t * 0.34) + (r() - 0.5) * d.H * 0.13;
    ctx.fillStyle = r() < 0.5 ? 'rgba(170,150,220,.32)' : 'rgba(120,110,170,.38)';
    ctx.fillRect(x | 0, y | 0, 1, 1);
  }
  PLANETS.forEach((p) => planet(ctx, p, d));
}

export function drawClouds(ctx: Ctx, d: Dims) {
  // Места подобраны так, чтобы облака не ложились под заголовки страниц
  const spots: [number, number, number][] = [
    [0.03, 0.2, 9],
    [0.25, 0.1, 8],
    [0.55, 0.22, 12],
    [0.86, 0.1, 12],
    [1.02, 0.2, 10],
  ];
  for (const [fx, fy, fw] of spots) {
    const cx = Math.round(OFF + d.VW * fx);
    const cy = Math.round(d.H * fy);
    const w = Math.round(fw * d.k);
    ctx.fillStyle = '#FFFFFF';
    for (let j = 0; j < 4; j++) {
      const inner = j === 1 || j === 2;
      disc(
        ctx,
        cx + Math.round((j - 1.5) * w * 0.45),
        cy - Math.round((inner ? 0.35 : 0) * w),
        Math.round(w * (inner ? 0.38 : 0.28)),
      );
    }
    ctx.fillStyle = 'rgba(160,190,225,.55)';
    ctx.fillRect(cx - Math.round(w * 0.9), cy + Math.round(w * 0.2), Math.round(w * 1.8), 1);
  }
}

/**
 * Северное сияние: занавеси из столбцов, снизу яркая зелёная кромка, кверху тает в фиолет.
 * Два холста с разной фазой перетекают друг в друга через CSS, поэтому сияние колышется без перерисовки.
 */
export function drawAurora(ctx: Ctx, d: Dims, phase: number) {
  const h = ctx.canvas.height;
  // Снизу вверх: яркая кромка, зелёная занавесь, бирюза, фиолетовый край. [доля длины, цвет, яркость]
  const bands: [number, string, number][] = [
    [0.05, '210,255,230', 0.95],
    [0.3, '120,240,180', 0.6],
    [0.3, '80,210,175', 0.34],
    [0.35, '150,120,255', 0.17],
  ];
  // Ярче по краям экрана, где небо не закрыто панелями
  const env = (f: number) =>
    Math.max(Math.exp(-(((f - 0.04) / 0.16) ** 2)), Math.exp(-(((f - 0.86) / 0.24) ** 2)), 0.35);
  for (let x = 0; x < d.WS; x++) {
    const q = x / d.k;
    // Лента изгибается по небу и местами гаснет
    const base =
      h * (0.55 + Math.sin(q * 0.011 + phase * 1.9) * 0.1 + Math.sin(q * 0.035 + phase) * 0.03);
    const I =
      env((x - OFF) / d.VW) *
      (0.6 + 0.4 * Math.sin(q * 0.021 + phase * 2.4)) *
      (0.65 + 0.35 * Math.sin(q * 0.057 + 1 + phase * 1.3));
    if (I < 0.1) continue;
    // Складки занавеси: лучи то ярче, то тусклее, с шагом в несколько пикселей
    const fold = 0.62 + 0.38 * Math.sin(q * 0.33 + phase * 4 + Math.sin(q * 0.07) * 2);
    const len = h * (0.25 + 0.3 * I);
    let y = Math.round(base);
    for (const [frac, rgb, a] of bands) {
      const hh = Math.max(1, Math.round(len * frac));
      ctx.fillStyle = `rgba(${rgb},${(a * I * fold).toFixed(3)})`;
      ctx.fillRect(x, y - hh, 1, hh);
      y -= hh;
    }
  }
}

/** Через пиксель: мягкий край у пиксельной фигуры без сглаживания. */
function dither(ctx: Ctx, c: string) {
  const p = document.createElement('canvas');
  p.width = p.height = 2;
  const x = p.getContext('2d')!;
  x.fillStyle = c;
  x.fillRect(0, 0, 1, 1);
  x.fillRect(1, 1, 1, 1);
  return ctx.createPattern(p, 'repeat')!;
}

/**
 * Дымка между пейзажем и панелями: крупные тёмные облака приглушают пёстрый фон под текстом.
 * Холст рисуется непрозрачным, прозрачность задаёт CSS, поэтому наложения облаков не темнеют пятнами.
 */
export function drawHaze(ctx: Ctx, d: Dims) {
  const spots: [number, number, number][] = [
    [0.1, 0.3, 1],
    [0.42, 0.52, 1.3],
    [0.8, 0.3, 1.1],
    [0.24, 0.8, 1.2],
    [0.7, 0.8, 1],
    [1.04, 0.56, 1.1],
  ];
  const base = Math.max(d.VW, d.H) * 0.16;
  const edge = Math.max(2, Math.round(2 * d.k));
  const puff = (fill: string | CanvasPattern, grow: number) => {
    ctx.fillStyle = fill;
    for (const [fx, fy, s] of spots) {
      const cx = Math.round(OFF + d.VW * fx);
      const cy = Math.round(d.H * fy);
      const w = base * s;
      for (let j = 0; j < 6; j++) {
        const t = (j / 5) * 2 - 1;
        const r = Math.round(w * (0.44 - 0.2 * Math.abs(t)));
        disc(ctx, Math.round(cx + t * w * 0.75), Math.round(cy - r * 0.35), r + grow);
      }
    }
  };
  puff(dither(ctx, '#0A1216'), edge);
  puff('#0A1216', 0);
}

/** Туман над ручьём: клубы через пиксель и тонкие пряди. Прозрачность и дрейф задаёт CSS. */
export function drawMist(ctx: Ctx, d: Dims, geo: Geo) {
  const bank = geo.bank;
  if (!bank) return;
  const u = (v: number) => Math.max(1, Math.round(v * d.k));
  const r = rng(91);
  ctx.fillStyle = dither(ctx, '#F6E6EE');
  for (let x = 0; x < d.W; x += u(7)) {
    const w = u(5 + r() * 9);
    const h = Math.max(1, Math.round(w * 0.22));
    const lift = Math.round(r() * u(3));
    if (bank[x] >= 0) blob(ctx, x, bank[x] + u(1) - lift, w, h);
  }
  ctx.fillStyle = '#F6E6EE';
  for (let x = 0; x < d.W; x += u(4)) {
    const len = u(4 + r() * 10);
    const lift = Math.round(r() * u(4));
    if (bank[x] >= 0 && r() < 0.6) ctx.fillRect(x, bank[x] + u(1) - lift, len, 1);
  }
}

export function drawSun(ctx: Ctx) {
  ctx.clearRect(0, 0, 22, 22);
  ctx.fillStyle = '#FFD15A';
  disc(ctx, 11, 11, 9);
  ctx.fillStyle = '#FFE9A3';
  disc(ctx, 11, 11, 7);
  ctx.fillStyle = '#FFF8DC';
  disc(ctx, 9, 9, 3);
}

/* ---------- палитры ночи и дня ---------- */

/** Склон к луне светлее, обратный — в тени. */
interface RangePal {
  rock: string;
  lit: string;
  snow: string;
  shade: string;
}
interface FarPal {
  back: RangePal;
  front: RangePal;
  tower: { wall: string; rim: string; roof: string; win: string };
}
interface GroundPal {
  crest: string;
  soil: string;
  deep: string;
  snow: string;
  snowShade: string;
  rock: string;
  rockHi: string;
  grass: string;
  grassHi: string;
  glow: string | null;
}
interface MidPal {
  hill: string;
  tree: string;
  treeHi?: string;
  trunk: string;
  wood: string;
  wall: string;
  roof: string;
  dome: string;
  domeMain: string;
  domeHi: string;
  win: string;
  water: string;
}
interface ForePal {
  ground: string;
  grass: string;
  grassHi: string;
  pine: string;
  birch: string;
  birchMark: string;
  leaf: string;
  water: string;
  waterHi: string;
  bank: string;
  stone: string;
  log: string;
  dew: string | null;
  snag: string;
  wattle: string;
  hive: string;
  hiveDark: string;
  petals: string[];
}

export const PAL: {
  far: { n: FarPal; d: FarPal };
  mid: { n: MidPal; d: MidPal };
  fore: { n: ForePal; d: ForePal };
  ground: { n: GroundPal; d: GroundPal };
} = {
  far: {
    n: {
      back: { rock: '#1D1634', lit: '#271E44', snow: '#5C628F', shade: '#3A3B66' },
      front: { rock: '#130F24', lit: '#1E1736', snow: '#7E86B8', shade: '#474A7C' },
      tower: { wall: '#1B1631', rim: '#6C66A8', roof: '#2A2350', win: '#B4E6FF' },
    },
    d: {
      back: { rock: '#8A9EC4', lit: '#A3B4D3', snow: '#F3F7FF', shade: '#CAD6EC' },
      front: { rock: '#6A80A8', lit: '#8198BE', snow: '#F3F7FF', shade: '#B9C8E2' },
      tower: { wall: '#9298AE', rim: '#D7DDEB', roof: '#4A4D78', win: '#3A3552' },
    },
  },
  mid: {
    n: {
      hill: '#120E1E',
      tree: '#0E0B18',
      trunk: '#0E0B18',
      wood: '#100C1B',
      wall: '#100C1B',
      roof: '#100C1B',
      dome: '#100C1B',
      domeMain: '#100C1B',
      domeHi: '#6B5A2E',
      win: '#F2A541',
      water: '#1A2546',
    },
    d: {
      hill: '#4E7E4A',
      tree: '#3F6E3C',
      treeHi: '#6FA35A',
      trunk: '#5A3E2A',
      wood: '#9A6A3E',
      wall: '#ECE4D2',
      roof: '#8A3B2E',
      dome: '#E8C15A',
      domeMain: '#3D6FB6',
      domeHi: '#FFF1B0',
      win: '#3A2E2A',
      water: '#5AA6DD',
    },
  },
  fore: {
    n: {
      ground: '#0A0812',
      grass: '#101A18',
      grassHi: '#172622',
      pine: '#0B0F14',
      birch: '#8E8AA4',
      birchMark: '#2A2638',
      leaf: '#14211B',
      water: '#16213D',
      waterHi: '#2C3F6E',
      bank: '#07060D',
      stone: '#2A2638',
      log: '#3A2418',
      dew: null,
      snag: '#1B1622',
      wattle: '#1E1610',
      hive: '#1A1420',
      hiveDark: '#0A0812',
      petals: ['#2A2638', '#232C36'],
    },
    d: {
      ground: '#4A7A35',
      grass: '#5E9A3E',
      grassHi: '#8CC85C',
      pine: '#2D5A36',
      birch: '#F1EEE4',
      birchMark: '#2C2A28',
      leaf: '#7DB34E',
      water: '#3E8FCF',
      waterHi: '#A9DCF7',
      bank: '#3C6A2C',
      stone: '#8C8A84',
      log: '#6B4426',
      dew: '#D8F6FF',
      snag: '#7A6A58',
      wattle: '#9A7246',
      hive: '#8A5A32',
      hiveDark: '#3A2414',
      petals: ['#E8524A', '#F2D04A', '#7FB2F0', '#F5F1EA', '#E58AD0'],
    },
  },
  ground: {
    n: {
      crest: '#141B24',
      soil: '#0D0B16',
      deep: '#08070E',
      snow: '#535A8C',
      snowShade: '#343863',
      rock: '#29243E',
      rockHi: '#6A64A0',
      grass: '#12201B',
      grassHi: '#1F362C',
      glow: '#8FE3FF',
    },
    d: {
      crest: '#6FA84A',
      soil: '#55893A',
      deep: '#477A31',
      snow: '#F1F6FB',
      snowShade: '#C6D4E4',
      rock: '#8C8A84',
      rockHi: '#C9C6BC',
      grass: '#5E9A3E',
      grassHi: '#8CC85C',
      glow: null,
    },
  },
};

/** Гребень из острых пиков: верхняя огибающая «треугольников» и мелкая рваная кромка. */
function ridge(r: () => number, w: number, lo: number, hi: number, gap: number) {
  const peaks: { x: number; h: number; sl: number; sr: number }[] = [];
  for (let x = -gap; x < w + gap; x += gap * (0.55 + r() * 0.9))
    peaks.push({ x, h: lo + r() * (hi - lo), sl: 0.5 + r() * 0.6, sr: 0.5 + r() * 0.6 });
  const hs = new Float32Array(w);
  let n = 0;
  for (let x = 0; x < w; x++) {
    let h = 0;
    for (const p of peaks) {
      const dx = x - p.x;
      h = Math.max(h, p.h - Math.abs(dx) * (dx < 0 ? p.sl : p.sr));
    }
    n = n * 0.7 + (r() - 0.5) * 2.6;
    hs[x] = h + n;
  }
  return hs;
}

/** Камень и снежные шапки; снег сползает по склонам неровными языками. */
function paintRange(ctx: Ctx, hs: Float32Array, P: RangePal, d: Dims, snowline: number) {
  const lit = Array.from(
    { length: d.W },
    (_, x) => hs[Math.min(d.W - 1, x + 4)] > hs[Math.max(0, x - 4)],
  );
  // Одиночные столбцы с другим освещением из-за шума кромки выглядят светлыми щелями в склоне
  for (let x = 1; x < d.W - 2; x++)
    if (lit[x] !== lit[x - 1] && (lit[x + 1] === lit[x - 1] || lit[x + 2] === lit[x - 1]))
      lit[x] = lit[x - 1];
  for (let x = 0; x < d.W; x++) {
    const h = hs[x];
    const top = Math.round(d.HFAR - h);
    ctx.fillStyle = lit[x] ? P.lit : P.rock;
    ctx.fillRect(x, top, 1, d.HFAR - top);
    const tongue = Math.abs(Math.sin(x * 0.21) * Math.sin(x * 0.067 + 1)) * 9 * d.k;
    const snow = h > snowline ? Math.round((h - snowline) * 0.7 + tongue) + 1 : 1;
    ctx.fillStyle = lit[x] ? P.snow : P.shade;
    ctx.fillRect(x, top, 1, snow + (x & 1));
  }
}

/** Башня мага: тонкий ствол на скале, балкон, верхний покой с конической крышей и шпиль. */
function mageTower(ctx: Ctx, x: number, g: number, P: FarPal['tower'], d: Dims) {
  const u = (v: number) => Math.max(1, Math.round(v * d.k));
  const bw = Math.max(4, u(5));
  const bh = u(22);
  const left = (w: number) => x - Math.floor(w / 2);
  const row = (y: number, w: number, rim = true) => {
    ctx.fillStyle = P.wall;
    ctx.fillRect(left(w), y, w, 1);
    if (rim) {
      ctx.fillStyle = P.rim;
      ctx.fillRect(left(w), y, 1, 1);
    }
  };
  // Скальный уступ под башней
  for (let i = 0; i < u(4); i++) row(g - i, bw + u(6) - i * 2, false);
  // Пристройка-башенка слева
  const sx = left(bw) - u(2);
  ctx.fillStyle = P.wall;
  ctx.fillRect(sx, g - u(9), u(3), u(9));
  ctx.fillStyle = P.roof;
  for (let i = 0; i < u(4); i++)
    ctx.fillRect(sx + Math.floor(i / 2), g - u(9) - i, Math.max(1, u(3) - i), 1);
  // Ствол, к верху чуть тоньше
  for (let i = 0; i < bh; i++) row(g - i, i > bh * 0.6 ? bw - 1 : bw);
  const by = g - bh;
  // Балкон и верхний покой
  ctx.fillStyle = P.wall;
  ctx.fillRect(left(bw + 2), by, bw + 2, Math.max(1, u(1.2)));
  const cw = bw + 1;
  for (let i = 1; i <= u(5); i++) row(by - i, cw);
  const ry = by - u(5);
  // Коническая крыша и шпиль
  const rh = u(9);
  for (let i = 0; i < rh; i++) {
    const half = Math.round(((cw + 2) / 2) * (1 - i / rh));
    ctx.fillStyle = P.roof;
    ctx.fillRect(x - half, ry - i, half * 2 + 1, 1);
    ctx.fillStyle = P.rim;
    ctx.fillRect(x - half, ry - i, 1, 1);
  }
  const spire = u(3);
  ctx.fillRect(x, ry - rh - spire, 1, spire);
  // Окна: щели по стволу и широкое окно в покое
  ctx.fillStyle = P.win;
  for (let i = u(5); i < bh - u(2); i += u(5)) ctx.fillRect(x, g - i, 1, Math.max(1, u(1.5)));
  ctx.fillRect(x - 1, by - u(3.5), Math.min(3, cw - 2), Math.max(1, u(2)));
  ctx.fillRect(sx + 1, g - u(6), 1, 1);
  return { x, y: ry - rh - spire - 1 };
}

export function drawFar(ctx: Ctx, P: FarPal, d: Dims, geo: Geo | null) {
  const r = rng(11);
  const back = ridge(r, d.W, d.H * 0.3, d.H * 0.45, d.H * 0.26);
  paintRange(ctx, back, P.back, d, d.H * 0.33);
  const front = ridge(r, d.W, d.H * 0.17, d.H * 0.33, d.H * 0.2);
  // Пик под башню: острый, с площадкой на вершине
  const tx = Math.round(OFF + d.VW * 0.79);
  const th = d.H * 0.3;
  const flat = Math.max(4, Math.round(5 * d.k));
  for (let x = 0; x < d.W; x++) {
    const dx = Math.max(0, Math.abs(x - tx) - flat);
    front[x] = Math.max(front[x], th - dx * (x < tx ? 0.75 : 0.95) + Math.sin(x * 1.7) * 0.8);
  }
  for (let x = tx - flat; x <= tx + flat; x++) if (x >= 0 && x < d.W) front[x] = th;
  paintRange(ctx, front, P.front, d, d.H * 0.22);
  const orb = mageTower(ctx, tx, Math.round(d.HFAR - th), P.tower, d);
  if (geo) {
    geo.tower = orb;
    geo.ridge = front;
    geo.ledge = tx - flat;
  }
}

/**
 * Земля под ногами: ближний пригорок снизу экрана, виден, когда страница докручена до конца.
 * Чем ниже, тем ближе: камни, снег и трава крупнеют.
 */
export function drawGround(ctx: Ctx, P: GroundPal, d: Dims) {
  const Hc = d.HGROUND;
  const u = (v: number) => Math.max(1, Math.round(v * d.k));
  const r = rng(57);
  const p = r() * 6;
  const crest = u(12);
  const gy = (x: number) =>
    Math.round(crest + Math.sin(x * 0.016 + p) * u(4) + Math.sin(x * 0.05 + p * 2) * u(1.5));
  // Тело земли: к низу темнее, полосы стыкуются шахматкой
  const bands = [P.crest, P.soil, P.deep];
  for (let x = 0; x < d.W; x++) {
    const t = gy(x);
    ctx.fillStyle = P.soil;
    ctx.fillRect(x, t, 1, Hc - t);
    ctx.fillStyle = P.crest;
    ctx.fillRect(x, t, 1, u(2));
  }
  const deepY = Math.round(crest + (Hc - crest) * 0.55);
  ctx.fillStyle = bands[2];
  ctx.fillRect(0, deepY, d.W, Hc - deepY);
  ctx.fillStyle = checker(ctx, bands[2], bands[1]);
  ctx.fillRect(0, deepY - 2, d.W, 2);
  // Россыпь камешков и травинок по всей земле, крупнее у нижнего края
  const n = Math.round((d.W * (Hc - crest)) / 40);
  for (let i = 0; i < n; i++) {
    const x = (r() * d.W) | 0;
    const y = gy(x) + u(3) + ((r() * (Hc - crest)) | 0);
    const near = (y - crest) / (Hc - crest);
    const q = r();
    if (q < 0.45) {
      ctx.fillStyle = r() < 0.5 ? P.grass : P.grassHi;
      ctx.fillRect(x, y, 1, 1 + Math.round(near * 2 * d.k));
    } else if (q < 0.75) {
      ctx.fillStyle = P.rock;
      ctx.fillRect(x, y, 1 + Math.round(near * 1.5), 1);
    } else {
      ctx.fillStyle = P.deep;
      ctx.fillRect(x, y, 2, 1);
    }
  }
  // Сугробы: пара наплывов, верх и левый край под луной
  for (let i = 0; i < Math.round(d.W / 44); i++) {
    const x = (r() * d.W) | 0;
    const y = gy(x) + u(4) + ((r() * (Hc - crest) * 0.75) | 0);
    const near = (y - crest) / (Hc - crest);
    const w = Math.round((2 + r() * 5) * d.k * (0.5 + near));
    const h = Math.max(1, Math.round(w * 0.35));
    const parts = [
      [0, 0, 1],
      [Math.round(w * (0.6 + r() * 0.5)), Math.round(h * 0.3), 0.6 + r() * 0.3],
    ];
    if (r() < 0.5) parts.push([-Math.round(w * 0.7), Math.round(h * 0.4), 0.5]);
    ctx.fillStyle = P.snowShade;
    for (const [ox, oy, q] of parts)
      blob(ctx, x + ox, y + oy, Math.round(w * q), Math.round(h * q));
    ctx.fillStyle = P.snow;
    for (const [ox, oy, q] of parts)
      blob(
        ctx,
        x + ox - 1,
        y + oy - 1,
        Math.round(w * q * 0.8),
        Math.max(0, Math.round(h * q * 0.6)),
      );
  }
  // Валуны по гребню: верх и левый бок под луной
  const boulder = (x: number, g: number, rad: number) => {
    ctx.fillStyle = P.rock;
    disc(ctx, x, g, rad);
    ctx.fillStyle = P.rockHi;
    for (let y = -rad; y <= -rad * 0.3; y++) {
      const w = Math.floor(Math.sqrt(rad * rad - y * y));
      ctx.fillRect(x - w, g + y, Math.max(1, Math.round(w * 0.9)), 1);
    }
    ctx.fillStyle = P.snow;
    ctx.fillRect(x - Math.round(rad * 0.5), g - rad, Math.max(1, rad), 1);
  };
  for (let x = Math.round(r() * 40); x < d.W; x += Math.round((40 + r() * 70) * d.k)) {
    const rad = Math.round((2.5 + r() * 4) * d.k);
    boulder(x, gy(x) + Math.round(rad * 0.4), rad);
    if (r() < 0.5) boulder(x + rad + u(1), gy(x + rad) + 1, Math.max(1, Math.round(rad * 0.5)));
  }
  // Трава по гребню
  for (let x = 0; x < d.W; x++) {
    if (r() > 0.55) continue;
    const hh = 1 + Math.floor(r() * 3 * d.k);
    ctx.fillStyle = r() < 0.3 ? P.grassHi : P.grass;
    ctx.fillRect(x, gy(x) - hh, 1, hh);
  }
  // Светящиеся корни: ночью синие огоньки на стеблях
  if (P.glow)
    for (let x = Math.round(30 + r() * 60); x < d.W; x += Math.round((70 + r() * 110) * d.k)) {
      const g = gy(x);
      const h = u(5) + Math.round(r() * u(3));
      ctx.fillStyle = 'rgba(143,227,255,.06)';
      disc(ctx, x, g - h, u(7));
      ctx.fillStyle = 'rgba(143,227,255,.1)';
      disc(ctx, x, g - h, u(4));
      ctx.fillStyle = P.grassHi;
      ctx.fillRect(x, g - h, 1, h);
      ctx.fillRect(x - 1, g - Math.round(h * 0.4), 1, 1);
      ctx.fillRect(x + 1, g - Math.round(h * 0.6), 1, 1);
      ctx.fillStyle = P.glow;
      ctx.fillRect(x - 1, g - h - 1, 3, 2);
      ctx.fillRect(x - 2, g - Math.round(h * 0.4) - 1, 1, 1);
      ctx.fillRect(x + 2, g - Math.round(h * 0.6) - 1, 1, 1);
    }
}

export function drawMid(ctx: Ctx, P: MidPal, d: Dims, geo: Geo | null) {
  const Hc = d.HMID;
  const u = (v: number) => Math.max(1, Math.round(v * d.k));
  const r = rng(23);
  const p = [r() * 6, r() * 6];
  const hill = (x: number) =>
    Math.round(
      Hc -
        (d.H * 0.17 +
          Math.sin(x * 0.021 + p[0]) * d.H * 0.045 +
          Math.sin(x * 0.07 + p[1]) * d.H * 0.015),
    );
  ctx.fillStyle = P.hill;
  for (let x = 0; x < d.W; x++) {
    const t = hill(x);
    ctx.fillRect(x, t, 1, Hc - t);
  }
  ctx.fillStyle = P.water;
  for (let x = Math.round(OFF + d.VW * 0.42); x < Math.min(d.W, OFF + d.VW * 1.05); x++)
    ctx.fillRect(x, hill(x) + Math.round(d.H * 0.05 + Math.sin(x * 0.06) * d.H * 0.02), 2, 1);
  const nT = Math.round(d.W / 9);
  for (let i = 0; i < nT; i++) {
    const tx = (r() * d.W) | 0;
    const rr = Math.max(2, Math.round((1.5 + r() * 2.5) * d.k));
    const ty = hill(tx) - rr;
    ctx.fillStyle = P.trunk;
    ctx.fillRect(tx, ty + rr - 1, 1, rr + 1);
    ctx.fillStyle = P.tree;
    disc(ctx, tx, ty, rr);
    if (P.treeHi) {
      ctx.fillStyle = P.treeHi;
      ctx.fillRect(
        tx - Math.round(rr * 0.5),
        ty - Math.round(rr * 0.5),
        Math.max(1, Math.round(rr * 0.6)),
        1,
      );
    }
  }
  const roofTri = (cx: number, base: number, half: number, col: string) => {
    ctx.fillStyle = col;
    for (let i = 0; half - i >= 0; i++)
      ctx.fillRect(cx - half + i, base - i, (half - i) * 2 + 1, 1);
  };
  const onion = (cx: number, base: number, w: number, col: string) => {
    [w, w + 2, w + 2, w + 1, w - 1, w - 3, w - 5, 1, 1].forEach((rw, i) => {
      rw = Math.max(1, rw);
      ctx.fillStyle = col;
      ctx.fillRect(cx - Math.floor(rw / 2), base - i, rw, 1);
      if (i > 0 && i < 5 && rw > 2) {
        ctx.fillStyle = P.domeHi;
        ctx.fillRect(cx - Math.floor(rw / 2) + 1, base - i, 1, 1);
      }
    });
  };
  // Окна запоминаются: ночью живой слой зажигает их по одному
  const win = (x: number, y: number, w: number, h: number) => {
    ctx.fillRect(x, y, w, h);
    geo?.windows.push({ x0: x, y0: y, x1: x + w, y1: y + h });
  };
  const izba = (x: number, w: number) => {
    const g = hill(x) + 1;
    const bw = u(w);
    const bh = u(w * 0.6);
    ctx.fillStyle = P.wood;
    ctx.fillRect(x, g - bh, bw, bh);
    const cx = x + Math.floor(bw / 2);
    const half = Math.ceil(bw / 2) + 1;
    roofTri(cx, g - bh - 1, half, P.roof);
    // Печная труба на правом скате
    const chx = cx + Math.round(half * 0.45);
    const chy = g - bh - 1 - (half - Math.round(half * 0.45)) - u(2);
    ctx.fillStyle = P.trunk;
    ctx.fillRect(chx, chy, Math.max(1, u(1.2)), u(2.5));
    geo?.chimneys.push({ x: chx, y: chy - 1 });
    ctx.fillStyle = P.win;
    win(cx - 1, g - Math.round(bh * 0.65), 2, Math.max(1, u(1.4)));
  };
  // Ветряная мельница: сруб к верху уже, крылья крутит живой слой
  const mill = (x: number) => {
    const g = hill(x) + 1;
    const bw = u(7);
    const bh = u(10);
    ctx.fillStyle = P.wood;
    for (let i = 0; i < bh; i++) {
      const w = bw - Math.round((i / bh) * u(2.5));
      ctx.fillRect(x - Math.floor(w / 2), g - i, w, 1);
    }
    const half = Math.ceil((bw - u(2.5)) / 2) + 1;
    roofTri(x, g - bh, half, P.roof);
    ctx.fillStyle = P.trunk;
    ctx.fillRect(x - 1, g - u(3), 2, u(3));
    ctx.fillStyle = P.win;
    win(x, g - Math.round(bh * 0.65), 1, Math.max(1, u(1.5)));
    return { x, y: g - bh - Math.round(half * 0.4) };
  };
  // Терем с шатровой крышей и боковой башенкой
  const terem = (x: number): Box => {
    const g = hill(x) + 2;
    const bw = u(16),
      bh = u(10),
      tw = u(11),
      th = u(8),
      rh = u(13);
    ctx.fillStyle = P.wood;
    ctx.fillRect(x, g - bh, bw, bh);
    const ux = x + Math.round((bw - tw) / 2);
    ctx.fillRect(ux, g - bh - th, tw, th);
    const sx = x - u(5);
    ctx.fillRect(sx, g - u(16), u(5), u(16));
    ctx.fillStyle = P.win;
    for (let i = 0; i < 3; i++) win(x + u(2) + i * u(5), g - bh + u(3), u(2), u(3));
    win(ux + u(2), g - bh - th + u(3), u(2), u(2));
    win(ux + tw - u(4), g - bh - th + u(3), u(2), u(2));
    const cx = ux + Math.floor(tw / 2);
    ctx.fillStyle = P.roof;
    for (let i = 0; i < rh; i++) {
      const half = Math.max(0, Math.round(u(6.5) * (1 - i / rh)));
      ctx.fillRect(cx - half, g - bh - th - 1 - i, half * 2 + 1, 1);
    }
    onion(cx, g - bh - th - rh, u(3), P.dome);
    roofTri(sx + Math.floor(u(5) / 2), g - u(16) - 1, Math.ceil(u(5) / 2), P.roof);
    onion(sx + Math.floor(u(5) / 2), g - u(16) - u(3) - 1, u(2), P.dome);
    return { x0: sx - 2, x1: x + bw + 2, y0: g - bh - th - rh - u(10), y1: g };
  };
  // Белокаменный храм с закомарами и луковичными главами
  const church = (x: number): Box => {
    const g = hill(x) + 2;
    const bw = u(20),
      bh = u(14);
    ctx.fillStyle = P.wall;
    ctx.fillRect(x, g - bh, bw, bh);
    for (let i = 0; i < 3; i++)
      disc(ctx, x + Math.round(bw / 6 + (i * bw) / 3), g - bh, Math.max(1, Math.round(bw / 7)));
    const cx = x + Math.floor(bw / 2);
    const dw = u(6),
      dh = u(6);
    ctx.fillRect(cx - Math.floor(dw / 2), g - bh - u(3) - dh, dw, dh + u(3));
    const sides = [x + u(3), x + bw - u(3)];
    sides.forEach((sx) => ctx.fillRect(sx - Math.floor(u(3) / 2), g - bh - u(5), u(3), u(5)));
    ctx.fillStyle = P.win;
    for (let i = 0; i < 3; i++) win(x + Math.round(bw / 6 + (i * bw) / 3), g - bh + u(4), 1, u(4));
    onion(cx, g - bh - u(3) - dh - 1, u(7), P.domeMain);
    sides.forEach((sx) => onion(sx, g - bh - u(5) - 1, u(4), P.dome));
    return { x0: x - 2, x1: x + bw + 2, y0: g - bh - dh - u(18), y1: g };
  };
  (
    [
      [0.62, 8],
      [0.7, 7],
      [1.32, 8],
      [1.48, 6],
    ] as [number, number][]
  ).forEach(([f, w]) => izba(Math.round(OFF + d.VW * f), w));
  const t1 = terem(Math.round(OFF + d.VW * 0.9));
  const t2 = church(Math.round(OFF + d.VW * 1.12));
  const hub = mill(Math.round(OFF + d.VW * 0.4));
  if (geo) {
    geo.terem = [t1, t2];
    geo.mill = hub;
  }
}

export function drawFore(ctx: Ctx, P: ForePal, d: Dims, geo: Geo | null) {
  const Hc = d.HFORE;
  const u = (v: number) => Math.max(1, Math.round(v * d.k));
  const r = rng(41);
  const p = r() * 6;
  const gy = (x: number) => Math.round(Hc - (d.H * 0.085 + Math.sin(x * 0.03 + p) * d.H * 0.012));
  const fireX = [Math.round(OFF + d.VW * 0.17), Math.round(OFF + d.VW * 1.18)];
  const wolfX = Math.round(OFF + d.VW * 0.6);
  const pine = (x: number, g: number, h: number) => {
    ctx.fillStyle = P.pine;
    const step = Math.max(3, u(5));
    for (let i = 0; i < h; i++) {
      const half = Math.max(0, Math.round((h - i) / 3.2) - (i % step === 0 ? 1 : 0));
      ctx.fillRect(x - half, g - i, half * 2 + 1, 1);
    }
  };
  const birch = (x: number, g: number, h: number) => {
    const tw = Math.max(1, u(1.4));
    ctx.fillStyle = P.leaf;
    for (let i = 0; i < 4; i++) {
      const ox = Math.round((r() - 0.5) * h * 0.35);
      const oy = Math.round(r() * h * 0.45);
      const rad = Math.max(2, Math.round(h * (0.12 + r() * 0.08)));
      disc(ctx, x + ox, g - h + oy, rad);
    }
    ctx.fillStyle = P.birch;
    ctx.fillRect(x, g - h + Math.round(h * 0.25), tw, Math.round(h * 0.75));
    ctx.fillStyle = P.birchMark;
    for (let y = g - Math.round(h * 0.7); y < g - 1; y += 3)
      ctx.fillRect(x + (r() < 0.5 ? 0 : tw - 1), y, 1, 1);
  };
  let x = 2;
  while (x < d.W) {
    const center = x > OFF + d.VW * 0.28 && x < OFF + d.VW * 0.72;
    const h = Math.round((center ? 8 + r() * 9 : 13 + r() * 20) * d.k);
    const kind = r();
    const clear = fireX.some((f) => Math.abs(f - x) < u(9)) || Math.abs(wolfX - x) < u(4);
    if (!clear) (kind < 0.45 ? birch : pine)(x, gy(x) + 1, h);
    x += Math.round((5 + r() * 10) * d.k);
  }
  // Сухое дерево перед лесом: сук вправо, обломанная верхушка влево. Ночью на суку сидит сова
  const sx = Math.round(OFF + d.VW * 0.07);
  const sw = Math.max(2, u(2));
  const sh = u(27);
  const sg = gy(sx) + 1;
  ctx.fillStyle = P.snag;
  ctx.fillRect(sx, sg - sh, sw, sh);
  const by = sg - Math.round(sh * 0.62);
  for (let i = 0; i < u(7); i++) ctx.fillRect(sx + sw + i, by - Math.floor(i / 3), 1, 1);
  for (let i = 0; i < u(4); i++) ctx.fillRect(sx - 1 - i, sg - sh + u(3) - Math.floor(i / 2), 1, 1);
  if (geo) geo.owl = { x: sx + sw + u(4), y: by - Math.floor(u(4) / 3) - 1 };
  ctx.fillStyle = P.ground;
  for (let xx = 0; xx < d.W; xx++) {
    const t = gy(xx);
    ctx.fillRect(xx, t, 1, Hc - t);
  }
  for (let xx = 0; xx < d.W; xx++) {
    const roll = r();
    const hh = 1 + Math.floor(r() * 3);
    const hi = r();
    const dewRoll = r();
    if (roll >= 0.65) continue;
    const top = gy(xx) - hh;
    ctx.fillStyle = hi < 0.3 ? P.grassHi : P.grass;
    ctx.fillRect(xx, top, 1, hh);
    if (dewRoll < 0.2 && hh >= 2) {
      if (P.dew) {
        ctx.fillStyle = P.dew;
        ctx.fillRect(xx, top, 1, 1);
      }
      geo?.dew.push([xx, top]);
    }
  }
  // Ручей вдоль переднего плана
  const xs = Math.round(OFF + d.VW * 0.3);
  const xe = Math.min(d.W - 1, Math.round(OFF + d.VW * 1.65));
  let y0 = Hc;
  let y1 = 0;
  const bank = new Int16Array(d.W).fill(-1);
  for (let xx = xs; xx <= xe; xx++) {
    const fade = Math.min(1, (xx - xs) / 12);
    const cy = gy(xx) + Math.round(d.H * 0.035 + Math.sin(xx * 0.045 + 1) * d.H * 0.013);
    const t = Math.max(
      1,
      Math.round((1.5 + Math.sin(xx * 0.08) * 0.8) * Math.max(1, d.k * 0.9) * fade),
    );
    ctx.fillStyle = P.bank;
    ctx.fillRect(xx, cy - t - 1, 1, 1);
    ctx.fillRect(xx, cy + t + 1, 1, 1);
    ctx.fillStyle = P.water;
    ctx.fillRect(xx, cy - t, 1, t * 2 + 1);
    if ((xx * 7) % 11 === 0) {
      ctx.fillStyle = P.waterHi;
      ctx.fillRect(xx, cy - t + ((xx >> 2) % (t * 2 + 1)), 1, 1);
    }
    y0 = Math.min(y0, cy - t - 1);
    y1 = Math.max(y1, cy + t + 1);
    bank[xx] = cy - t - 1;
    if (geo) for (let y = cy - t; y <= cy + t; y++) geo.water.push([xx, y]);
  }
  if (geo) geo.stream = { x0: xs, x1: xe, y0, y1 };
  fireX.forEach((f) => {
    const g = gy(f);
    ctx.fillStyle = P.stone;
    for (let i = -u(4); i <= u(4); i += 2) ctx.fillRect(f + i, g - 1, 1, 1);
    ctx.fillStyle = P.log;
    for (let i = 0; i < u(4); i++) {
      ctx.fillRect(f - u(3) + i, g - 2 - Math.floor(i / 2), 1, 1);
      ctx.fillRect(f + u(3) - i, g - 2 - Math.floor(i / 2), 1, 1);
    }
    geo?.fires.push({ x: f, y: g - 2 });
  });
  if (geo) geo.wolf = { x: wolfX, y: gy(wolfX) - u(7) };
  // Своя последовательность случайных чисел: деревья и роса выше остаются на прежних местах
  const q = rng(73);
  // Плетень у околицы, на высоком колу петух
  const f0 = Math.round(OFF + d.VW * 0.22);
  const f1 = Math.round(OFF + d.VW * 0.3);
  const postX = Math.round(OFF + d.VW * 0.235);
  ctx.fillStyle = P.wattle;
  for (let xx = f0; xx <= f1; xx += Math.max(3, u(3))) {
    const tall = Math.abs(xx - postX) < Math.max(3, u(3)) / 2;
    ctx.fillRect(xx, gy(xx) - (tall ? u(8) : u(5)), 1, tall ? u(8) : u(5));
  }
  for (const lv of [u(1.5), u(3.5)])
    for (let xx = f0; xx <= f1; xx++) ctx.fillRect(xx, gy(xx) - lv - ((xx >> 1) & 1), 1, 1);
  // Пасека: две колоды под дощатыми крышами
  const hive = (x: number) => {
    const g = gy(x) + 1;
    const w = u(4);
    const h = u(7);
    ctx.fillStyle = P.hive;
    ctx.fillRect(x - (w >> 1), g - h, w, h);
    ctx.fillStyle = P.hiveDark;
    for (let yy = g - h + 2; yy < g; yy += 3) ctx.fillRect(x - (w >> 1), yy, w, 1);
    ctx.fillStyle = P.log;
    ctx.fillRect(x - (w >> 1) - 1, g - h - 1, w + 2, 1);
    ctx.fillStyle = P.hiveDark;
    ctx.fillRect(x, g - Math.round(h * 0.55), 1, 1);
    return { x, y: g - Math.round(h * 0.55) };
  };
  const hx = Math.round(OFF + d.VW * 1.3);
  const h2 = Math.round(OFF + d.VW * 1.33);
  const entry = hive(hx);
  hive(h2);
  // Цветы: россыпь у пасеки и редкие на лугу
  const flowers: Pt[] = [];
  const flower = (x: number) => {
    const g = gy(x);
    const h = 1 + Math.floor(q() * 2.5 * d.k);
    ctx.fillStyle = P.grassHi;
    ctx.fillRect(x, g - h, 1, h);
    ctx.fillStyle = P.petals[(q() * P.petals.length) | 0];
    ctx.fillRect(x, g - h - 1, 1, 1);
    if (q() < 0.4) ctx.fillRect(x - 1, g - h, 1, 1);
    flowers.push({ x, y: g - h - 1 });
  };
  for (
    let xx = Math.round(OFF + d.VW * 1.2);
    xx < Math.round(OFF + d.VW * 1.44);
    xx += 2 + ((q() * 4) | 0)
  )
    if (Math.abs(xx - hx) > u(3) && Math.abs(xx - h2) > u(3)) flower(xx);
  for (
    let xx = Math.round(OFF + d.VW * 0.42);
    xx < Math.round(OFF + d.VW * 0.9);
    xx += 6 + ((q() * 12) | 0)
  )
    flower(xx);
  if (geo) {
    geo.perch = { x: postX, y: gy(postX) - u(8) - 1 };
    geo.hive = entry;
    geo.apiary = { x0: hx - u(4), x1: h2 + u(4), y0: gy(hx) - u(9), y1: gy(hx) + 2 };
    geo.flowers = flowers;
    geo.bank = bank;
    geo.ground = Int16Array.from({ length: d.W }, (_, i) => gy(i));
  }
}
