import { achStore, markFound, unlock } from '@/lib/achievements';
import { lightAt, TOD } from '@/lib/daylight';
import { burst } from '@/lib/fx';
import { toast } from '@/lib/toast';
import { setNear } from '@/lib/ui';

import {
  type Box,
  CLOUD_DUSK,
  type Ctx,
  type Dims,
  disc,
  drawAurora,
  drawCloudGlow,
  drawClouds,
  drawCosmos,
  drawFar,
  drawFore,
  drawGround,
  drawHaze,
  drawMid,
  drawMist,
  drawSky,
  drawSun,
  emptyGeo,
  PAL,
  PLANETS,
  rng,
  S,
  SKIES,
} from './draw';
import { createFauna, type Hit, type Layer, type LiveCtx, season } from './fauna';

/** На сколько экрана поднимается земля под ногами, когда страница докручена до конца. */
const LIFT = 0.34;
/** За сколько на закате разгораются костры и слетаются светлячки, мс. */
const KINDLE = 9000;
/** Сколько светлячков летает ночью; остальные прилетают на луг только на закате. */
const NIGHT_FLIES = 12;
/** Сколько звёзд проступает на закате, когда начинается и за сколько заканчивается, мс. */
const EVENING_STARS = 24;
const STARS_FROM = 4000;
const STARS_FOR = 14000;
/** Закатное солнце: 74vw и --sun-x из globals.css, доли ширины экрана. */
const DUSK_SUN_X = 0.97;
/** Сдвиг слоя на «Контактах» за вкладку: --sx в setPage, доля ширины экрана. */
const PAGE_SHIFT = 0.22;
/** Клик или наведение по интерфейсу не должны срабатывать как поиск тайника за ним. */
const UI_SELECTOR = 'a, button, .glass, .solid, h1, h2, p, dl, ul, .xpdock, .tabs';
const LEAF_COLORS = ['#C9762E', '#E0A33A', '#8DB04A', '#B5482E', '#D9C04A'];
/** Что летит с неба: осенью листья, зимой снег, весной лепестки, летом тополиный пух. vy — от и разброс. */
const FALLS = {
  autumn: { n: 14, colors: LEAF_COLORS, vy: [0.1, 0.14], sway: 0.18, dot: false },
  winter: {
    n: 70,
    colors: ['#FFFFFF', '#E6EEFF', '#CFDCF5'],
    vy: [0.12, 0.18],
    sway: 0.12,
    dot: true,
  },
  spring: {
    n: 16,
    colors: ['#F7C3D3', '#FFFFFF', '#F2A7BF'],
    vy: [0.07, 0.09],
    sway: 0.22,
    dot: false,
  },
  summer: { n: 12, colors: ['#FFFFFF', '#F4F0E4'], vy: [0.02, 0.04], sway: 0.25, dot: true },
};

interface Spot {
  id: string;
  el: HTMLElement;
  off: boolean;
  /** Тайник на звере: двигается и прячется вместе с ним. */
  hit?: Hit;
  css?: string;
}
interface Star {
  x: number;
  y: number;
  ph: number;
  sp: number;
  bright: boolean;
}
/** Точка закатной дорожки: w — сила, у самого солнца она больше. */
interface Glint {
  x: number;
  y: number;
  ph: number;
  w: number;
}
interface Fly {
  x: number;
  y: number;
  ph: number;
  vx: number;
}
interface Leaf {
  x: number;
  y: number;
  vy: number;
  ph: number;
  sw: number;
  c: string;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}
interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

export interface SceneEngine {
  setPage: (page: number) => void;
  destroy: () => void;
}

