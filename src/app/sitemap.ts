import type { MetadataRoute } from 'next';

import { PUBLIC_SITE_URL } from '@/lib/config/site';

/** A landing e a unica pagina publica e indexavel do aplicativo. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: PUBLIC_SITE_URL.toString(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
