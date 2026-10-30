import { readFileSync } from 'node:fs';

import { expect, type Page, test } from '@playwright/test';

import { PROJECT_VPN_NOTE, PROJECTS, SITE } from '../../src/content/profile';
import { ACHIEVEMENTS } from '../../src/lib/achievements';
import {
  expectNoHorizontalScroll,
  focusObscured,
  open,
  OUT,
  PAGES,
  settle,
  stored,
  trackErrors,
} from './helpers';

test('out/index.html открывается с диска: текст, шрифты, без ошибок консоли', async ({ page }) => {
  const errors = trackErrors(page);
  await open(page);
  await expect(page.locator('#page-about')).toBeVisible();
  await expect(page.locator('#page-about-title')).toBeVisible();
  // с file:// шрифты идут из data-URI, иначе Chrome их не отдаёт
  await expect(page.locator('link[href*="fonts-offline.css"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.fonts.check('16px Roboto'))).toBe(true);
  expect(errors).toEqual([]);
});

test('четыре вкладки переключаются ссылками и стрелками', async ({ page }) => {
  const errors = trackErrors(page);
  await open(page);
  const tabs = page.getByRole('navigation', { name: 'Разделы' });
  for (const p of PAGES) {
    await tabs.getByRole('link', { name: p.label }).click();
    await expect(page).toHaveURL(new RegExp(`#${p.id}$`));
    await expect(tabs.getByRole('link', { name: p.label })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator(`#page-${p.id}`)).toBeVisible();
    for (const other of PAGES.filter((o) => o !== p))
      await expect(page.locator(`#page-${other.id}`)).toBeHidden();
  }
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/#projects$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#contacts$/);
  expect(errors).toEqual([]);
});

test('открытая по адресу вкладка видна сразу', async ({ page }) => {
  await open(page, '#contacts');
  await expect(page.locator('#page-contacts')).toBeVisible();
  await expect(page.locator('#page-about')).toBeHidden();
});

test('ачивка сохраняется после перезагрузки', async ({ page }) => {
  await open(page);
  const trophy = page.getByRole('button', { name: /^Ачивки: \d+ из 40$/ });
  await expect(trophy).toHaveAccessibleName('Ачивки: 1 из 40');
  for (const p of PAGES) await page.locator(`.tab[href="#${p.id}"]`).click();
  await expect.poll(() => stored(page, 'pv2-ach')).toContain('explorer');
  const label = await trophy.getAttribute('aria-label');

  await page.reload();
  await expect.poll(() => stored(page, 'pv2-ach')).toContain('explorer');
  await expect(trophy).toHaveAccessibleName(label!);
  await trophy.click();
  const panel = page.getByRole('region', { name: 'Ачивки' });
  await expect(panel.getByText('Картограф')).toBeVisible();
});

test('390 px и ноутбук: ни одна вкладка не прокручивается вбок', async ({ page }) => {
  const errors = trackErrors(page);
  await open(page);
  for (const p of PAGES) {
    await page.locator(`.tab[href="#${p.id}"]`).click();
    await expect(page.locator(`#page-${p.id}`)).toBeVisible();
    await expectNoHorizontalScroll(page);
  }
  expect(errors).toEqual([]);
});

test('ссылка сразу на главу открывает её на вкладке «Опыт»', async ({ page }) => {
  await open(page, '#job-zvuk');
  await expect(page.locator('#page-experience')).toBeVisible();
  await expect(page.locator('#page-about')).toBeHidden();
  await expect(page.locator('#job-zvuk')).toBeInViewport();
  await expect(page).toHaveTitle(/^Опыт — /);
});

test('«Проекты»: шесть карточек, картинка с диска, верные ссылки, пометка про VPN у двух', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await open(page, '#projects');
  const section = page.locator('#page-projects');
  await expect(section.locator('.pr-card')).toHaveCount(PROJECTS.length);
  await expect(section.locator('.pr-vpn')).toHaveCount(2);
  for (const p of PROJECTS) {
    const card = section.locator(`#project-${p.id}`);
    await expect(card.getByRole('heading', { name: p.title })).toBeVisible();

    // картинки ленивые: грузятся, когда карточка подъезжает к экрану
    const img = card.getByRole('img', { name: p.shot });
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(img).toHaveAttribute('loading', 'lazy');

    const site = card.getByRole('link', { name: /^Открыть/ });
    await expect(site).toHaveAttribute('href', p.url);
    await expect(site).toHaveAttribute('target', '_blank');
    const code = card.getByRole('link', { name: /^Код/ });
    if (p.repo) {
      await expect(code).toHaveAttribute('href', p.repo);
      await expect(code).toHaveAttribute('target', '_blank');
    } else await expect(code).toHaveCount(0);

    const vpn = card.getByText(PROJECT_VPN_NOTE);
    await expect(vpn).toHaveCount(p.id === 'mindforge' || p.id === 'fizkulture' ? 1 : 0);
  }
  expect(errors).toEqual([]);
});

test('ссылка сразу на проект открывает его карточку на вкладке «Проекты»', async ({ page }) => {
  await open(page, '#project-fizkulture');
  await expect(page.locator('#page-projects')).toBeVisible();
  await expect(page.locator('#page-about')).toBeHidden();
  await expect(page.locator('#project-fizkulture')).toBeInViewport();
  await expect(page.locator('#project-fizkulture')).toBeFocused();
  await expect(page).toHaveTitle(/^Проекты — /);
});

test('строка анонса на витрине ведёт к карточке проекта', async ({ page }) => {
  await open(page);
  const rows = page.locator('#page-about .showcase a');
  await expect(rows).toHaveCount(PROJECTS.length);
  await rows.filter({ hasText: 'Мельник' }).click();
  await expect(page.locator('#page-projects')).toBeVisible();
  await expect(page.locator('#project-miller')).toBeInViewport();
});

test('текст всех проектов есть в статическом HTML', () => {
  const html = readFileSync(OUT, 'utf8');
  for (const p of PROJECTS) {
    expect(html).toContain(`id="project-${p.id}"`);
    expect(html).toContain(p.about);
    expect(html).toContain(p.headline);
  }
  expect(html).toContain(PROJECT_VPN_NOTE);
});

for (const width of [320, 360, 390])
  test(`«Проекты» на ${width} px: нет прокрутки вбок`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'ширина задана в тесте');
    await page.setViewportSize({ width, height: 700 });
    await open(page, '#projects');
    await expectNoHorizontalScroll(page);
    // карточка не шире колонки: прокрутку вбок могло бы спрятать overflow у самой карточки
    const wide = await page.evaluate(() =>
      [...document.querySelectorAll('#page-projects .pr-card, #page-projects .pr-links > *')]
        .filter((el) => el.getBoundingClientRect().right > innerWidth)
        .map((el) => el.className),
    );
    expect(wide).toEqual([]);
  });

