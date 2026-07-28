import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles, getResources, getCounselors } from '@/lib/api';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = {
  POPSCI: '科普',
  RESEARCH: '研究',
  NEWS: '资讯',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `标签：${decoded} | 心理资源聚合`,
    description: `与「${decoded}」相关的心理学文章、资源与咨询师聚合列表。`,
    alternates: { canonical: `/tags/${tag}` },
  };
}

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  const [articles, resources, counselors] = await Promise.all([
    getArticles().catch(() => []),
    getResources().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  const matchedArticles = articles.filter((a) => a.tags.includes(decoded));
  const matchedResources = resources.filter((r) => r.tags.includes(decoded));
  const matchedCounselors = counselors.filter((c) => c.tags.includes(decoded));

  const items = [
    ...matchedArticles.map((a) => ({ name: a.title, url: `/articles/${a.slug}`, description: a.excerpt ?? undefined })),
    ...matchedResources.map((r) => ({ name: r.name, url: r.url, description: r.description ?? undefined })),
    ...matchedCounselors.map((c) => ({
      name: c.name,
      url: `/counselors/${c.id}`,
      description: [c.title, ...c.specialties].filter(Boolean).join(' · '),
    })),
  ];

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '标签导航', url: '/tags' },
          { name: decoded, url: `/tags/${tag}` },
        ])}
      />
      <JsonLdScript data={itemListJsonLd(items)} />

      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>
        标签：{decoded}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
        共 {items.length} 条相关内容
        {' · '}
        <Link href="/tags" style={{ color: 'var(--brand)' }}>
          返回全部标签
        </Link>
      </p>

      {matchedArticles.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>文章（{matchedArticles.length}）</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {matchedArticles.map((a) => (
              <Link key={a.id} href={`/articles/${a.slug}`} className="card" style={{ color: 'var(--ink)', textDecoration: 'none', padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                  {a.category ? (CATEGORY_LABEL[a.category] ?? a.category) : '资讯'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, margin: '6px 0 4px', lineHeight: 1.4 }}>{a.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedResources.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>资源（{matchedResources.length}）</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {matchedResources.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="chip" style={{ textDecoration: 'none', background: 'var(--surface-2)', color: 'var(--ink)' }}>
                {r.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {matchedCounselors.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>咨询师（{matchedCounselors.length}）</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {matchedCounselors.map((c) => (
              <Link key={c.id} href={`/counselors/${c.id}`} className="card" style={{ color: 'var(--ink)', textDecoration: 'none', padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{c.specialties.slice(0, 3).join('、')}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>暂无与「{decoded}」相关的内容。</p>
      )}
    </div>
  );
}
