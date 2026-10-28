import type { NextConfig } from 'next';

// Статический экспорт: `npm run build` кладёт готовый сайт в out/.
// scripts/relative-paths.mjs потом делает пути относительными,
// поэтому out/index.html открывается двойным кликом, без сервера.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
