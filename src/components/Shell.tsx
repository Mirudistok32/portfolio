'use client';

import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { PAGES, SITE } from '@/content/profile';
import { loadAchievements, unlock, visitUnlocks } from '@/lib/achievements';
import { setSenses, uiStore } from '@/lib/ui';

import { CvButton } from './Actions';
import { Clock } from './Clock';
import { TAB_ICONS } from './icons';
import { Medallion } from './Medallion';
import { Scene } from './scene/Scene';
import { AchToasts, Toast } from './Toasts';
import { Trophy } from './Trophy';
import { XpDock } from './XpDock';

const EASE = 'cubic-bezier(.22,1,.36,1)';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Куда ведёт якорь: #contacts — на вкладку, #job-zvuk — к главе на её вкладке. */
function locate(id: string, sections: (HTMLElement | null)[]) {
  const page = PAGES.findIndex((p) => p.id === id);
  if (page >= 0 || !id) return { page, target: null };
  const target = document.getElementById(id);
  return { page: target ? sections.findIndex((s) => s?.contains(target)) : -1, target };
}

/** У каждой вкладки свой заголовок: по нему понятна вкладка браузера и история «назад». */
const titleOf = (i: number) => (i > 0 ? `${PAGES[i].label} — ${SITE.name}` : SITE.title);

/** Доехать до якоря на открытой вкладке и поставить на него фокус. */
function reveal(target: HTMLElement, smooth: boolean) {
  target.scrollIntoView({ behavior: smooth && !reduced() ? 'smooth' : 'auto', block: 'start' });
  target.focus({ preventScroll: true });
}

const GLASS = '.glass, .solid';

/**
 * Что гасить при смене страницы. Прозрачность нельзя анимировать у предка стекла: пока у него opacity < 1,
 * backdrop-filter не видит пейзаж и стекло светлеет, а в конце анимации рывком темнеет обратно.
 * Поэтому гаснут сами стёкла и ветки без стекла, а их обёртки только сдвигаются.
 */
function fadeParts(el: Element): Element[] {
  return el.matches(GLASS) || !el.querySelector(GLASS) ? [el] : [...el.children].flatMap(fadeParts);
}

/** Сдвиг у блока и угасание у его частей с одинаковым ходом времени. */
function slideFade(
  el: HTMLElement,
  from: string,
  to: string,
  fade: [number, number],
  timing: KeyframeAnimationOptions,
) {
  return [
    el.animate([{ transform: from }, { transform: to }], timing),
    ...fadeParts(el).map((p) => p.animate([{ opacity: fade[0] }, { opacity: fade[1] }], timing)),
  ];
}

/** Появление блоков страницы. */
function enter(section: HTMLElement, dir: number) {
  section.querySelectorAll<HTMLElement>('[data-s]').forEach((el, j) => {
    slideFade(el, `translateX(${dir * 60}px)`, 'none', [0, 1], {
      duration: 800,
      delay: 140 + j * 70,
      easing: EASE,
      fill: 'backwards',
    });
  });
}

/** Анимации смены страниц внутри секции, без CSS-анимаций и переходов её содержимого. */
const pageAnimations = (section: HTMLElement) =>
  section
    .getAnimations({ subtree: true })
    .filter((a) => !(a instanceof CSSAnimation || a instanceof CSSTransition));

/**
 * Оболочка одностраничного сайта: вкладки = время суток (ночь, рассвет, день, закат).
 * Весь текст всех страниц есть в HTML (для поисковиков), на экране видна одна.
 */
