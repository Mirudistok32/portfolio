import { describe, expect, it } from 'vitest';

import { lightAt, TOD } from '@/lib/daylight';

describe('lightAt', () => {
  it('у каждой вкладки своё время суток, и закат идёт после дня', () => {
    expect(TOD).toHaveLength(4);
    expect(TOD[3]).toBeGreaterThan(TOD[2]);
  });

  it('все множители остаются от 0 до 1 на всём пути от ночи до заката', () => {
    for (let tod = 0; tod <= TOD[3]; tod += 0.01)
      for (const v of Object.values(lightAt(tod))) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
  });

  it('закат появляется только после дня, а день на нём не гаснет', () => {
    expect(lightAt(TOD[0]).dusk).toBe(0);
    expect(lightAt(TOD[1]).dusk).toBe(0);
    expect(lightAt(TOD[2]).dusk).toBe(0);
    expect(lightAt(TOD[3]).dusk).toBe(1);
    expect(lightAt(TOD[3]).day).toBe(1);
  });

  it('ночь и рассвет на закате не возвращаются', () => {
    expect(lightAt(TOD[3]).night).toBe(0);
    expect(lightAt(TOD[3]).dawn).toBe(0);
  });
});
