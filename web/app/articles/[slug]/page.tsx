import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticle } from '@/lib/api';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = {
  POPSCI: '科普',
  RESEARCH: '研究',
  NEWS: '资讯',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const a = await getArticle(slug);
    return {
      title: `${a.title} | 心理资讯`,
      description: a.excerpt || a.title,
      alternates: { canonical: `/articles/${a.slug}` },
    };
  } catch {
    return { title: '资讯详情 | 心理资源聚合' };
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let article;
  try {
    article = await getArticle(slug);
  } catch {
    return (
      <div className="container-page" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <h1>资讯不存在或暂不可用</h1>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/articles" style={{ color: 'var(--brand)' }}>
            返回心理资讯
          </Link>
        </p>
      </div>
    );
  }

  const paragraphs = article.content
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.title,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: article.author || '心理资源聚合' },
    publisher: {
      '@type': 'Organization',
      name: '心理资源聚合',
      url: 'https://psych-hub.example.com',
    },
    mainEntityOfPage: `https://psych-hub.example.com/articles/${article.slug}`,
    ...(article.sourceUrl
      ? { isBasedOn: article.sourceUrl }
      : {}),
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 760 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>
        {article.category ? (CATEGORY_LABEL[article.category] ?? article.category) : '资讯'}
      </div>
      <h1 style={{ fontSize: 30, lineHeight: 1.35, margin: '8px 0 12px' }}>{article.title}</h1>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted)', alignItems: 'center', marginBottom: 8 }}>
        <span>{article.publishedAt}</span>
        {article.author && <span>· 作者 {article.author}</span>}
        {article.sourceName && (
          <span>
            · 来源{' '}
            {article.sourceUrl ? (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>
                {article.sourceName}
              </a>
            ) : (
              article.sourceName
            )}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 20px' }}>
        {article.tags.map((t) => (
          <span key={t} className="chip" style={{ fontSize: 12, background: '#f1f5f9' }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--ink)' }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{ margin: '0 0 16px' }}>
            {p}
          </p>
        ))}
      </div>

      <div className="callout" style={{ marginTop: 28, fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
        ⚠ 本文内容仅供心理健康科普与自我觉察参考，<strong>不构成医学诊断或治疗建议</strong>。如有持续困扰，请使用本站「求助资源」中的专业热线。
      </div>

      <div style={{ marginTop: 28 }}>
        <Link href="/articles" className="chip" style={{ background: 'var(--brand)', color: '#fff' }}>
          ← 返回心理资讯
        </Link>
      </div>
    </div>
  );
}
