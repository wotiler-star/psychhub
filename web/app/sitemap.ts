import type { MetadataRoute } from 'next';
import { getArticles, getCounselors, getAssessments, getResources } from '@/lib/api';
import { RESOURCE_TYPES } from '@/lib/format';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = [
    '',
    '/resources',
    '/assessments',
    '/helplines',
    '/articles',
    '/counselors',
    '/community',
    '/tags',
    '/about',
    '/submit',
    '/privacy',
  ];
  const base: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: now,
    changeFrequency: r === '' ? 'daily' : 'weekly',
    priority: r === '' ? 1 : 0.7,
  }));

  // 资源导航 7 个子版块落地页（独立可收录 URL）
  const subBoardRoutes: MetadataRoute.Sitemap = RESOURCE_TYPES.map((t) => ({
    url: `${SITE_URL}/resources/${t.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  try {
    const [articles, counselors, assessments, resources] = await Promise.all([
      getArticles().catch(() => []),
      getCounselors().catch(() => []),
      getAssessments().catch(() => []),
      getResources().catch(() => []),
    ]);
    const tagSet = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
    resources.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    counselors.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    const tagRoutes: MetadataRoute.Sitemap = Array.from(tagSet).map((t) => ({
      url: `${SITE_URL}/tags/${encodeURIComponent(t)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
    const detailRoutes: MetadataRoute.Sitemap = [
      ...articles.map((a) => ({
        url: `${SITE_URL}/articles/${a.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      ...counselors.map((c) => ({
        url: `${SITE_URL}/counselors/${c.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      ...assessments.map((a) => ({
        url: `${SITE_URL}/assessments/${a.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
      ...tagRoutes,
    ];
    return [...base, ...subBoardRoutes, ...detailRoutes];
  } catch {
    return base;
  }
}
