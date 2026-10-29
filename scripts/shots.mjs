/**
 * Визуальная проверка собранного out/index.html так, как его открывает человек: по file:// в
 * Chrome, на ширине телефона и ноутбука, во все времена года (?season=). Пишет PNG в
 * .screenshots/ и выводит ошибки и предупреждения консоли и горизонтальную прокрутку.
 * Контраст здесь не мерится: текст лежит на стекле поверх canvas, его считает contrast.mjs.
 *
 *   npm run build && npm run shots     — все снимки
 *   npm run shots -- winter            — только те, в имени которых есть «winter»
 */
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const ROOT = resolve(import.meta.dirname, '..');
const INDEX = resolve(ROOT, 'out/index.html');
const OUT = resolve(ROOT, '.screenshots');
const filter = process.argv[2] ?? '';

if (!existsSync(INDEX)) {
  console.error('Нет out/index.html — сначала npm run build');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const PAGES = ['about', 'experience', 'contacts'];
const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const VIEWS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const problems = [];
const browser = await chromium.launch({ channel: 'chrome' });
let count = 0;

for (const view of VIEWS) {
  for (const season of SEASONS) {
    for (const page of PAGES) {
      const name = `${page}--${season}--${view.name}`;
      if (filter && !name.includes(filter)) continue;
      const ctx = await browser.newContext({
        viewport: { width: view.width, height: view.height },
        isMobile: view.isMobile,
        hasTouch: view.hasTouch,
      });
      const tab = await ctx.newPage();
      tab.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning')
          problems.push(`${name}: [${m.type()}] ${m.text()}`);
      });
      tab.on('pageerror', (e) => problems.push(`${name}: [pageerror] ${e.message}`));

      await tab.goto(`file://${INDEX}?season=${season}#${page}`);
      // React подключается после первой отрисовки; первая ачивка открывается при запуске
      await tab.waitForFunction(() => (localStorage.getItem('pv2-ach') ?? '').includes('welcome'));
      await tab.evaluate(async () => {
        await document.fonts.ready;
        // Мерить и снимать после смены вкладки: блоки въезжают со сдвигом (WAAPI), небо 1.6 с
        // перетекает из ночи в время суток вкладки (CSS-переход). Бесконечные анимации не ждём.
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => !(a instanceof CSSAnimation))
            .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        );
      });
      // пейзаж на canvas догоняет время суток плавно, ещё около секунды
      await tab.waitForTimeout(1000);

      const overflow = await tab.evaluate(() =>
        [document.documentElement, ...document.querySelectorAll('.page:not([hidden])')]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => `${el.id || el.tagName} ${el.scrollWidth} > ${el.clientWidth}`),
      );
      for (const o of overflow) problems.push(`${name}: горизонтальная прокрутка (${o})`);

      await tab.screenshot({ path: resolve(OUT, `${name}.png`) });
      count++;
      await ctx.close();
    }
  }
}
await browser.close();

console.log(`Скриншотов: ${count} → ${OUT}`);
if (problems.length) {
  console.log(`Проблемы (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('Ошибок консоли и горизонтальной прокрутки нет.');
