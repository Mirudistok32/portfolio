'use client';

import { useEffect, useRef } from 'react';

import { ROT_WORDS } from '@/content/profile';
import { uiStore } from '@/lib/ui';

/** Меняющееся слово в заголовке. Высота заголовка закреплена по самому длинному варианту, чтобы текст ниже не прыгал. */
export function RotWord() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const word = ref.current!;
    const h1 = word.closest('h1')!;
    const lock = () => {
      const was = word.textContent;
      h1.style.minHeight = '';
      let max = 0;
      for (const w of ROT_WORDS) {
        word.textContent = w;
        max = Math.max(max, h1.offsetHeight);
      }
      word.textContent = was;
      h1.style.minHeight = `${max}px`;
    };
    lock();
    document.fonts?.ready.then(lock);
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(lock, 150);
    };
    addEventListener('resize', onResize);

    let i = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setInterval(() => {
      if (document.hidden || uiStore.get().page !== 0) return;
      i = (i + 1) % ROT_WORDS.length;
      if (reduce) {
        word.textContent = ROT_WORDS[i];
        return;
      }
      const out = word.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-30%)' },
        ],
        {
          duration: 220,
          easing: 'ease-in',
          fill: 'forwards',
        },
      );
      out.finished
        .then(() => {
          word.textContent = ROT_WORDS[i];
          word.animate(
            [
              { opacity: 0, transform: 'translateY(30%)' },
              { opacity: 1, transform: 'none' },
            ],
            {
              duration: 320,
              easing: 'cubic-bezier(.22,1,.36,1)',
            },
          );
          out.cancel();
        })
        .catch(() => {});
    }, 2800);

    return () => {
      clearInterval(id);
      clearTimeout(resizeTimer);
      removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <span className="rot">
      <span ref={ref} className="hl">
        {ROT_WORDS[0]}
      </span>
    </span>
  );
}
