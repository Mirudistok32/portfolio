'use client';

import { useEffect, useRef, useState } from 'react';

import { QUESTS } from '@/content/profile';
import { unlock } from '@/lib/achievements';
import { copyText } from '@/lib/copy';

import { Period } from './Period';

/** «**текст**» из профиля → выделенный текст. */
function rich(text: string) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
}

/**
 * Опыт как журнал заданий: все главы идут подряд, оглавление — якоря к ним.
 * Пункт главы, до которой долистали, подсвечивается и отмечается прочитанным.
 */
export function QuestLog() {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);
  const root = useRef<HTMLDivElement>(null);
  const toc = useRef<HTMLElement>(null);

  useEffect(() => {
    const page = root.current?.closest<HTMLElement>('.page');
    if (!page) return;
    const chapters = [...root.current!.querySelectorAll<HTMLElement>('.q-detail')];
    let raf = 0;
    const spy = () => {
      raf = 0;
      const line = page.getBoundingClientRect().top + page.clientHeight * 0.35;
      let i = 0;
      chapters.forEach((c, j) => {
        if (c.getBoundingClientRect().top <= line) i = j;
      });
      // последняя глава может не дотянуться до линии — тогда засчитываем её у дна
      if (page.scrollTop + page.clientHeight >= page.scrollHeight - 2) i = chapters.length - 1;
      setActive(i);
      setSeen((s) => (s.includes(i) ? s : [...s, i]));
    };
    const onScroll = () => {
      raf ||= requestAnimationFrame(spy);
    };
    page.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      page.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (seen.length === QUESTS.length) unlock('quests');
  }, [seen]);

  // На узком экране оглавление — горизонтальная лента: держим активный пункт на виду
  useEffect(() => {
    const list = toc.current;
    const item = list?.children[active] as HTMLElement | undefined;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [active]);

  return (
    <div className="quests" ref={root}>
      <nav className="q-list" ref={toc} aria-label="Места работы" data-s>
        {QUESTS.map((q, i) => (
          <a
            key={q.id}
            href={`#job-${q.id}`}
            aria-current={i === active ? 'true' : undefined}
            className={seen.includes(i) ? 'q solid seen' : 'q solid'}
          >
            <span className="q-co">{q.company}</span>
            <span className="q-meta">{q.short}</span>
          </a>
        ))}
      </nav>
      <div className="q-panels" data-s>
        {QUESTS.map((q) => (
          <article
            key={q.id}
            id={`job-${q.id}`}
            tabIndex={-1}
            aria-labelledby={`job-${q.id}-title`}
            className="q-detail glass"
          >
            <header>
              <p className="q-when">
                <Period text={q.period} />
              </p>
              <h3 id={`job-${q.id}-title`}>
                {q.role}
                {' '}
                <span>· {q.company}</span>
              </h3>
              <p className="q-about">{q.about}</p>
            </header>
            {q.stats && (
              <ul className="stats">
                {q.stats.map(([v, t]) => (
                  <li key={v}>
                    <b>{v}</b>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="story">
              {q.story.map((p) => (
                <p key={p}>{rich(p)}</p>
              ))}
            </div>
            <ul className="chips" id={`job-${q.id}-stack`} aria-label="Стек">
              {q.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="q-foot">
              <p className="fun">
                <b>Фан-факт</b> {q.fun}
              </p>
              <button
                type="button"
                className="btn-link"
                onClick={() =>
                  copyText(
                    q.stack.join(', '),
                    'Стек скопирован. Ctrl+Z не входит, он врождённый.',
                    document.getElementById(`job-${q.id}-stack`),
                    () => unlock('deck'),
                  )
                }
              >
                Скопировать стек
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
