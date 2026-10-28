import './globals.css';

import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { KNOWS_ABOUT, SITE } from '@/content/profile';

// Шрифты лежат в ./fonts (латиница + кириллица, woff2). Заголовки — Ubuntu, текст — Roboto,
// игровой интерфейс (вкладки, часы, XP, подписи капсом, даты, цифры) — Tektur.
const display = localFont({
  src: [
    { path: './fonts/Ubuntu-Medium.woff2', weight: '500' },
    { path: './fonts/Ubuntu-Bold.woff2', weight: '700' },
  ],
  variable: '--font-display',
  display: 'swap',
});
const body = localFont({
  src: './fonts/Roboto.woff2',
  weight: '300 800',
  variable: '--font-body',
  display: 'swap',
});
const accent = localFont({
  src: './fonts/Tektur.woff2',
  weight: '400 800',
  variable: '--font-accent',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  keywords: [
    'Senior Frontend-разработчик',
    'Frontend',
    'Next.js',
    'React',
    'TypeScript',
    SITE.name,
    SITE.city,
    ...KNOWS_ABOUT,
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  alternates: { canonical: SITE.url },
  openGraph: {
    type: 'profile',
    locale: 'ru_RU',
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    firstName: 'Станислав',
    lastName: 'Постников',
    images: [
      { url: new URL('og.png', SITE.url).toString(), width: 1200, height: 630, alt: SITE.title },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
    images: [new URL('og.png', SITE.url).toString()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05040B',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      data-tod="0"
      className={`${display.variable} ${body.variable} ${accent.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