test('почта: адрес открывает письмо, кнопка рядом копирует', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '#contacts');
  const contacts = page.locator('#page-contacts');
  await expect(contacts.getByRole('link', { name: new RegExp(SITE.email) })).toHaveAttribute(
    'href',
    `mailto:${SITE.email}`,
  );
  await contacts.getByRole('button', { name: 'Скопировать почту' }).click();
  await expect(page.locator('.toast')).toContainText('Почта скопирована');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(SITE.email);
});

test('прогресс сбрасывается только со второго нажатия', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /^Ачивки: / }).click();
  const panel = page.getByRole('region', { name: 'Ачивки' });
  // описания переносятся, а не уезжают за край панели
  const overflow = await panel.evaluate((el) => {
    const list = el.querySelector('.ach-scroll')!;
    return list.scrollWidth - list.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
  await panel.getByRole('button', { name: 'Сбросить', exact: true }).click();
  expect(await stored(page, 'pv2-ach')).toContain('welcome');
  await panel.getByRole('button', { name: 'Да, сбросить' }).click();
  await expect.poll(() => stored(page, 'pv2-ach')).toEqual([]);
  await panel.getByRole('button', { name: 'Закрыть' }).click();
  await expect(panel).toBeHidden();
});

test('тосты не налезают друг на друга и на вкладки', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  // копирование профиля даёт сразу обычный тост и тост ачивки
  await page.locator('#page-about').getByRole('button', { name: 'Скопировать профиль' }).click();
  await expect(page.locator('.ach-toast')).toBeVisible();
  await expect(page.locator('.toast')).toBeVisible();
  await settle(page);
  const [ach, note, tabs] = await Promise.all(
    ['.ach-toast', '.toast', '.tabs'].map(async (s) => (await page.locator(s).boundingBox())!),
  );
  const hit = (a: typeof ach, b: typeof ach) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  expect(hit(ach, note)).toBe(false);
  expect(hit(ach, tabs) || hit(note, tabs)).toBe(false);
});

