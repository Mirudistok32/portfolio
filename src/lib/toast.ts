import { createStore } from './store';

export const toastStore = createStore<{ id: number; text: string } | null>(null);

let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Сколько держать уведомление: 3 секунды, длинному — дольше, чтобы его успели дочитать. */
export const toastMs = (text: string) => Math.min(7000, Math.max(3000, text.length * 55));

/** Показывает уведомление; новое заменяет текущее. */
export function toast(text: string) {
  clearTimeout(timer);
  toastStore.set({ id: ++seq, text });
  timer = setTimeout(() => toastStore.set(null), toastMs(text));
}
