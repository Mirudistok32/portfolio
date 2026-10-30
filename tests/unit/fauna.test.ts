import { beforeEach, describe, expect, it } from 'vitest';

import { type Ctx, type Dims, emptyGeo, type Geo } from '@/components/scene/draw';
import { createFauna, type Fauna, type LiveCtx } from '@/components/scene/fauna';
import { lightAt, TOD } from '@/lib/daylight';

const [NIGHT, DAWN, DAY, DUSK] = [0, 1, 2, 3];
const BEE = '#F2C230';
const MOTH = '#F5F1EA';
const PIGEON = '#A3ACBF';
const WINDOW = '#FFD27A';
const SMOKE = 'rgba(236';
const BIRD = '#241C2E';

/** Холст-заглушка: запоминает, какими цветами красили и с какой прозрачностью. */
function fakeCtx() {
  const painted = new Map<string, number>();
  const fills: string[] = [];
  const c = {
    canvas: { width: 400, height: 200 },
    fillStyle: '',
    globalAlpha: 1,
    clearRect() {},
    fillRect() {
      const color = String(c.fillStyle);
      painted.set(color, Math.max(painted.get(color) ?? 0, c.globalAlpha));
      if (c.globalAlpha > 0) fills.push(color);
    },
  };
  return { c: c as unknown as Ctx, painted, fills };
}

function scene(mailbox: () => DOMRect | null = () => null, reduce = false) {
  const delivered = { n: 0 };
  const fauna: Fauna = createFauna({
    reduce,
    mailbox,
    delivered: () => delivered.n++,
  });
  const dims = { k: 1, VW: 320, H: 200, W: 640, HFAR: 100, HMID: 100, HFORE: 100 } as Dims;
  const geo: Geo = {
    ...emptyGeo(),
    ground: new Int16Array(640).fill(90),
    bank: new Int16Array(640).fill(95),
    owl: { x: 40, y: 50 },
    perch: { x: 60, y: 80 },
    hive: { x: 200, y: 85 },
    apiary: { x0: 190, y0: 80, x1: 215, y1: 92 },
    windows: Array.from({ length: 12 }, (_, i) => ({ x0: i * 9, y0: 40, x1: i * 9 + 2, y1: 41 })),
    chimneys: [
      { x: 100, y: 30 },
      { x: 180, y: 30 },
    ],
    flowers: [
      { x: 170, y: 88 },
      { x: 230, y: 88 },
    ],
  };
  fauna.reset(dims, geo, 320, 200);

  const layers = { far: fakeCtx(), mid: fakeCtx(), fore: fakeCtx(), fx: fakeCtx() };
  const live: LiveCtx = {
    far: layers.far.c,
    mid: layers.mid.c,
    fore: layers.fore.c,
    fx: layers.fx.c,
  };
  let t = 1000;
  let tod = TOD[NIGHT];

  /** Шагаем по 50 мс: время суток подтягивается к вкладке, как в engine.ts. */
  const run = (ms: number, page: number) => {
    for (const l of Object.values(layers)) {
      l.painted.clear();
      l.fills.length = 0;
    }
    for (const end = t + ms; t < end; t += 50) {
      tod += (TOD[page] - tod) * 0.06;
      fauna.frame({ t, tod, ...lightAt(tod) }, live);
    }
  };
  /** Цвета только за последний кадр, а не за весь прогон. */
  const lastFrame = (page: number) => run(50, page);
  const open = (page: number, ms = 9000) => {
    fauna.setPage(page, t, false);
    run(ms, page);
  };
  const box = (id: string) => fauna.hits.find((h) => h.id === id)!.box;
  /** Сколько раз покрасили цветом с таким началом за последний кадр. */
  const inFrame = (page: number, layer: keyof typeof layers, color: string) => {
    lastFrame(page);
    return layers[layer].fills.filter((f) => f.startsWith(color)).length;
  };
  return { fauna, layers, open, run, lastFrame, inFrame, box, delivered, now: () => t };
}

const CARD = { width: 300, top: 40, bottom: 100, right: 300, left: 0, height: 60 } as DOMRect;

