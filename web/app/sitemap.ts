import type { MetadataRoute } from 'next';
import { getArticles, getCounselors } from '@/lib/api';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = ['', '/resources', '/assessments', '/helplines', '/articles', '/counselors', '/community', '/about', '/privacy'];
  const base: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: now,
    changeFrequency: r === '' ? 'daily' : 'weekly',
    priority: r === '' ? 1 : 0.7,
  }));

  try {
    const articles = await getArticles();
    const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${SITE_URL}/articles/${a.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
    const counselors = await getCounselors();
    const counselorRoutes: MetadataRoute.Sitemap = counselors.map((c) => ({
      url: `${SITE_URL}/counselors/${c.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
    return [...base, ...articleRoutes, ...counselorRoutes];
  } catch {
    return base;
  }
}