for (const p of PAGES)
  test(`«${p.label}»: фокус с клавиатуры не прячется под панелями`, async ({ page }) => {
    await open(page, `#${p.id}`);
    await settle(page);
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      expect(await focusObscured(page)).toBeNull();
    }
  });

test('шапка на 320–1920 px: вкладки, медальон, кубок и резюме не налезают друг на друга', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'ширины перебираются в одном проекте');
  // кубок подпрыгивает с поворотом при первой ачивке: повёрнутый текст лежит на разных высотах
  // и выглядел бы как перенос
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // худший случай: со счётом 40/40 кубок шире, чем при первой ачивке
  await page.addInitScript(
    (ids) => localStorage.setItem('pv2-ach', JSON.stringify(ids)),
    ACHIEVEMENTS.map((a) => a.id),
  );
  await open(page);
  await page.evaluate(() => document.fonts.ready);
  const sizes = [
    [320, 640],
    [390, 844],
    [700, 800],
    [701, 800],
    [768, 1024],
    [844, 390],
    [880, 800],
    [881, 800],
    [1024, 768],
    [1080, 700],
    [1081, 700],
    [1280, 800],
    [1920, 1080],
  ];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    const problems = await page.evaluate(() => {
      const items = ['.clock', '.tabs', '.medal', '.trophy', '.top-actions .btn']
        .map((s) => [s, document.querySelector(s)!.getBoundingClientRect()] as const)
        .filter(([, r]) => r.width > 0);
      const out: string[] = [];
      items.forEach(([s, a], i) => {
        if (a.left < 0 || a.right > innerWidth) out.push(`${s} за краем экрана`);
        for (const [t, b] of items.slice(i + 1))
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
            out.push(`${s} налезает на ${t}`);
      });
      // вкладки не вылезают из панели и не наезжают друг на друга
      const bar = document.querySelector('.tabs')!.getBoundingClientRect();
      const tabs = [...document.querySelectorAll('.tab')].map((t) => t.getBoundingClientRect());
      tabs.forEach((a, i) => {
        if (a.left < bar.left || a.right > bar.right) out.push(`вкладка ${i} за краем панели`);
        if (i && a.left < tabs[i - 1].right) out.push(`вкладка ${i} налезает на соседнюю`);
      });
      // текст, сломанный надвое, лежит на двух разных высотах
      const range = document.createRange();
      for (const label of document.querySelectorAll('.top-actions span, .tab span')) {
        range.selectNodeContents(label);
        const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
        if (lines.size > 1) out.push(`«${label.textContent}» в две строки`);
      }
      return out;
    });
    expect(problems, `${width}×${height}`).toEqual([]);
  }
});

test('«Утро вечера мудренее» — на «Проектах», сразу на «Контакты» её нет, но день засчитан', async ({
  page,
}) => {
  await open(page, '#contacts');
  await page.locator('.tab[href="#about"]').click();
  await expect.poll(() => stored(page, 'pv2-ach')).toContain('time');
  expect(await stored(page, 'pv2-ach')).not.toContain('dawn');

  await page.locator('.tab[href="#projects"]').click();
  await expect.poll(() => stored(page, 'pv2-ach')).toContain('dawn');
});

