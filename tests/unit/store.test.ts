import { afterEach, describe, expect, it, vi } from 'vitest';

import { createStore, storage } from '@/lib/store';

describe('createStore', () => {
  it('отдаёт начальное значение и принимает новое и функцию от прежнего', () => {
    const store = createStore(1);
    expect(store.get()).toBe(1);
    store.set(5);
    store.set((n) => n + 1);
    expect(store.get()).toBe(6);
  });

  it('зовёт подписчиков на каждое изменение и забывает отписавшихся', () => {
    const store = createStore('a');
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set('b');
    unsubscribe();
    store.set('c');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('storage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('пишет JSON и читает его обратно', () => {
    storage.write('k', ['x', 'y']);
    expect(localStorage.getItem('k')).toBe('["x","y"]');
    expect(storage.read<string[]>('k', [])).toEqual(['x', 'y']);
  });

  it('без ключа и с битым JSON отдаёт запасное значение', () => {
    expect(storage.read('нет', 7)).toBe(7);
    localStorage.setItem('k', '{не json');
    expect(storage.read('k', 7)).toBe(7);
  });

  it('молча переживает недоступное хранилище', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => storage.write('k', 1)).not.toThrow();
    expect(storage.read('k', 'запас')).toBe('запас');
  });
});