describe('звери по времени суток', () => {
  beforeEach(() => history.replaceState(null, '', '?season=summer'));

  // Таблица из журнала плана (пункт 3.2): кто на какой вкладке доступен для клика
  it.each([
    // На рассвете ночь гаснет не до конца: сова ещё сидит полупрозрачной и ловится
    ['owl', { night: true, dawn: true, day: false, dusk: false }],
    ['hedgehog', { night: false, dawn: true, day: false, dusk: false }],
    ['rooster', { night: false, dawn: true, day: true, dusk: true }],
    ['cow1', { night: false, dawn: true, day: true, dusk: true }],
    ['hive', { night: true, dawn: true, day: true, dusk: true }],
    ['pigeon', { night: false, dawn: false, day: true, dusk: true }],
  ])('%s', (id, want) => {
    const got = [NIGHT, DAWN, DAY, DUSK].map((page) => {
      const s = scene();
      // Сначала время суток доходит до вкладки: на пути с ночи на день оно проходит через рассвет.
      // Ёжик идёт по кругу и у края гаснет, голубь вылетает через несколько секунд: ждём появления
      s.open(page, 2000);
      for (let i = 0; i < 400 && !s.box(id); i++) s.run(50, page);
      return !!s.box(id);
    });
    expect({ night: got[0], dawn: got[1], day: got[2], dusk: got[3] }).toEqual(want);
  });

  it('днём пчёлы и бабочки летают', () => {
    const s = scene();
    s.open(DAY);
    s.lastFrame(DAY);
    expect(s.layers.fore.painted.get(BEE)).toBeGreaterThan(0.99);
    expect(s.layers.fore.painted.get(MOTH)).toBeGreaterThan(0.9);
  });

  it('на закате пчёлы и бабочки уходят, а с дневной вкладки пчёлы долетают до колоды', () => {
    const s = scene();
    s.open(DAY);
    s.open(DUSK);
    s.lastFrame(DUSK);
    expect(s.layers.fore.painted.has(BEE)).toBe(false);
    expect(s.layers.fore.painted.has(MOTH)).toBe(false);
  });

  it('на закате клик и курсор не выманивают пчёл, а тайник пасеки остаётся', () => {
    const s = scene();
    s.open(DUSK);
    expect(s.box('hive')).not.toBeNull();
    s.fauna.pointer({ x: 200, y: 85 });
    s.fauna.poke('hive', s.now());
    s.run(4000, DUSK);
    expect(s.layers.fore.painted.has(BEE)).toBe(false);
  });

  it('с заката на «Проекты» пчёлы вылетают снова', () => {
    const s = scene();
    s.open(DUSK);
    s.open(DAY);
    s.lastFrame(DAY);
    expect(s.layers.fore.painted.get(BEE)).toBeGreaterThan(0.99);
  });

  it('на закате стадо с пастухом видно целиком', () => {
    const s = scene();
    s.open(DUSK);
    s.lastFrame(DUSK);
    expect(s.layers.fore.painted.get('#F2EEE6')).toBeGreaterThan(0.99);
    expect(s.layers.fore.painted.get('#C8443A')).toBeGreaterThan(0.99);
  });

  it('на закате голубь с письмом виден, садится в карточку Telegram и ловится', () => {
    const s = scene(() => CARD);
    s.open(DUSK, 500);
    for (let i = 0; i < 400 && !s.box('pigeon'); i++) s.run(50, DUSK);
    s.lastFrame(DUSK);
    expect(s.layers.fx.painted.get(PIGEON)).toBeGreaterThan(0.99);
    for (let i = 0; i < 2000 && !s.delivered.n; i++) s.run(50, DUSK);
    expect(s.delivered.n).toBe(1);

    for (let i = 0; i < 2000 && !s.box('pigeon'); i++) s.run(50, DUSK);
    s.fauna.poke('pigeon', s.now());
    s.lastFrame(DUSK);
    // Пойманный голубь не пропадает, а улетает: виден, но второй раз его не поймать
    expect(s.box('pigeon')).toBeNull();
    expect(s.layers.fx.painted.get(PIGEON)).toBeGreaterThan(0.99);
  });

  it('с заката в ночь голубь не оставляет невидимого тайника', () => {
    const s = scene(() => CARD);
    s.open(DUSK, 500);
    for (let i = 0; i < 400 && !s.box('pigeon'); i++) s.run(50, DUSK);
    s.open(NIGHT, 1500);
    expect(s.box('pigeon')).toBeNull();
  });

  it('на закате окна загораются по одному и за 14 секунд горят все', () => {
    const s = scene();
    s.open(DUSK, 1000);
    expect(s.inFrame(DUSK, 'mid', WINDOW)).toBe(0);
    s.run(6000, DUSK);
    const halfway = s.inFrame(DUSK, 'mid', WINDOW);
    expect(halfway).toBeGreaterThan(0);
    expect(halfway).toBeLessThan(12);
    s.run(7000, DUSK);
    expect(s.inFrame(DUSK, 'mid', WINDOW)).toBe(12);
  });

  it('днём окна не горят, а уход с заката их гасит', () => {
    const s = scene();
    s.open(DAY, 14000);
    expect(s.inFrame(DAY, 'mid', WINDOW)).toBe(0);
    s.open(DUSK, 14000);
    expect(s.inFrame(DUSK, 'mid', WINDOW)).toBe(12);
    // Время суток подтягивается к дню плавно: ждём, пока закат сойдёт на нет
    s.open(DAY, 6000);
    expect(s.inFrame(DAY, 'mid', WINDOW)).toBe(0);
  });

  it('на закате дым из труб гуще, чем днём', () => {
    const s = scene();
    s.open(DAY, 9000);
    const day = s.inFrame(DAY, 'mid', SMOKE);
    s.open(DUSK, 9000);
    expect(s.inFrame(DUSK, 'mid', SMOKE)).toBeGreaterThan(day * 2);
  });

  it('на закате стадо с пастухом идёт с луга к плетню, а на «Проектах» возвращается', () => {
    const s = scene();
    const fx = (f: number) => 16 + 320 * f;
    const x = () => s.box('cow2')!.x0;
    s.open(DAY, 2000);
    const meadow = x();
    expect(Math.abs(meadow - fx(0.6))).toBeLessThan(20);

    s.open(DUSK, 3000);
    expect(x()).toBeGreaterThan(meadow + 10);
    s.run(16000, DUSK);
    expect(Math.abs(x() - fx(0.88))).toBeLessThan(20);
    // Идёт на виду: на вкладке корова остаётся тайником всю дорогу
    expect(s.box('cow1')).not.toBeNull();

    s.open(DAY, 19000);
    expect(Math.abs(x() - fx(0.6))).toBeLessThan(20);
  });

  it('при reduced motion закат стоит готовым кадром: окна горят, стадо у плетня, дыма нет', () => {
    const s = scene(() => null, true);
    // В engine.ts время суток при reduced motion встаёт сразу, здесь подтягивается шагами
    s.open(DUSK, 5000);
    const x = s.box('cow2')!.x0;
    expect(Math.abs(x - (16 + 320 * 0.88))).toBeLessThan(20);
    expect(s.inFrame(DUSK, 'mid', WINDOW)).toBe(12);
    expect(s.inFrame(DUSK, 'mid', SMOKE)).toBe(0);
    s.run(5000, DUSK);
    expect(s.box('cow2')!.x0).toBe(x);
    s.open(DAY, 5000);
    expect(Math.abs(s.box('cow2')!.x0 - (16 + 320 * 0.6))).toBeLessThan(20);
  });

  it('на закате стаи птиц летят к лесу, а уход с заката их гасит', () => {
    const s = scene();
    s.fauna.setPage(DUSK, s.now(), true);
    s.run(1000, DUSK);
    expect(s.inFrame(DUSK, 'fx', BIRD)).toBe(0);
    s.run(8000, DUSK);
    expect(s.inFrame(DUSK, 'fx', BIRD)).toBeGreaterThanOrEqual(5);
    s.open(NIGHT, 4000);
    expect(s.inFrame(NIGHT, 'fx', BIRD)).toBe(0);
  });

  it('днём стаи не летят, и при reduced motion на закате тоже', () => {
    const day = scene();
    day.fauna.setPage(DAY, day.now(), true);
    day.run(9000, DAY);
    expect(day.inFrame(DAY, 'fx', BIRD)).toBe(0);
    const still = scene(() => null, true);
    still.fauna.setPage(DUSK, still.now(), true);
    still.run(9000, DUSK);
    expect(still.inFrame(DUSK, 'fx', BIRD)).toBe(0);
  });

  it('зимой пчёл и бабочек нет, а пасека на закате всё равно находится', () => {
    history.replaceState(null, '', '?season=winter');
    const s = scene();
    s.open(DUSK);
    s.lastFrame(DUSK);
    expect(s.layers.fore.painted.has(BEE)).toBe(false);
    expect(s.box('hive')).not.toBeNull();
  });
});
