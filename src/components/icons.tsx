/** Пиксельные иконки 8×8 для вкладок и кубка: пиксель-арт оставлен только в картинках, не в тексте. */

const pixel = (d: string) => (
  <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
    <path fill="currentColor" d={d} />
  </svg>
);

export const TAB_ICONS = [
  pixel(
    'M2 0h4v1H2zM1 1h6v1H1zM0 2h2v1H0zM6 2h2v1H6zM0 3h8v2H0zM1 5h6v1H1zM1 6h1v2H1zM3 6h2v2H3zM6 6h1v2H6z',
  ),
  pixel('M1 0h6v1H1zM0 1h8v1H0zM1 2h1v4H1zM6 2h1v4H6zM3 3h2v1H3zM3 5h2v1H3zM0 6h8v1H0zM1 7h6v1H1z'),
  pixel('M3 0h2v2H3zM0 3h2v2H0zM6 3h2v2H6zM3 6h2v2H3zM2 2h4v4H2z'),
  pixel(
    'M0 1h8v1H0zM0 2h1v5H0zM7 2h1v5H7zM0 7h8v1H0zM1 2h1v1H1zM6 2h1v1H6zM2 3h1v1H2zM5 3h1v1H5zM3 4h2v1H3z',
  ),
];

export const TrophyIcon = () =>
  pixel('M1 0h6v1H1zM0 1h1v2H0zM7 1h1v2H7zM1 1h6v3H1zM2 4h4v1H2zM3 5h2v1H3zM2 6h4v1H2zM1 7h6v1H1z');

/** Медальон Школы Волка: пиксельная карта 16×16. */
const MEDAL_MAP = [
  '.....rrrrrr.....',
  '...rrddddddrr...',
  '..rddddddddddr..',
  '.rddwddddddwddr.',
  '.rddwwddddwwddr.',
  'rdddwwwwwwwwdddr',
  'rdddwewwwwewdddr',
  'rdddwwwwwwwwdddr',
  'rddddwwwwwwddddr',
  'rddddwdwwdwddddr',
  'rdddddwwwwdddddr',
  '.rddddwwwwddddr.',
  '.rdddddwwdddddr.',
  '..rddddddddddr..',
  '...rrddddddrr...',
  '.....rrrrrr.....',
];
const MEDAL_COLORS: Record<string, string> = {
  r: '#C9C4D6',
  d: '#2A2638',
  w: '#A8A2B8',
  e: '#D9534F',
};

const medalRects = MEDAL_MAP.flatMap((row, y) => {
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  let x = 0;
  while (x < 16) {
    const ch = row[x];
    let end = x;
    while (end < 16 && row[end] === ch) end++;
    if (ch !== '.') rects.push({ x, y, w: end - x, fill: MEDAL_COLORS[ch] });
    x = end;
  }
  return rects;
});

export const MedalIcon = () => (
  <svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
    {medalRects.map((r) => (
      <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
    ))}
  </svg>
);
