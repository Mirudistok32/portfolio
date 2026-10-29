import { expect, test } from '@playwright/test';

import { expectNoHorizontalScroll, open, PAGES, stored, trackErrors } from './helpers';

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
