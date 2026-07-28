import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles } from '@/lib/api';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '心理资讯 | 科普 · 研究 · 求助资源',
  description:
    '聚合原创与引用的心理学科普、研究解读与求助资源，帮助你在信息洪流中快速获取可信内容。所有内容标注来源，附「仅供参考」声明。',
  alternates: { canonical: '/articles' },
};

const CATEGORY_LABEL: Record<string, string> = {
  POPSCI: '科普',
  RESEARCH: '研究',
  NEWS: '资讯',
};

const CATS = ['POPSCI', 'RESEARCH', 'NEWS'];

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;
  const all = await getArticles(category ? { category } : {}).catch(() => []);
  const articles = tag ? all.filter((a) => a.tags.includes(tag)) : all;

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '心理资讯', url: '/articles' },
        ])}
      />
      <JsonLdScript
        data={itemListJsonLd(
          articles.map((a) => ({
            name: a.title,
            url: `/articles/${a.slug}`,
            description: a.excerpt ?? undefined,
          })),
        )}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>心理资讯</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 20px', maxWidth: 680 }}>
        原创与引用的心理学科普、研究解读与求助资源汇总。所有内容均标注来源，并附「仅供参考」声明。
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link
          href="/articles"
          className="chip"
          style={{ background: category ? 'var(--surface-2)' : 'var(--brand)', color: category ? 'var(--muted)' : 'var(--btn-text)' }}
        >
          全部
        </Link>
        {CATS.map((c) => (
          <Link
            key={c}
            href={`/articles?category=${c}`}
            className="chip"
            style={{ background: category === c ? 'var(--brand)' : 'var(--surface-2)', color: category === c ? 'var(--btn-text)' : 'var(--muted)' }}
          >
            {CATEGORY_LABEL[c]}
          </Link>
        ))}
      </div>

      {tag && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 14 }}>
          <span style={{ color: 'var(--muted)' }}>标签筛选：</span>
          <Link
            href={category ? `/articles?category=${category}` : '/articles'}
            className="chip"
            style={{ background: 'var(--brand)', color: 'var(--btn-text)', textDecoration: 'none' }}
          >
            {tag} ✕
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {articles.map((a) => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>
              {a.category ? (CATEGORY_LABEL[a.category] ?? a.category) : '资讯'}
            </div>
            <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>{a.title}</h3>
            {a.excerpt && (
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px', lineHeight: 1.7 }}>{a.excerpt}</p>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)', alignItems: 'center' }}>
              <span>{a.publishedAt}</span>
              {a.tags.slice(0, 3).map((t) => (
                <span key={t} className="chip" style={{ fontSize: 12, background: 'var(--surface-2)' }}>
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          资讯加载中或暂不可用，请稍后重试。
        </div>
      )}
    </div>
  );
}
