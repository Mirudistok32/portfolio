'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import avatar from '@/assets/avatar.webp';
import { SITE } from '@/content/profile';
import { unlock } from '@/lib/achievements';
import { burst } from '@/lib/fx';

const QUIPS: Record<number, string> = {
  1: 'Привет! Рад знакомству.',
  3: 'Хм.',
  5: 'Пять кликов. Разминка засчитана.',
  10: '10! Вы точно HR, а не тестировщик?',
  20: 'Портрет заслужил рамку. Дориан Грей бы позавидовал.',
  42: '42. Ответ найден. Теперь можно в Telegram.',
};

/** 1 вжух, 2 вжуха, 5 вжухов, 21 вжух, 112 вжухов. */
const whoosh = (n: number) => {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return `${n} вжух`;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${n} вжуха`;
  return `${n} вжухов`;
};

/** Фото с мини-игрой «нажми на портрет» — привет первому пет-проекту ClickMeGame. */
export function Portrait() {
  const [clicks, setClicks] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const onClick = (e: React.MouseEvent) => {
    const n = clicks + 1;
    setClicks(n);
    setBubble(QUIPS[n] ?? (n > 42 && n % 25 === 0 ? 'Ладно, вы победили.' : whoosh(n)));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setBubble(null), 2400);
    if (n === 5) unlock('warmup');
    if (n === 20) unlock('dorian');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    btnRef.current?.animate(
      [{ transform: 'none' }, { transform: 'scale(.96) rotate(-1.5deg)' }, { transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' },
    );
    const box = boxRef.current!.getBoundingClientRect();
    const x = e.clientX || box.left + box.width / 2;
    const y = e.clientY || box.top + box.height / 2;
    const plus = document.createElement('span');
    plus.className = 'plus';
    plus.textContent = '+1';
    plus.style.left = `${x - box.left}px`;
    plus.style.top = `${y - box.top}px`;
    boxRef.current!.appendChild(plus);
    plus
      .animate(
        [
          { transform: 'translate(-50%,-50%)', opacity: 1 },
          { transform: `translate(${-50 + (Math.random() - 0.5) * 120}%, -300%)`, opacity: 0 },
        ],
        { duration: 800, easing: 'cubic-bezier(.22,1,.36,1)' },
      )
      .finished.then(() => plus.remove());
    burst(x, y, ['#F0C866', '#F28C38', '#C2AEFF'], 8, 40);
  };

  return (
    <div className="visual" ref={boxRef} data-s>
      <button
        ref={btnRef}
        type="button"
        className={clicks >= 20 ? 'portrait framed' : 'portrait'}
        aria-label="Портрет. Можно нажимать"
        onClick={onClick}
      >
        {/* sync: при F5 браузер не покажет кадр с пустой рамкой, пока фото декодируется */}
        <Image
          src={avatar}
          alt={SITE.name}
          priority
          decoding="sync"
          sizes="(max-width: 1000px) 260px, 320px"
        />
      </button>
      <span className="bubble glass" role="status" aria-live="polite" hidden={!bubble}>
        {bubble}
      </span>
      <span className="float solid f1" data-depth="1.6">
        <i style={{ background: 'var(--teal)' }} />
        Next.js
      </span>
      <span className="float solid f2" data-depth="2.4">
        <i style={{ background: 'var(--violet)' }} />
        TypeScript
      </span>
      <span className="float solid f3" data-depth="1.1">
        <i style={{ background: 'var(--ember)' }} />
        JavaScript
      </span>
    </div>
  );
}
