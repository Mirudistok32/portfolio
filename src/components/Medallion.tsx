'use client';

import { useStore } from '@/lib/store';
import { setSenses, uiStore } from '@/lib/ui';

import { MedalIcon } from './icons';

/** Медальон Школы Волка: дрожит рядом с тайником, по нажатию включает ведьмачье чутьё на 6 секунд. */
export function Medallion() {
  const { near, senses } = useStore(uiStore);
  return (
    <button
      type="button"
      className={near ? 'medal near' : 'medal'}
      aria-pressed={senses}
      aria-label="Ведьмачье чутьё: подсветить тайники"
      title="Ведьмачье чутьё (или зажмите Alt)"
      onClick={() => setSenses(!senses, 6000)}
    >
      <MedalIcon />
    </button>
  );
}
