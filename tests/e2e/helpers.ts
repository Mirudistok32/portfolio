import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, type Page } from '@playwright/test';

// Playwright грузит тесты как CommonJS (в package.json нет "type": "module") — import.meta нет
const OUT = resolve(__dirname, '../../out/index.html');

export const PAGES = [
  { id: 'about', label: 'Обо мне' },
  { id: 'experience', label: 'Опыт' },
  { id: 'contacts', label: 'Контакты' },
];

/** Ошибки консоли и страницы за время теста — в конце теста их не должно быть. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/**
 * Открыть out/index.html с диска (с `#hash` — сразу нужную вкладку) и дождаться React:
 * скрипты подключаются после первой отрисовки, а первая ачивка открывается при запуске.
 */
export async function open(page: Page, hash = '') {
  if (!existsSync(OUT)) throw new Error('Нет out/index.html — сначала npm run build');
  await page.goto(`file://${OUT}${hash}`);
  await expect.poll(() => stored(page, 'pv2-ach')).toContain('welcome');
}

/** Прочитать список из localStorage. */
export const stored = (page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]') as string[], key);

/** Дождаться конечных анимаций (въезд блоков, появление тостов); бесконечные — сияние, костры — не ждём. */
export const settle = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );

/**
 * Чем закрыт элемент в фокусе: краем прокрутки, нижней панелью вкладок (телефон) или липким
 * оглавлением «Опыта». null — виден целиком. Смотрим только содержимое вкладок.
 */
export const focusObscured = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    const scroller = el?.closest<HTMLElement>('.page');
    if (!el || !scroller) return null;
    const b = el.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    const cut = (r: DOMRect) =>
      b.top < r.bottom - 1 && b.bottom > r.top + 1 && b.left < r.right - 1 && b.right > r.left + 1;
    const name = `${el.tagName.toLowerCase()} «${(el.textContent ?? '').trim().slice(0, 30)}»`;
    if (b.top < view.top - 1 || b.bottom > view.bottom + 1) return `${name} за краем прокрутки`;
    const bar = document.querySelector('.tabs')!;
    if (getComputedStyle(bar).position === 'fixed' && cut(bar.getBoundingClientRect()))
      return `${name} под нижней панелью вкладок`;
    const toc = scroller.querySelector('.q-list');
    if (toc && !toc.contains(el) && getComputedStyle(toc).position === 'sticky') {
      const r = toc.getBoundingClientRect();
      if (r.top <= view.top + 1 && cut(r)) return `${name} под оглавлением`;
    }
    return null;
  });

/**
 * Ни страница, ни видимая вкладка не прокручиваются вбок. Замер — после анимации смены вкладки:
 * блоки въезжают со сдвигом 60px и на время раздвигают вкладку.
 */
export async function expectNoHorizontalScroll(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('.page')]
        .flatMap((el) => el.getAnimations({ subtree: true }))
        .filter((a) => !(a instanceof CSSAnimation || a instanceof CSSTransition))
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  const overflow = await page.evaluate(() =>
    [document.documentElement, ...document.querySelectorAll<HTMLElement>('.page:not([hidden])')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => `${el.id || el.tagName}: ${el.scrollWidth} > ${el.clientWidth}`),
  );
  expect(overflow).toEqual([]);
}
