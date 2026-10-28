import type { MetadataRoute } from 'next';

import { SITE } from '@/content/profile';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: new URL('sitemap.xml', SITE.url).toString(),
    host: SITE.url,
  };
}