test('закат: небо на «Контактах» нарисовано и перетекает плавно в обе стороны', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await open(page, '#contacts');
  const sky = () =>
    page.evaluate(() => {
      const s3 = document.querySelector<HTMLCanvasElement>('.s3')!;
      const [r, g, b] = s3.getContext('2d')!.getImageData(0, 0, 1, 1).data;
      return {
        top: [r, g, b],
        opacity: getComputedStyle(s3).opacity,
        moving: s3.getAnimations().length,
        tint: getComputedStyle(document.querySelector('.dusk')!).visibility,
      };
    });

  await expect.poll(async () => (await sky()).top).toEqual([0x2c, 0x2a, 0x6a]);
  await settle(page);
  expect(await sky()).toMatchObject({ opacity: '1', moving: 0, tint: 'visible' });

  await page.locator('.tab[href="#projects"]').click();
  expect((await sky()).moving).toBe(1);
  await settle(page);
  expect(await sky()).toMatchObject({ opacity: '0', moving: 0, tint: 'hidden' });

  await page.locator('.tab[href="#contacts"]').click();
  expect((await sky()).moving).toBe(1);
  await settle(page);
  expect(await sky()).toMatchObject({ opacity: '1', moving: 0, tint: 'visible' });
  expect(errors).toEqual([]);
});

/** Сколько точек цвета на живых холстах заката: окна, огонь костра, светлячки. */
const duskLights = (page: Page) =>
  page.evaluate(() => {
    const count = (name: string, match: (r: number, g: number, b: number) => boolean) => {
      const cv = document.querySelector<HTMLCanvasElement>(`[data-c="${name}"]`)!;
      const { data } = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height);
      let n = 0;
      for (let i = 0; i < data.length; i += 4)
        if (data[i + 3] > 40 && match(data[i], data[i + 1], data[i + 2])) n++;
      return n;
    };
    return {
      windows: count('midFx', (r, g, b) => r > 245 && g > 190 && g < 220 && b < 150),
      fire: count('fg', (r, g, b) => r > 200 && g > 60 && g < 180 && b < 80),
      flies: count('fx', (r, g, b) => r < 225 && g > 225 && b < 160),
      glints: count('fg', (r, g, b) => r > 245 && g > 222 && g < 240 && b > 145 && b < 172),
      stars: count(
        'fx',
        (r, g, b) => r > 230 && r < 244 && g > 222 && g < 238 && b > 205 && b < 222,
      ),
      birds: count('fx', (r, g, b) => r < 48 && g < 40 && b > 34 && b < 58),
    };
  });

/** Положение солнца и подсветка облаков: и то и другое ведёт CSS. */
const duskSky = (page: Page) =>
  page.evaluate(() => {
    const sun = document.querySelector('.sun')!;
    const glow = document.querySelector('.clouds-l')!;
    return {
      sunY: parseFloat(getComputedStyle(sun).translate.split(' ')[1] ?? '0'),
      glow: parseFloat(getComputedStyle(glow).opacity),
    };
  });

test('закат: за 20 секунд садится солнце, идёт дорожка, проступают звёзды и летят стаи', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'та же логика, холсты не зависят от ширины');
  test.setTimeout(45_000);
  const errors = trackErrors(page);
  await open(page, '#contacts');
  const start = await duskSky(page);
  let birds = 0;
  await expect
    .poll(
      async () => {
        const [now, sky] = [await duskLights(page), await duskSky(page)];
        birds = Math.max(birds, now.birds);
        return (
          sky.sunY > start.sunY + 60 &&
          sky.glow > 0.5 &&
          now.glints > 20 &&
          now.stars >= 5 &&
          birds > 0
        );
      },
      { timeout: 20_000, intervals: [500] },
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

test('закат: при уходе дорожка, звёзды и солнце гаснут плавно, а не сразу', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'та же логика, холсты не зависят от ширины');
  test.setTimeout(45_000);
  const errors = trackErrors(page);
  await open(page, '#contacts');
  // Дорожка разгорается вместе с кострами за 9 с: иначе к замеру она и так едва видна
  await page.waitForTimeout(9500);
  expect((await duskLights(page)).glints).toBeGreaterThan(20);

  // Ночь — самый резкий переход: время суток пролетает закат за несколько кадров
  await page.locator('.tab[href="#about"]').click();
  await page.waitForTimeout(500);
  expect((await duskLights(page)).glints).toBeGreaterThan(0);
  const sliding = await page.evaluate(() => document.querySelector('.sun')!.getAnimations().length);
  expect(sliding).toBeGreaterThan(0);

  await settle(page);
  await expect
    .poll(async () => {
      const { glints, stars } = await duskLights(page);
      return { glints, glow: (await duskSky(page)).glow, sunY: (await duskSky(page)).sunY, stars };
    })
    .toMatchObject({ glints: 0, glow: 0, sunY: 0 });
  expect(errors).toEqual([]);
});