export function Shell({ pages }: { pages: ReactNode[] }) {
  const [page, setPage] = useState(0);
  // Подсказка про стрелки нужна один раз: прячется после первого перехода, прокрутки или через 10 секунд.
  // До скриптов её нет: сначала надо проверить, что она не ляжет на карточку.
  const [hint, setHint] = useState(false);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const cur = useRef(-1);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const tabsRef = useRef<HTMLElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);
  const nav = useRef({ visited: new Set<number>(), moves: 0, sawDay: false, born: 0 });

  const go = useCallback((i: number, animate = true) => {
    const prev = cur.current;
    if (i === prev || i < 0 || i >= PAGES.length) return;
    const dir = prev < 0 || i > prev ? 1 : -1;
    cur.current = i;
    document.documentElement.dataset.tod = String(i);
    document.title = titleOf(i);
    uiStore.set((s) => ({ ...s, page: i }));
    setPage(i);

    const n = nav.current;
    for (const id of visitUnlocks(i, n, PAGES.length)) {
      unlock(id);
      if (id === 'explorer' && performance.now() - n.born < 80_000) unlock('world80');
    }
    if (prev >= 0) {
      setHint(false);
      n.moves++;
      if (n.moves >= 7) unlock('griffin');
      if (n.moves >= 24) unlock('frames');
    }

    const inn = sections.current[i]!;
    pageAnimations(inn).forEach((a) => a.cancel());
    inn.hidden = false;
    inn.scrollTop = 0;
    // первый показ по ссылке вида #contacts: в HTML видна «Обо мне», её надо спрятать
    if (prev < 0)
      sections.current.forEach((s, j) => {
        if (s && j !== i) s.hidden = true;
      });
    if (prev >= 0) {
      const out = sections.current[prev]!;
      if (reduced() || !animate) out.hidden = true;
      else {
        out.style.pointerEvents = 'none';
        const anims = slideFade(out, 'none', `translateX(${-dir * 50}px)`, [1, 0], {
          duration: 380,
          easing: 'cubic-bezier(.4,0,.2,1)',
          fill: 'forwards',
        });
        Promise.all(anims.map((a) => a.finished))
          .then(() => {
            if (cur.current !== prev) out.hidden = true;
            out.style.pointerEvents = '';
            anims.forEach((a) => a.cancel());
          })
          .catch(() => {
            out.style.pointerEvents = '';
          });
      }
    }
    if (animate && !reduced()) enter(inn, dir);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      go(i);
      try {
        if (location.hash !== `#${PAGES[i].id}`) location.hash = PAGES[i].id;
      } catch {
        /* например, песочница без доступа к адресу */
      }
    },
    [go],
  );

  // Плашка под активной вкладкой
  useLayoutEffect(() => {
    const move = () => {
      const tab = tabsRef.current?.querySelectorAll<HTMLElement>('.tab')[page];
      const ind = indRef.current;
      if (!tab || !ind) return;
      ind.style.width = `${tab.offsetWidth}px`;
      ind.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    move();
    addEventListener('resize', move);
    document.fonts?.ready.then(move);
    return () => removeEventListener('resize', move);
  }, [page]);

  useEffect(() => {
    loadAchievements();
    nav.current.born = performance.now();
    const start = locate(location.hash.slice(1), sections.current);
    go(Math.max(0, start.page), false);
    // «Обо мне» уже нарисована из HTML до загрузки скриптов: анимация с нуля её бы мигнула
    // (и спрятала бы LCP). Въезжает только страница, открытая по ссылке, — её до этого не было видно.
    if (cur.current !== 0 && !reduced()) enter(sections.current[cur.current]!, 1);
    // ссылка сразу на главу (…#job-zvuk): браузер не доехал до неё, пока вкладка была скрыта
    if (start.target && start.page >= 0) reveal(start.target, false);
    // Next досылает метаданные потоком уже после гидратации и возвращает общий заголовок — ставим свой снова
    const keepTitle = new MutationObserver(() => {
      if (document.title !== titleOf(cur.current)) document.title = titleOf(cur.current);
    });
    keepTitle.observe(document.head, { childList: true, subtree: true, characterData: true });
    requestAnimationFrame(() => {
      tabsRef.current?.classList.add('ready');
      // Подсказка в углу не должна закрывать текст: если там уже карточка, обойдёмся без неё
      const el = hintRef.current;
      if (!el) return;
      el.hidden = false;
      const r = el.getBoundingClientRect();
      el.hidden = true;
      const covers = [...sections.current[cur.current]!.querySelectorAll(GLASS)].some((g) => {
        const b = g.getBoundingClientRect();
        return b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
      });
      if (r.width && !covers) setHint(true);
    });

    // Первая ачивка открывается молча: всплывашка на первом экране закрывала бы контент
    unlock('welcome', true);
    const timers = [setTimeout(() => setHint(false), 10_000)];
    let nightMs = 0;
    let contactMs = 0;
    const clock = setInterval(() => {
      if (document.hidden) return;
      if (cur.current === 0 && (nightMs += 1000) >= 60_000) unlock('stars');
      if (cur.current === 3 && (contactMs += 1000) >= 15_000) unlock('credits');
    }, 1000);

    const onScroll = (e: Event) => {
      if (e.target instanceof HTMLElement && e.target.scrollTop > 40) setHint(false);
    };
    const onHash = () => {
      const { page, target } = locate(location.hash.slice(1), sections.current);
      if (page < 0) return;
      go(page);
      if (target) reveal(target, false);
    };
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const { page, target } = locate(a.getAttribute('href')!.slice(1), sections.current);
      if (page < 0) return;
      e.preventDefault();
      // Якорь внутри страницы (например, глава опыта с витрины): открыть страницу и доехать до него
      const jump = page !== cur.current;
      goTo(page);
      if (target) reveal(target, !jump);
    };
    let typed = '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !e.repeat) {
        setSenses(true);
        return;
      }
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      if (e.key.length === 1) {
        typed = (typed + e.key.toLowerCase()).slice(-8);
        // «плотва» в русской раскладке, транслитом и русским словом на английской раскладке
        if (/(плотва|plotva|gkjndf)$/.test(typed)) {
          typed = '';
          unlock('plotva');
        }
      }
      // Shift со стрелками выделяет текст, вкладки им не листаются
      if (e.shiftKey) return;
      if (e.key === 'ArrowRight' && cur.current < PAGES.length - 1) {
        goTo(cur.current + 1);
        unlock('ninja');
      }
      if (e.key === 'ArrowLeft' && cur.current > 0) {
        goTo(cur.current - 1);
        unlock('ninja');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setSenses(false);
      }
    };

    // scroll не всплывает, ловим прокрутку страниц на погружении
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    addEventListener('hashchange', onHash);
    document.addEventListener('click', onClick);
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKeyUp);
    return () => {
      keepTitle.disconnect();
      timers.forEach(clearTimeout);
      clearInterval(clock);
      document.removeEventListener('scroll', onScroll, { capture: true });
      removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onClick);
      removeEventListener('keydown', onKey);
      removeEventListener('keyup', onKeyUp);
    };
  }, [go, goTo]);

  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержанию
      </a>
      <Scene page={page} />
      <div className="senses-fx" aria-hidden="true" />
      <div className="app">
        <header className="top">
          <Clock />
          <nav className="tabs glass" ref={tabsRef} aria-label="Разделы">
            <span className="tab-ind" ref={indRef} aria-hidden="true" />
            {PAGES.map((p, i) => (
              <a
                key={p.id}
                className="tab"
                href={`#${p.id}`}
                aria-current={i === page ? 'page' : undefined}
              >
                {TAB_ICONS[i]}
                <span>{p.label}</span>
              </a>
            ))}
          </nav>
          <div className="top-actions">
            <Medallion />
            <Trophy />
            <CvButton className="btn btn-accent btn-sm" compact />
          </div>
        </header>
        <main className="stage" id="main" tabIndex={-1}>
          {pages.map((node, i) => (
            <section
              key={PAGES[i].id}
              ref={(el) => {
                sections.current[i] = el;
              }}
              id={`page-${PAGES[i].id}`}
              className="page"
              aria-labelledby={`page-${PAGES[i].id}-title`}
              hidden={i !== 0}
            >
              {node}
            </section>
          ))}
        </main>
      </div>
      <p className="hint solid" ref={hintRef} aria-hidden="true" hidden={!hint}>
        <kbd>←</kbd>
        <kbd>→</kbd> листать время суток
      </p>
      <XpDock />
      {/* на телефоне оба тоста встают в этом контейнере столбиком, на ноутбуке у каждого своё место */}
      <div className="toasts">
        <AchToasts />
        <Toast />
      </div>
    </>
  );
}
