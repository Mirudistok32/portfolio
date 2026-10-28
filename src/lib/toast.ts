import { createStore } from './store';

export const toastStore = createStore<{ id: number; text: string } | null>(null);

let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Показывает уведомление на 3 секунды; новое заменяет текущее. */
export function toast(text: string) {
  clearTimeout(timer);
  toastStore.set({ id: ++seq, text });
  timer = setTimeout(() => toastStore.set(null), 3000);
}
