import { unlock } from './achievements';
import { toast } from './toast';

/** Копирует текст; если буфер недоступен (старый браузер, file:// в Safari), выделяет текст для Ctrl+C. */
export function copyText(
  text: string,
  okMessage: string,
  fallback?: HTMLElement | null,
  onOk?: () => void,
) {
  let job: Promise<void>;
  try {
    job = navigator.clipboard.writeText(text);
  } catch (e) {
    job = Promise.reject(e);
  }
  job
    .then(() => {
      toast(okMessage);
      unlock('copy');
      onOk?.();
    })
    .catch(() => {
      if (fallback) {
        const range = document.createRange();
        range.selectNodeContents(fallback);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      toast('Скопировать не вышло. Текст выделен, нажмите Ctrl+C.');
    });
}
