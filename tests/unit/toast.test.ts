import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast, toastMs, toastStore } from '@/lib/toast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
});

describe('тост', () => {
  it('короткое уведомление держится 3 секунды', () => {
    toast('Почта скопирована.');
    vi.advanceTimersByTime(2999);
    expect(toastStore.get()?.text).toBe('Почта скопирована.');
    vi.advanceTimersByTime(1);
    expect(toastStore.get()).toBeNull();
  });

  it('длинное держится дольше, чтобы его успели дочитать, но не больше 7 секунд', () => {
    const planet =
      'Планета 6 из 7. Изумрудная планета. Ведьмаки сюда не летают: до контрактов слишком далеко.';
    expect(toastMs(planet)).toBeGreaterThan(4000);
    expect(toastMs('x'.repeat(1000))).toBe(7000);
    toast(planet);
    vi.advanceTimersByTime(3500);
    expect(toastStore.get()?.text).toBe(planet);
  });

  it('новое уведомление заменяет текущее и живёт своё время', () => {
    toast('Первое');
    vi.advanceTimersByTime(2000);
    toast('Второе');
    vi.advanceTimersByTime(2000);
    expect(toastStore.get()?.text).toBe('Второе');
    vi.advanceTimersByTime(1000);
    expect(toastStore.get()).toBeNull();
  });
});
