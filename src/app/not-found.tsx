import type { Metadata } from 'next';

import { SITE } from '@/content/profile';

export const metadata: Metadata = {
  title: `Страница не найдена — ${SITE.name}`,
  robots: { index: false },
};

/**
 * 404 для GitHub Pages: по-русски и с дорогой назад. Ссылка — полный адрес сайта: эта страница
 * отдаётся по любому неверному пути, и относительная ссылка с вложенного пути вела бы мимо.
 */
export default function NotFound() {
  return (
    <main className="lost">
      {/* ночное небо пейзажа без холстов: тот же фон, что виден до загрузки скриптов */}
      <div className="scene" aria-hidden="true" />
      <div className="lost-card glass">
        <p className="label">Ошибка 404</p>
        <h1>Такой страницы нет</h1>
        <p>Похоже, ссылка устарела или в адресе опечатка. Всё портфолио — на одной странице.</p>
        <a className="btn btn-accent" href={SITE.url}>
          На главную{' '}
          <span className="arr" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </main>
  );
}
