import type { MetadataRoute } from 'next';
import { getArticles, getCounselors, getAssessments, getResources } from '@/lib/api';
import { RESOURCE_TYPES } from '@/lib/format';
import { locales, SITE_URL } from '@/i18n/config';

export const dynamic = 'force-dynamic';

function loc(locale: string, path: string): string {
  const p = path === '/' ? '' : path;
  return `${SITE_URL}/${locale}${p}`;
}

function langKey(l: string): string {
  return l === 'zh' ? 'zh-CN' : l;
}

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
    '/compare',
    '/search',
  ];
  const subBoards: string[] = RESOURCE_TYPES.map((t) => `/resources/${t.toLowerCase()}`);
  const basePaths = [...staticRoutes, ...subBoards];

  const detailPaths: string[] = [];
  try {
    const [articles, counselors, assessments, resources] = await Promise.all([
      getArticles().catch(() => [] as Awaited<ReturnType<typeof getArticles>>),
      getCounselors().catch(() => [] as Awaited<ReturnType<typeof getCounselors>>),
      getAssessments().catch(() => [] as Awaited<ReturnType<typeof getAssessments>>),
      getResources().catch(() => [] as Awaited<ReturnType<typeof getResources>>),
    ]);
    const tagSet = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
    resources.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    counselors.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    detailPaths.push(
      ...articles.map((a) => `/articles/${a.slug}`),
      ...counselors.map((c) => `/counselors/${c.id}`),
      ...assessments.map((a) => `/assessments/${a.slug}`),
      ...resources.map((r) => `/resources/${r.id}`),
      ...Array.from(tagSet).map((t) => `/tags/${encodeURIComponent(t)}`),
    );
  } catch {
    /* 数据不可用时仅收录静态与板块页 */
  }

  const allPaths = [...basePaths, ...detailPaths];
  const out: MetadataRoute.Sitemap = [];

  for (const p of allPaths) {
    for (const l of locales) {
      const languages: Record<string, string> = {};
      for (const l2 of locales) languages[langKey(l2)] = loc(l2, p);
      languages['x-default'] = loc('zh', p);
      out.push({
        url: loc(l, p),
        lastModified: now,
        changeFrequency: p === '' ? 'daily' : 'weekly',
        priority: p === '' ? 1 : 0.7,
        alternates: { languages },
      });
    }
  }

  return out;
}