test('закат: за 20 секунд загораются окна, разгораются костры и прилетают светлячки', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'та же логика, холсты не зависят от ширины');
  test.setTimeout(45_000);
  const errors = trackErrors(page);
  await open(page, '#contacts');
  const start = await duskLights(page);
  await expect
    .poll(
      async () => {
        const now = await duskLights(page);
        return (
          now.windows > start.windows &&
          now.fire > start.fire * 1.5 &&
          // Мерцают: сколько-то всегда притушено
          now.flies >= 4
        );
      },
      { timeout: 20_000, intervals: [500] },
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

test('закат при reduced motion: готовый статичный кадр', async ({ page }) => {
  const errors = trackErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '#contacts');
  await expect.poll(async () => (await duskLights(page)).windows).toBeGreaterThan(0);
  const frame = () =>
    page.evaluate(() =>
      ['midFx', 'fg', 'fx'].map((name) =>
        document.querySelector<HTMLCanvasElement>(`[data-c="${name}"]`)!.toDataURL(),
      ),
    );
  const first = await frame();
  await page.waitForTimeout(1500);
  expect(await frame()).toEqual(first);
  const lights = await duskLights(page);
  expect(lights.fire).toBeGreaterThan(0);
  expect(lights.glints).toBeGreaterThan(0);
  expect(lights.stars).toBeGreaterThan(0);
  expect(lights.birds).toBe(0);
  // Солнце стоит наполовину за холмами, подсветка уже горит, ничего не едет
  const sky = await duskSky(page);
  expect(sky.sunY).toBeGreaterThan(0);
  expect(sky.glow).toBe(1);
  const moving = await page.evaluate(() => document.querySelector('.sun')!.getAnimations().length);
  expect(moving).toBe(0);
  expect(errors).toEqual([]);
});

/** Нажать все тайники, кроме попавших на ссылку или кнопку: клик по панели сайт сам не засчитает. */
async function clickSpots(page: Page) {
  const spots = await page.evaluate(() =>
    [...document.querySelectorAll('.spot:not(.off)')].flatMap((el) => {
      const r = el.getBoundingClientRect();
      const [x, y] = [r.left + r.width / 2, r.top + r.height / 2];
      const on = document.elementFromPoint(x, y);
      return !on || on.closest('a, button') ? [] : [{ x, y }];
    }),
  );
  for (const { x, y } of spots) await page.mouse.click(x, y);
}

const missing = async (page: Page, want: string[]) => {
  const got = await stored(page, 'pv2-ach');
  return want.filter((id) => !got.includes(id));
};

test('закат на ноутбуке: корову, пасеку и голубя ловит настоящий клик', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'на телефоне панели закрывают пейзаж');
  test.setTimeout(60_000);
  const errors = trackErrors(page);
  await open(page, '#contacts');
  await settle(page);
  await expect
    .poll(
      async () => {
        await clickSpots(page);
        return missing(page, ['cow', 'bees', 'pigeon']);
      },
      { timeout: 45_000, intervals: [250] },
    )
    .toEqual([]);
  expect(errors).toEqual([]);
});

test('на телефоне корову и пасеку ловит клик на «Проектах» при прокрутке', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'на ноутбуке проверено выше');
  test.setTimeout(60_000);
  const errors = trackErrors(page);
  await open(page, '#projects');
  await settle(page);
  // Пейзаж виден в просветах между карточками, поэтому идём по всей высоте вкладки
  const max = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.page:not([hidden])')!;
    return el.scrollHeight - el.clientHeight;
  });
  const want = ['cow', 'bees'];
  for (let y = 0; y <= max && (await missing(page, want)).length; y += 60) {
    await page.evaluate((top) => {
      document.querySelector<HTMLElement>('.page:not([hidden])')!.scrollTop = top;
    }, y);
    await page.waitForTimeout(300);
    await clickSpots(page);
  }
  expect(await missing(page, want)).toEqual([]);
  expect(errors).toEqual([]);
});

