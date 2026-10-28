'use client';

import { ACHIEVEMENTS, achStore, achToast } from '@/lib/achievements';
import { useStore } from '@/lib/store';
import { toastStore } from '@/lib/toast';
import { setPanelOpen } from '@/lib/ui';

/** Обычные уведомления: одно за раз. */
export function Toast() {
  const t = useStore(toastStore);
  return (
    <div className="toast-slot" role="status" aria-live="polite">
      {t && (
        <div key={t.id} className="toast glass">
          {t.text}
        </div>
      )}
    </div>
  );
}

/**
 * Тост новой ачивки: короткая строка под кубком, без искр. Он не должен перетягивать внимание
 * с контента. Нажатие открывает панель всех ачивок, описание видно там и в подсказке.
 */
export function AchToasts() {
  const current = useStore(achToast);
  const { got } = useStore(achStore);

  return (
    <div className="ach-toasts" role="status" aria-live="polite">
      {current && (
        <button
          key={current.title}
          type="button"
          className="ach-toast"
          title={current.desc}
          onClick={() => setPanelOpen(true)}
        >
          <span className="ach-ic" aria-hidden="true">
            {current.icon}
          </span>
          <b>
            <span className="sr-only">Ачивка: </span>
            {current.title}
          </b>
          <small>
            {got.length}/{ACHIEVEMENTS.length}
          </small>
        </button>
      )}
    </div>
  );
}
