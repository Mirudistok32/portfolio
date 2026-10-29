import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fx', () => ({ confetti: vi.fn() }));

// У модуля своё состояние (хранилища, очередь тостов) — каждый тест берёт свежую копию.
const fresh = async () => {
  vi.resetModules();
  return import('@/lib/achievements');
};
const saved = (key: string) => JSON.parse(localStorage.getItem(key) ?? 'null');

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('выдача', () => {
  it('ачивка выдаётся один раз: в состоянии, в хранилище и в тостах', async () => {
    const { achStore, achToast, unlock } = await fresh();
    unlock('ninja');
    unlock('ninja');
    expect(achStore.get().got).toEqual(['ninja']);
    expect(saved('pv2-ach')).toEqual(['ninja']);
    expect(achToast.get()?.id).toBe('ninja');
    vi.advanceTimersByTime(2400);
    expect(achToast.get()).toBeNull();
  });

  it('quiet открывает без тоста', async () => {
    const { achStore, achToast, unlock } = await fresh();
    unlock('welcome', true);
    expect(achStore.get().got).toEqual(['welcome']);
    expect(achToast.get()).toBeNull();
  });

  it('тосты идут по одному, три и больше в очереди — одним тостом', async () => {
    const { achToast, unlock } = await fresh();
    unlock('ninja');
    unlock('griffin');
    unlock('explorer');
    unlock('dawn');
    expect(achToast.get()?.id).toBe('ninja');
    vi.advanceTimersByTime(2400);
    expect(achToast.get()).toMatchObject({ id: 'batch', icon: '+3' });
    vi.advanceTimersByTime(2400);
    expect(achToast.get()).toBeNull();
  });

  it('десятая ачивка даёт «Манчкина»', async () => {
    const { ACHIEVEMENTS, achStore, unlock } = await fresh();
    const plain = ACHIEVEMENTS.filter((a) => !a.hint && a.id !== 'final' && a.id !== 'munchkin');
    plain.slice(0, 9).forEach((a) => unlock(a.id, true));
    expect(achStore.get().got).not.toContain('munchkin');
    unlock(plain[9].id, true);
    expect(achStore.get().got).toContain('munchkin');
  });

  it('все ачивки дают «Легенду» с конфетти', async () => {
    const { ACHIEVEMENTS, achStore, unlock } = await fresh();
    const { confetti } = await import('@/lib/fx');
    ACHIEVEMENTS.filter((a) => a.id !== 'final').forEach((a) => unlock(a.id, true));
    expect(achStore.get().got).not.toContain('final');
    vi.advanceTimersByTime(900);
    expect(achStore.get().got).toContain('final');
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(achStore.get().got).toHaveLength(ACHIEVEMENTS.length);
  });
});

describe('секретные', () => {
  it('до открытия — «???» и подсказка, после — название и условие', async () => {
    const { ACHIEVEMENTS, cardOf } = await fresh();
    const secret = ACHIEVEMENTS.find((a) => a.id === 'invisible')!;
    expect(cardOf(secret, false)).toEqual({ icon: '?', title: '???', desc: secret.hint });
    expect(cardOf(secret, true)).toEqual({
      icon: secret.icon,
      title: 'Человек-невидимка',
      desc: secret.desc,
    });
  });

  it('обычная ачивка видна и до открытия', async () => {
    const { ACHIEVEMENTS, cardOf } = await fresh();
    const plain = ACHIEVEMENTS.find((a) => a.id === 'welcome')!;
    expect(cardOf(plain, false).title).toBe(plain.title);
  });

  it('в списке 40 ачивок, из них 18 секретных, id не повторяются', async () => {
    const { ACHIEVEMENTS, SECRET_IDS } = await fresh();
    expect(ACHIEVEMENTS).toHaveLength(40);
    expect(SECRET_IDS).toHaveLength(18);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe('прогресс после перезагрузки', () => {
  it('ачивки и тайники читаются из localStorage', async () => {
    const before = await fresh();
    before.unlock('ninja', true);
    before.markFound('owl');

    const after = await fresh();
    expect(after.achStore.get()).toEqual({ got: [], found: [] });
    after.loadAchievements();
    expect(after.achStore.get()).toEqual({ got: ['ninja'], found: ['owl'] });
  });

  it('неизвестные id из хранилища отбрасываются', async () => {
    localStorage.setItem('pv2-ach', JSON.stringify(['ninja', 'удалённая']));
    const { achStore, loadAchievements } = await fresh();
    loadAchievements();
    expect(achStore.get().got).toEqual(['ninja']);
  });

  it('тайник отмечается один раз', async () => {
    const { markFound } = await fresh();
    expect(markFound('owl')).toBe(true);
    expect(markFound('owl')).toBe(false);
    expect(saved('pv2-found')).toEqual(['owl']);
  });

  it('сброс очищает и состояние, и хранилище', async () => {
    const { achStore, markFound, resetAchievements, unlock } = await fresh();
    unlock('ninja', true);
    markFound('owl');
    resetAchievements();
    expect(achStore.get()).toEqual({ got: [], found: [] });
    expect(saved('pv2-ach')).toEqual([]);
    expect(saved('pv2-found')).toEqual([]);
  });
});
