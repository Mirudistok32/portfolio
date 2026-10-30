import { expect, test } from '@playwright/test';

import { SITE } from '../../src/content/profile';
import {
  expectNoHorizontalScroll,
  focusObscured,
  open,
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

test('три вкладки переключаются ссылками и стрелками', async ({ page }) => {
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
  await expect(page).toHaveURL(/#experience$/);
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
  await open(page);
  await page.evaluate(() => document.fonts.ready);
  const sizes = [
    [320, 640],
    [390, 844],
    [700, 800],
    [701, 800],
    [768, 1024],
    [844, 390],
    [940, 700],
    [941, 700],
    [1024, 768],
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
