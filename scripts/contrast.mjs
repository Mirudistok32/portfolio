/**
 * Проверка контраста текста по WCAG 2.1 (на ней же основан ГОСТ Р 52872-2019).
 * Весь текст лежит на полупрозрачных панелях поверх пейзажа, поэтому фон считается для худшего случая:
 * панель поверх самого светлого места сцены (белое облако днём) и поверх самого тёмного (ночь).
 * Стекло затемняет то, что под ним (brightness в --glass-fx), это учитывается до наложения подложки.
 * Порог AA: 4.5:1 для обычного текста, 3:1 для крупного (от 24px или от 18.66px жирного).
 */

const hex = (h) =>
  h
    .replace('#', '')
    .match(/../g)
    .map((x) => parseInt(x, 16));
const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const over = (top, alpha, bottom) =>
  top.map((c, i) => Math.round(c * alpha + bottom[i] * (1 - alpha)));

const WHITE = hex('#FFFFFF');
const NIGHT = hex('#05040B');
// [цвет, непрозрачность, brightness под стеклом, белая подложка чипа поверх]
const panels = {
  'стекло 0.6': [hex('#0A2724'), 0.6, 0.38, 0],
  'чип на стекле': [hex('#0A2724'), 0.6, 0.38, 0.08],
  'плотная 0.72': [hex('#0A2724'), 0.72, 0.38, 0],
  'выбранная глава 0.96': [hex('#08201D'), 0.96, 0.38, 0],
  'главная: стекло 0.5': [hex('#0A2724'), 0.5, 0.33, 0],
  'главная: чип на стекле': [hex('#0A2724'), 0.5, 0.33, 0.08],
  'главная: плотная 0.62': [hex('#0A2724'), 0.62, 0.33, 0],
  'без backdrop-filter 0.9': [hex('#0A2724'), 0.9, 1, 0],
};
const texts = {
  'основной #FBF9F5': ['#FBF9F5', 4.5],
  'второстепенный #ECE8F2': ['#ECE8F2', 4.5],
  'подписи #DCD7E5': ['#DCD7E5', 4.5],
  'золото #F5D27A': ['#F5D27A', 4.5],
  'бирюза #7FE3D8': ['#7FE3D8', 4.5],
  'фиолет #D0C0FF': ['#D0C0FF', 4.5],
  'зелень #A8E38F': ['#A8E38F', 4.5],
};
const solids = [
  ['кнопка: #1A0F08 на #F28C38', '#1A0F08', '#F28C38', 4.5],
  ['вкладка ночь: #14101F на #D2C2FF', '#14101F', '#D2C2FF', 4.5],
  ['вкладка рассвет: #14101F на #F6B3C4', '#14101F', '#F6B3C4', 4.5],
  ['вкладка день: #14101F на #9FDCF8', '#14101F', '#9FDCF8', 4.5],
  ['значок ачивки: #1A0F08 на #F5D27A', '#1A0F08', '#F5D27A', 4.5],
  ['XP-подсказка: #5FDCEF на #0A1014', '#5FDCEF', '#0A1014', 4.5],
  ['фокус: #FFD46B на #05040B (3:1)', '#FFD46B', '#05040B', 3],
];

let fails = 0;
const row = (name, r, min) => {
  const ok = r >= min;
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(46)} ${r.toFixed(2)}:1 (нужно ${min}:1)`);
};

for (const [pName, [color, alpha, dim, chip]] of Object.entries(panels)) {
  const worst = over(
    WHITE,
    chip,
    over(
      color,
      alpha,
      WHITE.map((c) => Math.round(c * dim)),
    ),
  );
  const best = over(WHITE, chip, over(color, alpha, NIGHT));
  console.log(`\n${pName}: фон от rgb(${best}) до rgb(${worst})`);
  for (const [tName, [t, min]] of Object.entries(texts))
    row(`${tName} · худший фон`, ratio(hex(t), worst), min);
}
console.log('\nсплошные цвета');
for (const [name, fg, bg, min] of solids) row(name, ratio(hex(fg), hex(bg)), min);
console.log(fails ? `\nНе проходят: ${fails}` : '\nВсе пары проходят WCAG AA.');
process.exit(fails ? 1 : 0);
