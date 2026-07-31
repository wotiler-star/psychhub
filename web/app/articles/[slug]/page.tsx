import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticle, getArticles } from '@/lib/api';
import { ogImageUrl } from '@/lib/og';
import ShareBar from '@/components/ShareBar';
import ArticleFeedback from '@/components/ArticleFeedback';
import BookmarkButton from '@/components/BookmarkButton';
import ArticleToc from '@/components/ArticleToc';
import ReadingProgress from '@/components/ReadingProgress';
import { SITE_URL, breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import Breadcrumb from '@/components/Breadcrumb';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = {
  POPSCI: '科普',
  RESEARCH: '研究',
  NEWS: '资讯',
};

// 轻量内容解析：把种子里的纯文本按段落 / 编号条目 / 列表项拆成结构化块，
// 让「1. 2. 3.」渲染为真正的有序列表，普通文本渲染为段落；
// 并支持 Markdown 二级/三级标题（## / ###）作为文章目录锚点。
type Block =
  | { type: 'p'; text: string }
  | { type: 'ol'; items: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'h'; level: 2 | 3; text: string; id: string };

function parseContent(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let cur: Block | null = null;
  let headingSeq = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      cur = null;
      continue;
    }
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      headingSeq += 1;
      blocks.push({
        type: 'h',
        level: heading[1].length === 2 ? 2 : 3,
        text: heading[2].trim(),
        id: `h${headingSeq}`,
      });
      cur = null;
      continue;
    }
    const num = line.match(/^\d+[.、)]\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (num) {
      if (!cur || cur.type !== 'ol') {
        cur = { type: 'ol', items: [] };
        blocks.push(cur);
      }
      cur.items.push(num[1]);
    } else if (bullet) {
      if (!cur || cur.type !== 'ul') {
        cur = { type: 'ul', items: [] };
        blocks.push(cur);
      }
      cur.items.push(bullet[1]);
    } else {
      if (!cur || cur.type !== 'p') {
        cur = { type: 'p', text: '' };
        blocks.push(cur);
      }
      cur.text = cur.text ? cur.text + ' ' + line : line;
    }
  }
  return blocks;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const a = await getArticle(slug);
    const ogImage = ogImageUrl({
      title: a.title,
      subtitle: a.excerpt || undefined,
      tag: CATEGORY_LABEL[a.category ?? ''] ?? '心理资讯',
    });
    return {
      title: `${a.title} | 心理资讯`,
      description: a.excerpt || a.title,
      alternates: { canonical: `/articles/${a.slug}` },
      openGraph: {
        type: 'article',
        title: a.title,
        description: a.excerpt || a.title,
        images: [{ url: ogImage, width: 1200, height: 630, alt: a.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: a.title,
        description: a.excerpt || a.title,
        images: [ogImage],
      },
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

  const blocks = parseContent(article.content);
  const headings = blocks
    .filter((b): b is Extract<Block, { type: 'h' }> => b.type === 'h')
    .map((b) => ({ id: b.id, text: b.text, level: b.level }));

  // 相关阅读：按标签重合度 + 同类目加权排序，取前 3 篇（排除当前）
  const all = await getArticles().catch(() => []);
  const related = all
    .filter((a) => a.slug !== article.slug)
    .map((a) => {
      const sharedTags = a.tags.filter((t) => article.tags.includes(t)).length;
      const sameCat = a.category === article.category ? 1 : 0;
      return { a, score: sharedTags * 2 + sameCat };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map((x) => x.a);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.title,
    image: `${SITE_URL}${ogImageUrl({
      title: article.title,
      subtitle: article.excerpt || undefined,
      tag: CATEGORY_LABEL[article.category ?? ''] ?? '心理资讯',
    })}`,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: article.author || '心理资源聚合' },
    publisher: {
      '@type': 'Organization',
      name: '心理资源聚合',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
    ...(article.sourceUrl ? { isBasedOn: article.sourceUrl } : {}),
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 760 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '心理资讯', url: '/articles' },
          { name: article.title, url: `/articles/${article.slug}` },
        ])}
      />

      <Breadcrumb
        items={[
          { name: '首页', href: '/' },
          { name: '心理资讯', href: '/articles' },
          { name: article.title, href: `/articles/${article.slug}` },
        ]}
      />

      <ReadingProgress />

      <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>
        {article.category ? (CATEGORY_LABEL[article.category] ?? article.category) : '资讯'}
      </div>
      <h1 style={{ fontSize: 30, lineHeight: 1.35, margin: '8px 0 12px' }}>{article.title}</h1>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          fontSize: 13,
          color: 'var(--muted)',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span>{article.publishedAt}</span>
        {article.author && <span>· 作者 {article.author}</span>}
        {article.sourceName && (
          <span>
            · 来源{' '}
            {article.sourceUrl ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--brand)' }}
              >
                {article.sourceName}
              </a>
            ) : (
              article.sourceName
            )}
          </span>
        )}
      </div>

      <div style={{ margin: '10px 0 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <ShareBar
          title={article.title}
          ogImage={ogImageUrl({
            title: article.title,
            subtitle: article.excerpt || undefined,
            tag: CATEGORY_LABEL[article.category ?? ''] ?? '心理资讯',
          })}
        />
        <BookmarkButton
          type="article"
          id={article.slug}
          title={article.title}
          url={`/articles/${article.slug}`}
          subtitle={article.excerpt ?? undefined}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 20px' }}>
        {article.tags.map((t) => (
          <Link
            key={t}
            href={`/articles?tag=${encodeURIComponent(t)}`}
            className="chip"
            style={{ fontSize: 12, background: 'var(--surface-2)', color: 'var(--muted)', textDecoration: 'none' }}
          >
            {t}
          </Link>
        ))}
      </div>

      {headings.length > 0 && <ArticleToc headings={headings} />}

      <div style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--ink)' }}>
        {blocks.map((b, i) => {
          if (b.type === 'h') {
            const Heading = (b.level === 2 ? 'h2' : 'h3') as 'h2' | 'h3';
            return (
              <Heading
                key={i}
                id={b.id}
                style={{ fontSize: b.level === 2 ? 22 : 18, margin: '26px 0 10px', scrollMarginTop: 80 }}
              >
                {b.text}
              </Heading>
            );
          }
          if (b.type === 'p') {
            return (
              <p key={i} style={{ margin: '0 0 16px' }}>
                {b.text}
              </p>
            );
          }
          if (b.type === 'ol') {
            return (
              <ol key={i} style={{ margin: '0 0 16px', paddingLeft: 22, lineHeight: 1.9 }}>
                {b.items.map((it, j) => (
                  <li key={j} style={{ marginBottom: 6 }}>
                    {it}
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={i} style={{ margin: '0 0 16px', paddingLeft: 22, lineHeight: 1.9 }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ marginBottom: 6 }}>
                  {it}
                </li>
              ))}
            </ul>
          );
        })}
      </div>

      <div
        className="callout"
        style={{ marginTop: 28, fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}
      >
        ⚠ 本文内容仅供心理健康科普与自我觉察参考，<strong>不构成医学诊断或治疗建议</strong>。如有持续困扰，请使用本站「求助资源」中的专业热线。
      </div>

      <ArticleFeedback slug={article.slug} />

      {related.length > 0 && (
        <div style={{ marginTop: 36, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 16px' }}>相关阅读</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {related.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.slug}`}
                className="card"
                style={{ color: 'var(--ink)', textDecoration: 'none', padding: 16 }}
              >
                <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                  {a.category ? (CATEGORY_LABEL[a.category] ?? a.category) : '资讯'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, margin: '6px 0 4px', lineHeight: 1.4 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.publishedAt}</div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
            按标签浏览更多：
            {article.tags.map((t) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                style={{ color: 'var(--brand)', marginLeft: 8, textDecoration: 'none' }}
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <Link href="/articles" className="chip" style={{ background: 'var(--brand)', color: 'var(--btn-text)' }}>
          ← 返回心理资讯
        </Link>
      </div>

      {related.length > 0 && (
        <JsonLdScript
          data={itemListJsonLd(
            related.map((a) => ({
              name: a.title,
              url: `/articles/${a.slug}`,
              description: a.excerpt ?? undefined,
            })),
          )}
        />
      )}
    </div>
  );
}
