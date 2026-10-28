/** Короткие DOM-эффекты: искры и конфетти. Уважают prefers-reduced-motion. */

const reduced = () =>
  typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function burst(x: number, y: number, colors: string[], count = 14, spread = 70) {
  if (reduced()) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'spark';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = colors[i % colors.length];
    document.body.appendChild(p);
    const a = Math.random() * Math.PI * 2;
    const d = spread * (0.4 + Math.random() * 0.6);
    p.animate(
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.3)`,
          opacity: 0,
        },
      ],
      { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' },
    ).finished.then(() => p.remove());
  }
}

export function confetti() {
  if (reduced()) return;
  const colors = ['#F28C38', '#F0C866', '#C2AEFF', '#5FD8CC', '#93D977', '#F5F1EA'];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.background = colors[i % colors.length];
    c.style.left = `${Math.random() * 100}vw`;
    document.body.appendChild(c);
    c.animate(
      [
        { transform: 'translate(0,-5vh) rotate(0deg)' },
        {
          transform: `translate(${(Math.random() - 0.5) * 240}px,105vh) rotate(${Math.round(Math.random() * 8) * 90}deg)`,
        },
      ],
      {
        duration: 1900 + Math.random() * 1600,
        delay: Math.random() * 500,
        easing: 'linear',
        fill: 'backwards',
      },
    ).finished.then(() => c.remove());
  }
}
