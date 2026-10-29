'use client';

import { useEffect, useRef, useState } from 'react';

import { ACHIEVEMENTS, achStore, SECRET_IDS } from '@/lib/achievements';
import { useStore } from '@/lib/store';

/** Ширина подсказки совпадает с CSS: min(340px, 100vw − 24px). */
const tipLeft = (x: number) => {
  const w = Math.min(340, innerWidth - 24);
  return Math.min(innerWidth - w - 12, Math.max(12, x - w / 2));
};

/** XP-шкала «колбасками» из проекта ооо: одно деление — одна ачивка. */
export function XpDock() {
  const { got } = useStore(achStore);
  const [tip, setTip] = useState<{ left: number; fine: boolean } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const prev = useRef(got.length);

  // Короткая вспышка заполнения при новой ачивке
  useEffect(() => {
    const bar = barRef.current;
    if (bar && got.length > prev.current) {
      bar.classList.remove('gain');
      void bar.offsetWidth;
      bar.classList.add('gain');
    }
    prev.current = got.length;
  }, [got.length]);

  const total = ACHIEVEMENTS.length;
  const pct = Math.round((got.length / total) * 100);
  const secretsLeft = SECRET_IDS.filter((id) => !got.includes(id)).length;
  const show = (x: number) =>
    setTip({ left: tipLeft(x), fine: matchMedia('(pointer: fine)').matches });

  return (
    <>
      <div
        className="xpdock"
        onPointerMove={(e) => show(e.clientX)}
        onPointerLeave={() => setTip(null)}
        onClick={(e) => (tip ? setTip(null) : show(e.clientX))}
      >
        <div
          ref={barRef}
          className="xpbar"
          role="progressbar"
          aria-label="Сайт изучен"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          style={
            { '--xp-pct': (got.length / total) * 100, '--xp-seg': total } as React.CSSProperties
          }
        >
          <i className="xpbar-fill" />
          <i className="xpbar-seg" />
        </div>
      </div>
      {tip && (
        <div className="xp-tip glass" role="tooltip" style={{ left: tip.left }}>
          <b>Сайт изучен на {pct}%</b>
          <span>
            Открыто {got.length} из {total} ачивок.{' '}
            {secretsLeft ? `Секретных ещё скрыто: ${secretsLeft}.` : 'Все секреты найдены.'}
          </span>
          <small>
            {!secretsLeft
              ? 'Вы видели всё. Геральт бы кивнул.'
              : tip.fine
                ? 'Медальон в углу дрожит рядом с тайником. Зажмите Alt, чтобы включить ведьмачье чутьё.'
                : 'Нажмите на медальон в правом нижнем углу: ведьмачье чутьё подсветит тайники.'}
          </small>
        </div>
      )}
    </>
  );
}
