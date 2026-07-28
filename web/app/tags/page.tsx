import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles, getResources, getCounselors } from '@/lib/api';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '标签导航 | 心理资源聚合',
  description: '按标签浏览本站聚合的心理学文章、资源与咨询师，快速找到你关心的话题。',
  alternates: { canonical: '/tags' },
};

export default async function TagsIndexPage() {
  const [articles, resources, counselors] = await Promise.all([
    getArticles().catch(() => []),
    getResources().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  const counts = new Map<string, number>();
  const bump = (tags: string[]) => tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  articles.forEach((a) => bump(a.tags));
  resources.forEach((r) => bump(r.tags));
  counselors.forEach((c) => bump(c.tags));

  const tags = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '标签导航', url: '/tags' },
        ])}
      />
      <JsonLdScript
        data={itemListJsonLd(
          tags.map(([t, n]) => ({ name: t, url: `/tags/${encodeURIComponent(t)}`, description: `${n} 条内容` })),
        )}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>标签导航</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        按标签聚合本站的心理学文章、资源与咨询师。点击任意标签查看相关内容。
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tags.map(([t, n]) => (
          <Link
            key={t}
            href={`/tags/${encodeURIComponent(t)}`}
            className="chip"
            style={{ textDecoration: 'none', background: 'var(--surface-2)', color: 'var(--ink)' }}
          >
            {t} <span style={{ color: 'var(--muted)' }}>· {n}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
