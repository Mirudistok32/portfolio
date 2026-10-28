'use client';

import { useEffect, useRef } from 'react';

import {
  type Achievement,
  ACHIEVEMENTS,
  achStore,
  resetAchievements,
  SECRET_IDS,
} from '@/lib/achievements';
import { useStore } from '@/lib/store';
import { setPanelOpen, uiStore } from '@/lib/ui';

import { TrophyIcon } from './icons';

function Item({ a, got }: { a: Achievement; got: boolean }) {
  const hidden = !got && a.hint;
  return (
    <li className={got ? 'ach' : 'ach locked'}>
      <span className="ach-ic" aria-hidden="true">
        {hidden ? '?' : a.icon}
      </span>
      <span>
        <b>{hidden ? '???' : a.title}</b>
        <small>{hidden ? a.hint : a.desc}</small>
      </span>
    </li>
  );
}

/** Кубок в шапке и панель со всеми ачивками. */
export function Trophy() {
  const { got } = useStore(achStore);
  const { panelOpen } = useStore(uiStore);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const prevCount = useRef(got.length);

  // Кубок подпрыгивает, когда приходит новая ачивка
  useEffect(() => {
    if (got.length > prevCount.current && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      buttonRef.current?.animate(
        [{ transform: 'none' }, { transform: 'scale(1.15) rotate(-8deg)' }, { transform: 'none' }],
        { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)' },
      );
    prevCount.current = got.length;
  }, [got.length]);

  useEffect(() => {
    if (!panelOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !panelRef.current?.contains(t) &&
        !buttonRef.current?.contains(t) &&
        !(t instanceof Element && t.closest('.ach-toast'))
      )
        setPanelOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanelOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelOpen]);

  const secretsFound = SECRET_IDS.filter((id) => got.includes(id)).length;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="trophy solid"
        aria-expanded={panelOpen}
        aria-controls="ach-panel"
        aria-label={`Ачивки: ${got.length} из ${ACHIEVEMENTS.length}`}
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <TrophyIcon />
        <span aria-hidden="true">
          {got.length}/{ACHIEVEMENTS.length}
        </span>
      </button>
      {panelOpen && (
        <section ref={panelRef} id="ach-panel" className="ach-panel glass" aria-label="Ачивки">
          <div className="ach-head">
            <h2>Ачивки</h2>
            <span>
              {got.length} из {ACHIEVEMENTS.length} · секретов {secretsFound}/{SECRET_IDS.length}
            </span>
          </div>
          <div className="ach-scroll">
            <p className="ach-group">Открытые</p>
            <ul className="ach-list">
              {ACHIEVEMENTS.filter((a) => !a.hint).map((a) => (
                <Item key={a.id} a={a} got={got.includes(a.id)} />
              ))}
            </ul>
            <p className="ach-group">Секретные</p>
            <ul className="ach-list">
              {ACHIEVEMENTS.filter((a) => a.hint).map((a) => (
                <Item key={a.id} a={a} got={got.includes(a.id)} />
              ))}
            </ul>
          </div>
          <div className="ach-foot">
            <span>Прогресс хранится в этом браузере</span>
            <button type="button" onClick={resetAchievements}>
              Сбросить
            </button>
          </div>
        </section>
      )}
    </>
  );
}
