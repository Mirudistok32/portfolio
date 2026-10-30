/** Вкладка → время суток: ночь, рассвет, день, закат. Закат идёт после дня, поэтому больше 1. */
export const TOD = [0, 0.38, 1, 1.4];

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Множители света для времени суток, каждый от 0 до 1: `globalAlpha` вне этого промежутка браузер
 * игнорирует. На закате `day` остаётся единицей, поэтому дневное не гаснет само, а смотрит на `dusk`.
 */
export function lightAt(tod: number) {
  return {
    night: clamp(1 - tod * 1.25),
    dawn: clamp(1 - Math.abs(tod - TOD[1]) / 0.3),
    day: clamp((tod - 0.45) / 0.55),
    dusk: clamp((tod - 1) / (TOD[3] - 1)),
  };
}