for (const [width, height] of [
  [1280, 800],
  [1920, 1080],
])
  test.describe(`«Контакты», ${width} px`, () => {
    test.use({ viewport: { width, height } });
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'ширина задана в тесте');
      // без анимаций пейзаж сразу на месте и не ездит за мышью
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('пейзаж, сдвинутый на 66vw, не обрывается у края экрана', async ({ page }) => {
      await open(page, '#contacts');
      // у края есть закрашенные точки в каждом слое; дневные холсты рисуются в конце очереди
      await expect
        .poll(() =>
          page.evaluate(() =>
            ['groundD', 'foreD', 'midD', 'farD'].filter((name) => {
              const c = document.querySelector<HTMLCanvasElement>(`[data-c="${name}"]`)!;
              const r = c.getBoundingClientRect();
              if (r.left > 0 || r.right < innerWidth) return true;
              const x = Math.floor(((innerWidth - 1 - r.left) / r.width) * c.width);
              const { data } = c.getContext('2d')!.getImageData(x, 0, 1, c.height);
              return !data.some((v, i) => i % 4 === 3 && v > 0);
            }),
          ),
        )
        .toEqual([]);
      const sky = await page.evaluate(() => {
        const r = document.querySelector('.sky-c')!.getBoundingClientRect();
        return r.left <= 0 && r.right >= innerWidth;
      });
      expect(sky).toBe(true);
    });

    test('видимые тайники и звери отзываются на клик', async ({ page }) => {
      await open(page, '#contacts');
      await page.addStyleTag({ content: '.toasts { display: none; }' });
      // видимый — центр на экране и не под карточкой (там клик достаётся интерфейсу)
      const visible = () =>
        page.evaluate(() =>
          [...document.querySelectorAll('.spot')].flatMap((s, i) => {
            const r = s.getBoundingClientRect();
            const [x, y] = [r.left + r.width / 2, r.top + r.height / 2];
            const out = x < 0 || y < 0 || x >= innerWidth || y >= innerHeight;
            if (s.classList.contains('off') || out) return [];
            const top = document.elementFromPoint(x, y);
            const ui = top?.closest('a, button, .glass, .solid, h1, h2, p, dl, ul, .xpdock, .tabs');
            return ui ? [] : [{ i, x, y }];
          }),
        );
      // костёр, ручей, улей и две коровы; звери появляются с первым кадром после отрисовки
      await expect.poll(async () => (await visible()).length).toBeGreaterThanOrEqual(5);
      for (const { i, x, y } of await visible()) {
        await page.mouse.click(x, y);
        await expect(page.locator('.spot').nth(i)).toHaveClass(/found/);
      }
    });
  });

test('голубь несёт письмо в Telegram на «Контактах», а на «Проектах» пролетает мимо', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'на телефоне карточка бывает за краем экрана');
  test.setTimeout(60_000);
  const seen = page.locator('body[data-mail-seen]');
  // время идёт по команде: ждать голубя вживую — почти минута
  const until = (ready: () => Promise<number>) =>
    expect
      .poll(
        async () => {
          await page.clock.runFor(2000);
          return ready();
        },
        { timeout: 40_000 },
      )
      .toBeGreaterThan(0);
  await page.clock.install();
  await open(page, '#contacts');
  // вспышка карточки короче шага времени, поэтому её ловит наблюдатель
  await page.evaluate(() => {
    const card = document.querySelector('#page-contacts .link.primary')!;
    new MutationObserver(() => {
      if (card.classList.contains('mail')) document.body.dataset.mailSeen = '';
    }).observe(card, { attributes: true });
  });
  await until(() => seen.count());

  await page.evaluate(() => delete document.body.dataset.mailSeen);
  await page.locator('.tab[href="#projects"]').click();
  await until(() => page.locator('.scene > .spot:not(.off)').count());
  await page.clock.runFor(20_000);
  await expect(seen).toHaveCount(0);
});