export function createScene(root: HTMLElement): SceneEngine {
  const one = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const SEASON = season();
  const FALL = FALLS[SEASON];

  const skies = [...root.querySelectorAll<HTMLCanvasElement>('.sky-c')];
  const cv = {
    cosmos: one<HTMLCanvasElement>('[data-c="cosmos"]'),
    clouds: one<HTMLCanvasElement>('[data-c="clouds"]'),
    cloudsD: one<HTMLCanvasElement>('[data-c="cloudsD"]'),
    cloudsL: one<HTMLCanvasElement>('[data-c="cloudsL"]'),
    sun: one<HTMLCanvasElement>('[data-c="sun"]'),
    farN: one<HTMLCanvasElement>('[data-c="farN"]'),
    farD: one<HTMLCanvasElement>('[data-c="farD"]'),
    midN: one<HTMLCanvasElement>('[data-c="midN"]'),
    midD: one<HTMLCanvasElement>('[data-c="midD"]'),
    foreN: one<HTMLCanvasElement>('[data-c="foreN"]'),
    foreD: one<HTMLCanvasElement>('[data-c="foreD"]'),
    fg: one<HTMLCanvasElement>('[data-c="fg"]'),
    groundN: one<HTMLCanvasElement>('[data-c="groundN"]'),
    groundD: one<HTMLCanvasElement>('[data-c="groundD"]'),
    haze: one<HTMLCanvasElement>('[data-c="haze"]'),
    fx: one<HTMLCanvasElement>('[data-c="fx"]'),
    aur0: one<HTMLCanvasElement>('[data-c="aur0"]'),
    aur1: one<HTMLCanvasElement>('[data-c="aur1"]'),
    farFx: one<HTMLCanvasElement>('[data-c="farFx"]'),
    midFx: one<HTMLCanvasElement>('[data-c="midFx"]'),
    mist: one<HTMLCanvasElement>('[data-c="mist"]'),
  };
  const layers = [...root.querySelectorAll<HTMLElement>('.layer')];
  const lSky = one<HTMLElement>('[data-l="sky"]');
  const lFar = one<HTMLElement>('[data-l="far"]');
  const arcane = one<HTMLElement>('.arcane');
  const lMid = one<HTMLElement>('[data-l="mid"]');
  const lFore = one<HTMLElement>('[data-l="fore"]');
  const fxc = cv.fx.getContext('2d')!;

  const d: Dims = { VW: 0, H: 0, W: 0, WS: 0, m: 1, k: 1, HFAR: 0, HMID: 0, HFORE: 0, HGROUND: 0 };
  const u = (v: number) => Math.max(1, Math.round(v * d.k));
  let geo = emptyGeo();
  let fgc: Ctx | null = null;
  let live: LiveCtx | null = null;
  let cur = 0;
  let firstPage = true;
  let tod = 0;
  let todTarget = 0;
  let spots: Spot[] = [];
  let destroyed = false;
  let raf = 0;
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timeouts.delete(t);
      fn();
    }, ms);
    timeouts.add(t);
  };
  const mailbox = () => pageEl()?.querySelector<HTMLElement>('.link.primary') ?? null;
  const fauna = createFauna({
    reduce,
    mailbox: () => mailbox()?.getBoundingClientRect() ?? null,
    // Письмо долетело: карточка Telegram вспыхивает, из-за её края сыплются искры
    delivered: () => {
      const el = mailbox();
      if (!el) return;
      const r = el.getBoundingClientRect();
      burst(r.right - 36, r.top + r.height / 2, ['#F7F3EA', '#FFF1B0', '#C8443A'], 10, 50);
      el.classList.add('mail');
      later(() => el.classList.remove('mail'), 1500);
    },
  });

  /* ---------- размеры и отрисовка статичных слоёв ---------- */

  // Размеры выставляются синхронно до первого кадра, само рисование откладывается: так нет сдвигов вёрстки
  function sizeScene() {
    d.VW = innerWidth / S;
    d.H = Math.ceil(innerHeight / S);
    d.W = Math.ceil((innerWidth * 1.9 + 128) / S);
    d.WS = Math.ceil((innerWidth * 1.12 + 128) / S);
    d.m = Math.min(d.VW, d.H);
    d.k = Math.max(0.7, d.H / 210);
    d.HFAR = Math.ceil(d.H * 0.5);
    d.HMID = Math.ceil(d.H * 0.5);
    d.HFORE = Math.ceil(d.H * 0.42);
    d.HGROUND = Math.ceil((innerHeight * LIFT) / S) + 4;
    const size = (c: HTMLCanvasElement, w: number, h: number) => {
      c.width = w;
      c.height = h;
      c.style.width = `${w * S}px`;
      c.style.height = `${h * S}px`;
    };
    skies.forEach((c) => size(c, d.WS, d.H));
    size(cv.cosmos, d.WS, d.H);
    size(cv.clouds, d.WS, Math.ceil(d.H * 0.45));
    size(cv.cloudsD, d.WS, Math.ceil(d.H * 0.45));
    size(cv.cloudsL, d.WS, Math.ceil(d.H * 0.45));
    size(cv.farN, d.W, d.HFAR);
    size(cv.farD, d.W, d.HFAR);
    size(cv.midN, d.W, d.HMID);
    size(cv.midD, d.W, d.HMID);
    size(cv.foreN, d.W, d.HFORE);
    size(cv.foreD, d.W, d.HFORE);
    size(cv.fg, d.W, d.HFORE);
    size(cv.groundN, d.W, d.HGROUND);
    size(cv.groundD, d.W, d.HGROUND);
    size(cv.haze, d.WS, d.H);
    size(cv.aur0, d.WS, Math.ceil(d.H * 0.5));
    size(cv.aur1, d.WS, Math.ceil(d.H * 0.5));
    size(cv.farFx, d.W, d.HFAR);
    size(cv.midFx, d.W, d.HMID);
    size(cv.mist, d.W, d.HFORE);
  }
  const ctx2d = (c: HTMLCanvasElement) => {
    const x = c.getContext('2d')!;
    x.imageSmoothingEnabled = false;
    return x;
  };

  let drawToken = 0;
  function drawScene() {
    if (destroyed) return;
    const token = ++drawToken;
    sizeScene();
    geo = emptyGeo();
    initFx();
    measureLift();
    // Сначала то, что видно ночью на главной, остальное — маленькими порциями, чтобы не блокировать поток
    const jobs: (() => void)[] = [
      () => drawSky(ctx2d(skies[0]), SKIES[0], d.WS, d.H),
      () => drawCosmos(ctx2d(cv.cosmos), d),
      () => {
        drawAurora(ctx2d(cv.aur0), d, 0);
        drawAurora(ctx2d(cv.aur1), d, 1);
      },
      () => {
        drawFar(ctx2d(cv.farN), PAL.far.n, d, geo);
        placeArcane();
      },
      () => drawMid(ctx2d(cv.midN), PAL.mid.n, d, geo),
      () => {
        drawFore(ctx2d(cv.foreN), PAL.fore.n, d, geo);
        placeGlints();
        fgc = ctx2d(cv.fg);
        live = { far: ctx2d(cv.farFx), mid: ctx2d(cv.midFx), fore: fgc, fx: fxc };
        fauna.reset(d, geo, EW, EH);
        placeSpots();
      },
      () => drawMist(ctx2d(cv.mist), d, geo),
      () => drawGround(ctx2d(cv.groundN), PAL.ground.n, d),
      () => drawSky(ctx2d(skies[1]), SKIES[1], d.WS, d.H),
      () => drawSky(ctx2d(skies[2]), SKIES[2], d.WS, d.H),
      () => drawSky(ctx2d(skies[3]), SKIES[3], d.WS, d.H),
      () => drawClouds(ctx2d(cv.clouds), d),
      () => drawClouds(ctx2d(cv.cloudsD), d, CLOUD_DUSK),
      () => drawCloudGlow(ctx2d(cv.cloudsL), d),
      () => drawHaze(ctx2d(cv.haze), d),
      () => drawSun(ctx2d(cv.sun)),
      () => drawFar(ctx2d(cv.farD), PAL.far.d, d, null),
      () => drawMid(ctx2d(cv.midD), PAL.mid.d, d, null),
      () => drawFore(ctx2d(cv.foreD), PAL.fore.d, d, null),
      () => drawGround(ctx2d(cv.groundD), PAL.ground.d, d),
      () => {
        if (reduce) frame(0);
      },
    ];
    const step = () => {
      if (token !== drawToken || destroyed || !jobs.length) return;
      jobs.shift()!();
      later(step, 0);
    };
    step();
  }

  /* ---------- живой слой: звёзды, кометы, светлячки, листья, костры, вода, роса, глаза, звери ---------- */

  let EW = 0;
  let EH = 0;
  let stars: Star[] = [];
  let evening: Star[] = [];
  let glints: Glint[] = [];
  let flies: Fly[] = [];
  let leaves: Leaf[] = [];
  let comet: Comet | null = null;
  let nextComet = 3500;
  const waterSparks = Array.from({ length: 28 }, () => ({ i: 0, life: 1, max: 0 }));
  const dewSparks = Array.from({ length: 18 }, () => ({ i: 0, life: 1, max: 0 }));
  const fireParticles: Particle[][] = [[], []];
  const flare = [0, 0];
  const eyes = { until: 0, next: 9000, on: false };
  let duskSince = 0;
  let duskGlow = 0;

  const newLeaf = (r: () => number = Math.random, anywhere = false): Leaf => ({
    x: r() * EW,
    y: anywhere ? r() * EH : -4,
    vy: FALL.vy[0] + r() * FALL.vy[1],
    ph: r() * 6.28,
    sw: 0.3 + r() * 0.5,
    c: FALL.colors[(r() * FALL.colors.length) | 0],
  });

  function initFx() {
    EW = Math.ceil(innerWidth / S);
    EH = Math.ceil(innerHeight / S);
    cv.fx.width = EW;
    cv.fx.height = EH;
    const r = rng(99);
    stars = Array.from({ length: Math.round((EW * EH) / 600) + 30 }, () => ({
      x: (r() * EW) | 0,
      y: (r() * EH * 0.7) | 0,
      ph: r() * 6.28,
      sp: 6.28 / (3000 + r() * 5000),
      bright: r() > 0.85,
    }));
    // Только верх неба: ниже уже светло, а холмы на закате дневные
    evening = stars.filter((s) => s.y < EH * 0.34).slice(0, EVENING_STARS);
    flies = Array.from({ length: NIGHT_FLIES + 16 }, (_, i) => ({
      x: r() * EW,
      y: EH * (i < NIGHT_FLIES ? 0.62 + r() * 0.33 : 0.85 + r() * 0.1),
      ph: r() * 6.28,
      vx: (r() - 0.5) * 0.08,
    }));
    leaves = Array.from({ length: FALL.n }, () => newLeaf(r, true));
  }

  /** Дорожка лежит на воде прямо под солнцем: слои сдвинуты вкладкой на разную глубину. */
  function placeGlints() {
    const depth = (l: HTMLElement) => Number(l.parentElement!.dataset.depth);
    const shift = 3 * PAGE_SHIFT * innerWidth;
    const sunX = DUSK_SUN_X * innerWidth - depth(lSky) * shift + 44;
    const cx = (sunX + depth(lFore) * shift + 64) / S;
    const half = d.VW * 0.16;
    const r = rng(41);
    glints = [];
    for (const [x, y] of geo.water) {
      const w = 1 - Math.abs(x - cx) / half;
      if (w > 0 && r() < w) glints.push({ x, y, ph: x * 0.7 + y * 2.1, w });
    }
  }

  function drawStar(s: Star, a: number, w: number) {
    fxc.fillStyle = `rgba(237,230,214,${a})`;
    fxc.fillRect(s.x, s.y, 1, 1);
    if (s.bright && w > 0.8) {
      fxc.fillStyle = `rgba(237,230,214,${a * 0.45})`;
      fxc.fillRect(s.x - 1, s.y, 3, 1);
      fxc.fillRect(s.x, s.y - 1, 1, 3);
    }
  }

  function drawFire(
    c: Ctx,
    f: { x: number; y: number },
    t: number,
    glow: number,
    isFlare: boolean,
  ) {
    const sc = (0.55 + 0.45 * glow) * (isFlare ? 1.6 : 1) * d.k;
    if (glow > 0.05) {
      const w = 0.85 + 0.15 * Math.sin(t / 90 + f.x) * Math.sin(t / 37);
      for (const [rad, a] of [
        [26, 0.035],
        [17, 0.05],
        [10, 0.07],
      ]) {
        c.fillStyle = `rgba(242,140,56,${a * glow * w})`;
        disc(c, f.x, f.y - 2, Math.round(rad * d.k * w));
      }
    }
    const cw = Math.max(1, Math.round(d.k * 0.9));
    for (let col = -3; col <= 3; col++) {
      const base = (7 - Math.abs(col) * 1.7) * sc;
      const h = Math.max(
        1,
        Math.round(
          base *
            (0.65 + 0.35 * Math.abs(Math.sin(t / (70 + Math.abs(col) * 13) + col * 1.7 + f.x))),
        ),
      );
      const x = f.x + col * cw;
      for (let i = 0; i < h; i++) {
        const q = i / h;
        c.fillStyle = q < 0.3 ? '#FFF1B0' : q < 0.6 ? '#F6A23C' : q < 0.85 ? '#E0522F' : '#8E2A1C';
        c.fillRect(x, f.y - i, cw, 1);
      }
    }
  }

  function frame(t: number) {
    tod += (todTarget - tod) * 0.06;
    const light = lightAt(tod);
    const { night, dawn, day } = light;
    // С заката сразу в ночь время суток пролетает его за 6 кадров: огни гаснут так же, как перетекает небо
    duskGlow =
      reduce || light.dusk > duskGlow ? light.dusk : duskGlow + (light.dusk - duskGlow) * 0.06;
    const dusk = duskGlow;
    const kindle = reduce ? 1 : Math.max(0, Math.min(1, (t - duskSince) / KINDLE));
    // На закате костёр горит сильнее ночного: его приглушает наложение .dusk
    const blaze = Math.max(night, 2 * dusk * kindle);

    fxc.clearRect(0, 0, EW, EH);
    if (night > 0.02) {
      for (const s of stars) {
        const w = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        drawStar(s, night * (0.15 + 0.85 * w * w * w), w);
      }
      if (!comet && night > 0.45 && t > nextComet && !reduce)
        comet = {
          x: EW * (0.35 + Math.random() * 0.6),
          y: EH * (0.02 + Math.random() * 0.22),
          vx: -(1.1 + Math.random() * 0.6),
          vy: 0.5 + Math.random() * 0.35,
          life: 0,
          max: 72,
        };
    }
    // Первые звёзды проступают по одной и слабо мерцают: при reduced motion они уже на месте
    if (dusk > 0.02) {
      const dim = reduce ? 1 : (t - duskSince - STARS_FROM) / STARS_FOR;
      evening.forEach((s, i) => {
        const come = Math.max(0, Math.min(1, dim * evening.length - i));
        if (!come) return;
        const w = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        drawStar(s, dusk * come * (0.55 + 0.45 * w), w);
      });
    }
    // Светлячки: ночью летают все сразу, на закате появляются по одному
    if (night > 0.02 || dusk > 0.02)
      flies.forEach((f, i) => {
        f.x += f.vx + Math.sin(t / 900 + f.ph) * 0.05;
        f.y += Math.sin(t / 1300 + f.ph) * 0.04;
        if (f.x < 0) f.x = EW;
        if (f.x > EW) f.x = 0;
        const come = Math.max(0, Math.min(1, kindle * flies.length - i));
        const a =
          Math.max(i < NIGHT_FLIES ? night : 0, dusk * come) *
          (0.45 + 0.55 * Math.sin(t / 380 + f.ph));
        if (a > 0.05) {
          fxc.fillStyle = `rgba(200,240,122,${a * 0.22})`;
          fxc.fillRect((f.x | 0) - 1, (f.y | 0) - 1, 3, 3);
          fxc.fillStyle = `rgba(214,250,140,${a})`;
          fxc.fillRect(f.x | 0, f.y | 0, 1, 1);
        }
      });
    if (comet) {
      comet.life++;
      comet.x += comet.vx;
      comet.y += comet.vy;
      const a =
        Math.max(0, Math.min(1, comet.life / 8, (comet.max - comet.life) / 12)) *
        Math.max(night, 0.3);
      for (let i = 1; i <= 16; i++) {
        fxc.fillStyle = `rgba(220,230,255,${a * (1 - i / 16) * 0.8})`;
        fxc.fillRect(
          Math.round(comet.x - comet.vx * i * 0.9),
          Math.round(comet.y - comet.vy * i * 0.9),
          1,
          1,
        );
      }
      fxc.fillStyle = `rgba(255,255,255,${a})`;
      fxc.fillRect(comet.x | 0, comet.y | 0, 2, 1);
      fxc.fillRect(comet.x | 0, (comet.y | 0) - 1, 1, 3);
      if (comet.life > comet.max) {
        comet = null;
        nextComet = t + 7000 + Math.random() * 9000;
      }
    }
    fxc.globalAlpha = 0.45 + 0.55 * Math.min(1, tod);
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      l.y += l.vy;
      l.x += Math.sin((t / 700) * l.sw + l.ph) * FALL.sway;
      if (l.y > EH + 2) leaves[i] = newLeaf();
      const flip = !FALL.dot && Math.sin(t / 400 + l.ph) > 0;
      fxc.fillStyle = l.c;
      fxc.fillRect(l.x | 0, l.y | 0, flip ? 2 : 1, flip || FALL.dot ? 1 : 2);
    }
    fxc.globalAlpha = 1;

    if (!fgc) return;
    const c = fgc;
    c.clearRect(0, 0, cv.fg.width, cv.fg.height);
    geo.fires.forEach((f, n) => {
      const isFlare = t < flare[n];
      drawFire(c, f, t, blaze, isFlare);
      const P = fireParticles[n];
      if (P.length < (isFlare ? 22 : 10) && Math.random() < 0.35)
        P.push({
          x: f.x + (Math.random() - 0.5) * 4,
          y: f.y - 6 * d.k,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -(0.2 + Math.random() * 0.3),
          life: 0,
          max: 40 + Math.random() * 40,
        });
      for (let j = P.length - 1; j >= 0; j--) {
        const q = P[j];
        q.life++;
        q.x += q.vx + Math.sin(q.life / 6) * 0.05;
        q.y += q.vy;
        if (q.life > q.max) {
          P.splice(j, 1);
          continue;
        }
        const a = 1 - q.life / q.max;
        if (blaze > 0.4) {
          c.fillStyle = `rgba(242,${120 + ((a * 80) | 0)},56,${a})`;
          c.fillRect(q.x | 0, q.y | 0, 1, 1);
        } else {
          c.fillStyle = `rgba(210,210,220,${a * 0.35})`;
          c.fillRect(q.x | 0, q.y | 0, 2, 2);
        }
      }
    });
    if (geo.water.length)
      for (const s of waterSparks) {
        if (++s.life > s.max || s.i >= geo.water.length) {
          s.i = (Math.random() * geo.water.length) | 0;
          s.life = 0;
          s.max = 12 + Math.random() * 30;
        }
        const [x, y] = geo.water[s.i];
        const a = Math.sin((Math.PI * s.life) / s.max);
        c.fillStyle =
          night > 0.5
            ? `rgba(190,210,255,${a * 0.8})`
            : dusk > 0.5
              ? `rgba(255,214,170,${a})`
              : `rgba(255,255,255,${a})`;
        c.fillRect(x, y, 1, 1);
      }
    // Закатная дорожка разгорается вместе с кострами, блики бегут по воде
    if (dusk > 0.02)
      for (const g of glints) {
        const w = 0.5 + 0.5 * Math.sin(t / 240 + g.ph);
        const a = dusk * kindle * g.w * (0.25 + 0.75 * w);
        if (a < 0.05) continue;
        c.fillStyle = `rgba(255,232,160,${a})`;
        c.fillRect(g.x, g.y, 1, 1);
      }
    // Роса блестит только под высоким солнцем
    const dewLight = day * (1 - dusk);
    if (dewLight > 0.05 && geo.dew.length)
      for (const s of dewSparks) {
        if (++s.life > s.max || s.i >= geo.dew.length) {
          s.i = (Math.random() * geo.dew.length) | 0;
          s.life = 0;
          s.max = 20 + Math.random() * 40;
        }
        const [x, y] = geo.dew[s.i];
        const a = Math.sin((Math.PI * s.life) / s.max);
        c.fillStyle = `rgba(255,255,255,${a * dewLight})`;
        c.fillRect(x, y, 1, 1);
        if (a > 0.8) {
          c.fillStyle = `rgba(220,248,255,${(a - 0.8) * 2 * dewLight})`;
          c.fillRect(x - 1, y, 3, 1);
          c.fillRect(x, y - 1, 1, 3);
        }
      }
    if (t > eyes.next) {
      if (night > 0.55) eyes.until = t + 4200;
      eyes.next = t + 15000 + Math.random() * 9000;
    }
    const eyesOn =
      !!geo.wolf && night > 0.55 && (t < eyes.until || html.classList.contains('senses'));
    if (eyesOn !== eyes.on) {
      eyes.on = eyesOn;
      updateSpots();
    }
    if (eyesOn && geo.wolf && t % 2600 > 150) {
      const { x, y } = geo.wolf;
      const gap = Math.max(2, u(3));
      c.fillStyle = 'rgba(242,208,74,.25)';
      c.fillRect(x - 1, y - 1, 3, 3);
      c.fillRect(x + gap - 1, y - 1, 3, 3);
      c.fillStyle = '#F2D04A';
      c.fillRect(x, y, 1, 1);
      c.fillRect(x + gap, y, 1, 1);
    }
    if (live) {
      fauna.frame({ t, tod, night, dawn, day, dusk }, live);
      syncLive();
    }
  }

  let lastT = 0;
  const loop = (t: number) => {
    if (destroyed) return;
    if (!document.hidden && t - lastT > 33) {
      lastT = t;
      frame(t);
    }
    raf = requestAnimationFrame(loop);
  };

  /* ---------- прокрутка: пейзаж поднимается, внизу страницы видна земля под ногами ---------- */

  let lift = 0;
  let liftRaf = 0;
  const pageEl = () => document.querySelectorAll<HTMLElement>('.page')[cur] ?? null;

  function applyLift() {
    liftRaf = 0;
    const R = innerHeight * LIFT;
    layers.forEach((l) =>
      l.style.setProperty('--sy', `${(-lift * Number(l.dataset.lift) * R).toFixed(1)}px`),
    );
  }

  function measureLift() {
    const el = pageEl();
    const max = el ? el.scrollHeight - el.clientHeight : 0;
    lift = reduce || !el || max <= 0 ? 0 : Math.min(1, el.scrollTop / max);
    if (!liftRaf) liftRaf = requestAnimationFrame(applyLift);
  }

  // scroll не всплывает: ловим прокрутку страниц на погружении, остальные прокрутки (ленты внутри) мимо
  const onScroll = (e: Event) => {
    if (e.target === pageEl()) measureLift();
  };

  /** Сфера над башней мага, в CSS-пикселях внутри дальнего слоя. */
  function placeArcane() {
    if (!geo.tower) return;
    const { x, y } = geo.tower;
    arcane.style.left = `${x * S - 64 + S / 2}px`;
    arcane.style.top = `${innerHeight - (d.HFAR - y) * S}px`;
  }

  /* ---------- тайники ---------- */

  const isFound = (id: string) => achStore.get().found.includes(id);

  /** Положение тайника: холсты слоёв сдвинуты на 64px влево и прижаты к низу, экранный — нет. */
  function boxCss(layer: Layer | 'sky', b: Box) {
    const fromBottom = { sky: 0, fx: 0, far: d.HFAR, mid: d.HMID, fore: d.HFORE }[layer];
    const left = b.x0 * S - (layer === 'fx' ? 0 : 64);
    const top = fromBottom ? innerHeight - (fromBottom - b.y0) * S : b.y0 * S;
    return `left:${left}px;top:${top}px;width:${(b.x1 - b.x0) * S}px;height:${(b.y1 - b.y0) * S}px`;
  }

  function placeSpots() {
    spots.forEach((s) => s.el.remove());
    spots = [];
    const parents = { sky: lSky, far: lFar, mid: lMid, fore: lFore, fx: root };
    const add = (id: string, layer: Layer | 'sky', b: Box, rect = false, hit?: Hit) => {
      const el = document.createElement('i');
      el.className = rect ? 'spot rect' : 'spot';
      const css = boxCss(layer, b);
      el.style.cssText = css;
      parents[layer].appendChild(el);
      spots.push({ id, el, off: false, hit, css });
    };
    PLANETS.forEach((p) => {
      if (p.cx == null || p.cy == null || p.rr == null) return;
      const r = p.rr;
      add(`p-${p.id}`, 'sky', {
        x0: p.cx - r - 2,
        y0: p.cy - r - 2,
        x1: p.cx + r + 3,
        y1: p.cy + r + 3,
      });
    });
    geo.terem.forEach((b, i) => add(`terem${i + 1}`, 'mid', b, true));
    geo.fires.forEach((f, i) =>
      add(`fire${i + 1}`, 'fore', { x0: f.x - u(6), y0: f.y - u(14), x1: f.x + u(6), y1: f.y + 3 }),
    );
    if (geo.stream) {
      const s = geo.stream;
      add('stream', 'fore', { x0: s.x0, y0: s.y0 - 1, x1: s.x1, y1: s.y1 + 1 }, true);
    }
    if (geo.wolf) {
      const { x, y } = geo.wolf;
      add('wolf', 'fore', { x0: x - 3, y0: y - 3, x1: x + u(3) + 4, y1: y + 4 });
    }
    for (const h of fauna.hits)
      add(h.id, h.layer, h.box ?? { x0: 0, y0: 0, x1: 0, y1: 0 }, false, h);
    updateSpots();
  }

  function updateSpots() {
    for (const s of spots) {
      s.off = s.hit
        ? !s.hit.box
        : (s.id.startsWith('p-') && cur >= 2) || (s.id === 'wolf' && !eyes.on);
      s.el.classList.toggle('off', s.off);
      s.el.classList.toggle('found', isFound(s.id));
    }
  }

  /** Тайники на зверях едут за ними каждый кадр; стиль трогается, только когда что-то сдвинулось. */
  function syncLive() {
    for (const s of spots) {
      if (!s.hit) continue;
      const b = s.hit.box;
      if (b) {
        const css = boxCss(s.hit.layer, b);
        if (css !== s.css) s.el.style.cssText = s.css = css;
      }
      if (!b !== s.off) {
        s.off = !b;
        s.el.classList.toggle('off', s.off);
      }
    }
  }

  /** Из накрывающих точку — самый маленький: рамка ручья шире экрана и заходит на зверей и улей на берегу. */
  function spotAt(x: number, y: number) {
    let best: Spot | null = null;
    let least = Infinity;
    for (const s of spots) {
      if (s.off) continue;
      const r = s.el.getBoundingClientRect();
      if (x < r.left - 6 || x > r.right + 6 || y < r.top - 6 || y > r.bottom + 6) continue;
      if (r.width * r.height < least) {
        best = s;
        least = r.width * r.height;
      }
    }
    return best;
  }

  const isUI = (el: EventTarget | null) => el instanceof Element && !!el.closest(UI_SELECTOR);
  const cometAt = (x: number, y: number) =>
    !!comet && Math.hypot(x - comet.x * S, y - comet.y * S) < 46;

  function onSpot(s: Spot, x: number, y: number) {
    const first = markFound(s.id);
    updateSpots();
    if (s.hit) fauna.poke(s.id, performance.now());
    if (s.id.startsWith('p-')) {
      const p = PLANETS.find((q) => `p-${q.id}` === s.id)!;
      const n = PLANETS.filter((q) => isFound(`p-${q.id}`)).length;
      toast(`Планета ${n} из 7. ${p.text}`);
      burst(x, y, [p.light, p.base, '#F5F1EA'], 16, 70);
      unlock('contact');
      if (p.id === 'mars') unlock('mars');
      if (p.id === 'moon') {
        unlock('moon');
        // На Луну отзывается стая на гребне
        fauna.howl(performance.now());
      }
      if (n === PLANETS.length) unlock('spheres');
    } else if (s.id.startsWith('fire')) {
      flare[Number(s.id.slice(4)) - 1] = performance.now() + 1200;
      if (first) toast('Тепло. Можно посидеть, тут хорошо.');
      burst(x, y, ['#F28C38', '#F0C866', '#E0522F'], 20, 80);
      unlock('fire');
    } else if (s.id === 'stream') {
      toast('Двадцать тысяч лье под водой. Капитан Немо передаёт привет.');
      burst(x, y, ['#A9DCF7', '#3E8FCF', '#FFFFFF'], 14, 60);
      unlock('nautilus');
    } else if (s.id.startsWith('terem')) {
      toast('Русский стиль: от терема до Казанского вокзала.');
      burst(x, y, ['#F0C866', '#FFF1B0', '#3D6FB6'], 14, 60);
      unlock('terem');
    } else if (s.id === 'wolf') {
      toast('Это был Белый Волк. Кивнул и ушёл в туман.');
      unlock('wolf');
    } else if (s.id === 'owl') {
      toast('Совы не то, чем кажутся. Агент Купер подтвердит.');
      unlock('owl');
    } else if (s.id === 'hedgehog') {
      toast('Лоша-а-адка! Ёжик ищет её в тумане. Уж не Плотву ли?');
      unlock('hedgehog');
    } else if (s.id.startsWith('cow')) {
      toast('Муу! Мурка из Простоквашино передаёт привет коту Матроскину.');
      unlock('cow');
    } else if (s.id === 'hive') {
      toast(
        SEASON === 'winter'
          ? 'Пчёлы зимуют в колоде. Даже во сне они какие-то неправильные.'
          : 'Это какие-то неправильные пчёлы. И мёд у них, наверное, неправильный.',
      );
      unlock('bees');
    } else if (s.id === 'pigeon') {
      toast('Голубиная почта доставлена. В Telegram, правда, быстрее.');
      burst(x, y, ['#E3E7EF', '#A3ACBF', '#F7F3EA'], 12, 50);
      unlock('pigeon');
    } else if (s.id === 'rooster') {
      if (first) toast('Кукареку! Утро вечера мудренее.');
    }
  }

  /* ---------- указатель ---------- */

  const onClick = (e: MouseEvent) => {
    if (isUI(e.target)) return;
    if (cometAt(e.clientX, e.clientY)) {
      burst(e.clientX, e.clientY, ['#FFFFFF', '#C2AEFF', '#F0C866'], 18, 80);
      comet = null;
      nextComet = performance.now() + 6000;
      toast('Желание загадано. Пусть сбудется, особенно если оно про оффер.');
      unlock('comet');
      return;
    }
    const s = spotAt(e.clientX, e.clientY);
    if (s) onSpot(s, e.clientX, e.clientY);
  };

  let lastX: number | null = null;
  let lastY = 0;
  let dist = 0;
  let moveRaf = 0;
  let target: EventTarget | null = null;
  let hoverSpot: Spot | null = null;
  let hoverSince = 0;
  const floats = () => [...document.querySelectorAll<HTMLElement>('.float[data-depth]')];

  const onMove = (e: PointerEvent) => {
    if (lastX !== null) {
      dist += Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist >= 10000) unlock('steps');
      if (dist >= 42195) unlock('marathon');
    }
    lastX = e.clientX;
    lastY = e.clientY;
    target = e.target;
    if (!fine || moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      const x = lastX ?? 0;
      const y = lastY;
      if (!reduce) {
        const px = x / innerWidth - 0.5;
        const py = y / innerHeight - 0.5;
        layers.forEach((l) => {
          const depth = Number(l.dataset.depth);
          const inner = l.firstElementChild as HTMLElement;
          inner.style.setProperty('--mx', `${-px * depth * 50}px`);
          inner.style.setProperty('--my', `${-py * depth * 30}px`);
        });
        floats().forEach((f) => {
          const depth = Number(f.dataset.depth);
          f.style.setProperty('--mx', `${px * depth * 22}px`);
          f.style.setProperty('--my', `${py * depth * 18}px`);
        });
        // Сова и пчёлы следят за курсором в координатах переднего плана
        const r = cv.fg.getBoundingClientRect();
        fauna.pointer({ x: (x - r.left) / S, y: (y - r.top) / S });
      }
      const ui = isUI(target);
      const s = ui ? null : spotAt(x, y);
      document.body.classList.toggle('over-spot', !!s || (!ui && cometAt(x, y)));
      if (s) {
        if (hoverSpot !== s) {
          hoverSpot = s;
          hoverSince = performance.now();
        } else if (hoverSince && performance.now() - hoverSince > 700 && !isFound(s.id)) {
          hoverSince = 0;
          onSpot(s, x, y);
        }
      } else hoverSpot = null;
      let near = false;
      for (const sp of spots) {
        if (sp.off || isFound(sp.id)) continue;
        const r = sp.el.getBoundingClientRect();
        if (
          Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) <
          150 + r.width / 2
        ) {
          near = true;
          break;
        }
      }
      setNear(near);
    });
  };

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawScene, 200);
  };
  const unsubFound = achStore.subscribe(updateSpots);

  sizeScene();
  // Холсты скрыты в CSS, пока у них нет размера: иначе рост с 300×150 до полного засчитывается как сдвиг вёрстки
  root.dataset.ready = '';
  raf = requestAnimationFrame(() => later(drawScene, 0));
  if (!reduce) raf = requestAnimationFrame(loop);
  document.addEventListener('click', onClick);
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('resize', onResize);

  return {
    setPage(page) {
      cur = page;
      todTarget = TOD[page] ?? 0;
      fauna.setPage(page, performance.now(), firstPage);
      // Вернулись, пока закат не успел погаснуть: продолжаем, а не разгораемся заново
      if (page === 3 && duskGlow < 0.02) duskSince = performance.now();
      // Без анимаций кадр не крутится: живой слой перерисовывается сразу в новом времени суток
      if (firstPage || reduce) tod = todTarget;
      if (reduce && live) frame(performance.now());
      layers.forEach((l) =>
        l.style.setProperty('--sx', `${-page * Number(l.dataset.depth) * 22}vw`),
      );
      // Новая страница открывается сверху: земля плавно уходит вниз вместе со сменой времени суток.
      // При загрузке плыть некуда, а glide заставил бы подъём догонять скролл первые полторы секунды
      if (!firstPage) {
        root.classList.add('glide');
        later(() => root.classList.remove('glide'), 1500);
      }
      firstPage = false;
      measureLift();
      updateSpots();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(moveRaf);
      cancelAnimationFrame(liftRaf);
      timeouts.forEach(clearTimeout);
      clearTimeout(resizeTimer);
      unsubFound();
      document.removeEventListener('click', onClick);
      document.removeEventListener('scroll', onScroll, { capture: true });
      removeEventListener('pointermove', onMove);
      removeEventListener('resize', onResize);
      spots.forEach((s) => s.el.remove());
    },
  };
}
