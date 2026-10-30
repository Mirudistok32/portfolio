/**
 * Скрины-витрина для вкладки «Проекты»: открывает опубликованные адреса из PROJECTS в Chrome,
 * доводит продукт до рабочего состояния (игра идёт, открыт урок, тикает тренировка), снимает окно
 * 1280×800 и сжимает в src/assets/projects/<id>.webp не тяжелее 80 КБ. Каждый снимок — в чистом
 * профиле браузера, поэтому чужих данных и прогресса на нём нет. Сеть нужна, в гейт не входит.
 * Снимки смотреть глазами: сцены живые, момент кадра зависит от сайта и даты.
 *
 *   npm run project-shots              — все снимки
 *   npm run project-shots -- miller    — только те, в id которых есть «miller»
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';
import sharp from 'sharp';

import { PROJECTS } from '../src/content/profile.ts';

const OUT = resolve(import.meta.dirname, '../src/assets/projects');
const MAX_BYTES = 80_000;
const filter = process.argv[2] ?? '';

/** Как довести продукт до кадра: адрес относительно Project.url и действия после открытия. */
const SCENES = {
  'film-course': {
    // «Носферату» из подтверждённой программы: у уроков расширения висит пометка о редактуре
    path: '#/film/nosferatu',
    act: async (tab) => {
      await tab.getByRole('heading', { name: 'Короткая настройка внимания' }).waitFor();
      await tab.evaluate(() => {
        const lesson = [...document.querySelectorAll('h2')].find((h) =>
          h.textContent.includes('Короткая настройка внимания'),
        );
        window.scrollBy(0, lesson.getBoundingClientRect().top - 100);
      });
      await tab.waitForTimeout(800);
    },
  },
  mindforge: {
    path: 'cases/was-9990/',
    act: async (tab) => {
      await tab.getByRole('heading', { name: 'Расследование' }).waitFor();
      await tab.waitForTimeout(1500);
    },
  },
  'fog-shepherd': {
    path: '?autopilot&level=5',
    act: async (tab) => {
      await tab.getByRole('button', { name: /Играть/ }).click();
      // собака ещё в начале пути: стадо рядом с ней, загон впереди, вокруг туман
      await tab.waitForTimeout(2500);
    },
  },
  miller: {
    path: '?autoplay',
    act: async (tab) => {
      // уровень дня — самое большое поле на старте; ?seed подписал бы его «Тестовый уровень»
      await tab.locator('.mode').first().click();
      // автопилот повернул жёлоба, вода на полпути к колесу
      await tab.waitForTimeout(3200);
    },
  },
  'pigeon-post': {
    path: '?autopilot',
    act: async (tab) => {
      await tab.getByRole('button', { name: 'Лететь' }).click();
      await tab.waitForTimeout(9500);
    },
  },
  fizkulture: {
    path: 'workouts/starter-circuit/run',
    act: async (tab) => {
      await tab.getByRole('button', { name: /старт/i }).first().click();
      // пропускаем подготовку: на кадре сам рабочий этап
      await tab.getByRole('button', { name: 'Следующий этап' }).click();
      await tab.waitForTimeout(3000);
    },
  },
};

const missing = PROJECTS.filter((p) => !SCENES[p.id]).map((p) => p.id);
if (missing.length) {
  console.error(`Нет сценария для проектов: ${missing.join(', ')}`);
  process.exit(1);
}

/** Самое высокое качество, при котором файл укладывается в MAX_BYTES. */
async function compress(png) {
  for (let quality = 85; quality >= 40; quality -= 5) {
    const webp = await sharp(png).webp({ quality, effort: 6 }).toBuffer();
    if (webp.length <= MAX_BYTES) return { webp, quality };
  }
  return null;
}

mkdirSync(OUT, { recursive: true });

const failures = [];
const browser = await chromium.launch({ channel: 'chrome' });

for (const project of PROJECTS) {
  if (filter && !project.id.includes(filter)) continue;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tab = await ctx.newPage();
  tab.on('pageerror', (e) => failures.push(`${project.id}: [pageerror] ${e.message}`));
  // Ресурс соседнего сайта, которого нет (404), снимок не портит: только сообщаем
  tab.on('console', (m) => {
    if (m.type() === 'error') console.warn(`${project.id}: [console] ${m.text()}`);
  });

  const scene = SCENES[project.id];
  try {
    await tab.goto(new URL(scene.path, project.url).href, { waitUntil: 'load', timeout: 45_000 });
    await scene.act(tab);
    const result = await compress(await tab.screenshot());
    if (result) {
      writeFileSync(resolve(OUT, `${project.id}.webp`), result.webp);
      const kb = (result.webp.length / 1000).toFixed(1);
      console.log(`${project.id}: ${kb} КБ, качество ${result.quality}`);
    } else {
      failures.push(`${project.id}: не укладывается в ${MAX_BYTES / 1000} КБ`);
    }
  } catch (e) {
    failures.push(`${project.id}: ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
}
await browser.close();

if (failures.length) {
  console.error(`Проблемы (${failures.length}):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Готово → ${OUT}`);
