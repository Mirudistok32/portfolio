<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Портфолио Станислава Постникова

Сайт-визитка Senior Frontend-разработчика для рекрутеров: три вкладки — три времени суток
(«Обо мне» — ночь, «Опыт» — рассвет, «Контакты» — день), пиксельный пейзаж на `canvas` и 40
ачивок, из них 18 секретных. Интерфейс, документация и ответы — по-русски.

Общие принципы и имена команд — `../agent-base/docs/` (principles, conventions). Здесь —
только то, что отличает этот проект.

## Стек и запуск

- Next 16 (App Router, `output: 'export'`) + React 19 + TypeScript, обычный CSS с токенами в
  `src/app/globals.css`. Состояние — внешние хранилища на `useSyncExternalStore`
  (`src/lib/store.ts`). Данные пользователя — `localStorage`, ключи `pv2-ach` (открытые ачивки)
  и `pv2-found` (найденные тайники); бэкенда нет.
- Открыть: `npm run build`, затем двойной клик по `out/index.html` — без сервера.
  `scripts/prepare-static.mjs` после `next build` делает пути относительными, кладёт шрифты
  в data-URI для `file://` и откладывает гидрацию до первой отрисовки. Разработка —
  `npm run dev`. Публикация: GitHub Pages на пуш в `master` (`.github/workflows/deploy.yml`),
  https://mirudistok32.github.io/portfolio/.

## Правила

- Все тексты сайта — в `src/content/profile.ts` (опыт, контакты, профиль для HR, адрес `SITE.url`);
  в компонентах — только подписи интерфейса, тексты ачивок — в `src/lib/achievements.ts`.
- Одна страница: весь текст трёх вкладок есть в статическом HTML (SEO), вкладки только прячут
  лишнее; адреса вкладок — hash (`#about`, `#experience`, `#contacts`). Новых маршрутов не
  заводить.
- Ачивки — `src/lib/achievements.ts`: открываются через `unlock(id)`, тайники — `markFound`.
  Ачивка с `hint` секретная — до открытия видна как «???».
- Пейзаж — `src/components/scene/` (`draw.ts` — статичные слои, `engine.ts` — анимация и
  тайники, `fauna.ts` — звери, время года; `?season=winter|spring|summer|autumn`).
- Доступность не хуже нынешней: контраст AA (`npm run contrast`), шрифты от 14px, фокус,
  клавиатура (← → листают вкладки), `prefers-reduced-motion`.
- Неясное или важное по продукту — спрашивать, с вариантом по умолчанию.

## Проверки

- `npm run check` — быстрый гейт: типы, линтер, контраст, формат, юнит-тесты (без сборки). Он
  же идёт в `deploy.yml` перед сборкой: красный гейт не публикуется. `typecheck` начинается с
  `next typegen` — `next-env.d.ts` не в git, без него `tsc` на чистой копии не видит картинки.
- Юнит-тесты — Vitest + jsdom (`vitest.config.mts`, `tests/unit/`): логика `src/lib/` без React.
  Правило, которое видно в интерфейсе (секретная ачивка — «???»), выносить в `src/lib/` и
  проверять там (`cardOf`).
- `npm run check:full` — `check` + `test:e2e`: сборка и Playwright по `file://` в установленном
  Chrome (`tests/e2e/`, ноутбук и телефон 390 px): открытие с диска без ошибок консоли, шрифты
  из data-URI, три вкладки, ачивка после перезагрузки, нет прокрутки вбок, ссылка сразу на главу
  (`#job-…`), почта, сброс прогресса в два нажатия, тосты не налезают, фокус не прячется под
  панелями, шапка на 320–1920 px без наложений и переносов. Ширину вкладки мерить после анимации
  смены — блоки въезжают со сдвигом 60px.
- Формат — Prettier (`.prettierrc.json`: с `;`, одинарные кавычки, ширина 100), `npm run format`.
- Визуально: `npm run shots` (после `build`) — 3 вкладки × 4 времени года × 390/1280 в
  `.screenshots/`, ошибки консоли и прокрутка вбок; `npm run shots -- winter` — часть. Или общий
  `/shots`. Снимать после смены вкладки: небо 1,6 с перетекает из ночи, пейзаж догоняет ещё ~1 с.

## План

- Файл: `PLAN.md`, журнал: `PLAN-LOG.md` (сейчас плана нет). Пункт — `/next-task [N.M]`,
  прогресс — `/plan-status`.
- Гейт пункта: `npm run check:full`.
- Коммиты: не коммитить, пользователь коммитит сам. Если попросили закоммитить — сообщение
  подробное: заголовок и тело с тем, что изменилось и зачем.
- Ветка: `master`.

## Куда смотреть

| Задача                                            | Читать                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Что где лежит, открытие с диска, SEO, доступность | [README.md](README.md)                                                                   |
| Тексты сайта                                      | [src/content/profile.ts](src/content/profile.ts)                                         |
| Ачивки и их хранение                              | [src/lib/achievements.ts](src/lib/achievements.ts), [src/lib/store.ts](src/lib/store.ts) |
| Вкладки, время суток, клавиатура                  | [src/components/Shell.tsx](src/components/Shell.tsx)                                     |
| Пост-обработка сборки                             | [scripts/prepare-static.mjs](scripts/prepare-static.mjs)                                 |
| Контраст токенов                                  | [scripts/contrast.mjs](scripts/contrast.mjs)                                             |
| Обязательные рекомендации (OWASP, WCAG…)          | `../agent-base/docs/principles.md` → «Стандарты»                                         |

## Нельзя

- Менять и удалять ключи `localStorage` (`pv2-ach`, `pv2-found`) и id ачивок и тайников без
  миграции — у посетителей пропадёт прогресс.
- Глушить правила линтера, удалять тесты, снижать пороги ради зелёного гейта.
- Ломать открытие с диска и публикацию: относительные пути из `prepare-static.mjs`, адрес
  `/portfolio/` на Pages.
- Удалять блок `nextjs-agent-rules` сверху — его пишет `next dev`.
