'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type Achievement,
  ACHIEVEMENTS,
  achStore,
  cardOf,
  resetAchievements,
} from '@/lib/achievements';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { setPanelOpen, uiStore } from '@/lib/ui';

import { CloseIcon, TrophyIcon } from './icons';

const PLAIN = ACHIEVEMENTS.filter((a) => !a.hint);
const SECRET = ACHIEVEMENTS.filter((a) => a.hint);

function Item({ a, got }: { a: Achievement; got: boolean }) {
  const card = cardOf(a, got);
  return (
    <li className={got ? 'ach' : 'ach locked'}>
      <span className="ach-ic" aria-hidden="true">
        {card.icon}
      </span>
      <span>
        <b>{card.title}</b>
        <small>{card.desc}</small>
      </span>
    </li>
  );
}

function Group({ title, list, got }: { title: string; list: Achievement[]; got: string[] }) {
  return (
    <>
      <p className="ach-group">
        {title}
        <span>
          {list.filter((a) => got.includes(a.id)).length}/{list.length}
        </span>
      </p>
      <ul className="ach-list">
        {list.map((a) => (
          <Item key={a.id} a={a} got={got.includes(a.id)} />
        ))}
      </ul>
    </>
  );
}

/** Кубок в шапке и панель со всеми ачивками. */
export function Trophy() {
  const { got } = useStore(achStore);
  const { panelOpen } = useStore(uiStore);
  // Сброс в два нажатия: прогресс не должен пропадать от одного случайного клика
  const [confirm, setConfirm] = useState(false);
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
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 5000);
    return () => clearTimeout(t);
  }, [confirm]);

  const close = useCallback((refocus: boolean) => {
    setPanelOpen(false);
    setConfirm(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !panelRef.current?.contains(t) &&
        !buttonRef.current?.contains(t) &&
        !(t instanceof Element && t.closest('.ach-toast'))
      )
        close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelOpen, close]);

  const onReset = () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    resetAchievements();
    setConfirm(false);
    toast('Прогресс сброшен. Тайники снова спрятаны.');
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="trophy solid"
        aria-expanded={panelOpen}
        aria-controls="ach-panel"
        aria-label={`Ачивки: ${got.length} из ${ACHIEVEMENTS.length}`}
        title="Ачивки: на сайте спрятаны секреты, кубок считает найденные"
        onClick={() => (panelOpen ? close(false) : setPanelOpen(true))}
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
              {got.length} из {ACHIEVEMENTS.length}
            </span>
            <button
              type="button"
              className="ach-close"
              aria-label="Закрыть"
              onClick={() => close(true)}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="ach-scroll">
            <Group title="Обычные" list={PLAIN} got={got} />
            <Group title="Секретные" list={SECRET} got={got} />
          </div>
          <div className="ach-foot">
            <span aria-live="polite">
              {confirm ? 'Все ачивки и тайники пропадут' : 'Прогресс хранится в этом браузере'}
            </span>
            <button type="button" data-confirm={confirm || undefined} onClick={onReset}>
              {confirm ? 'Да, сбросить' : 'Сбросить'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
