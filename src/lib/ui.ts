import { unlock } from './achievements';
import { createStore } from './store';

interface UiState {
  /** Текущая страница = время суток: 0 ночь, 1 рассвет, 2 день. */
  page: number;
  /** Ведьмачье чутьё включено: тайники подсвечены. */
  senses: boolean;
  /** Курсор рядом с ненайденным тайником: медальон дрожит. */
  near: boolean;
  panelOpen: boolean;
}

export const uiStore = createStore<UiState>({
  page: 0,
  senses: false,
  near: false,
  panelOpen: false,
});

let sensesTimer: ReturnType<typeof setTimeout> | undefined;

export function setSenses(on: boolean, autoOffMs?: number) {
  clearTimeout(sensesTimer);
  sensesTimer = undefined;
  document.documentElement.classList.toggle('senses', on);
  uiStore.set((s) => ({ ...s, senses: on }));
  if (!on) return;
  unlock('medal');
  if (autoOffMs) sensesTimer = setTimeout(() => setSenses(false), autoOffMs);
}

export function setNear(near: boolean) {
  if (uiStore.get().near !== near) uiStore.set((s) => ({ ...s, near }));
}

export function setPanelOpen(panelOpen: boolean) {
  uiStore.set((s) => ({ ...s, panelOpen }));
}
