import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles } from '@/lib/api';
import Pager from '@/components/Pager';
import ViewToggle from '@/components/ViewToggle';
import BookmarkButton from '@/components/BookmarkButton';
import SearchBox from '@/components/SearchBox';
import EmptyState from '@/components/EmptyState';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import { paginate, withPagination } from '@/lib/paginate';

export const dynamic = 'force-dynamic';

interface SP {
  category?: string;
  tag?: string;
  sort?: string;
  view?: string;
  q?: string;
  page?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const { category, tag, sort, view, q, page: pageStr } = await searchParams;
  const page = Number(pageStr) || 1;
  const all = await getArticles({ category, q }).catch(() => []);
  let list = tag ? all.filter((a) => a.tags.includes(tag)) : all;
  return withPagination(
    {
      title: '心理资讯 | 科普 · 研究 · 求助资源',
      description:
        '聚合原创与引用的心理学科普、研究解读与求助资源，帮助你在信息洪流中快速获取可信内容。所有内容标注来源，附「仅供参考」声明。',
      alternates: { canonical: '/articles' },
    },
    '/articles',
    { category, tag, sort, view, q },
    page,
    list.length,
    9,
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  POPSCI: '科普',
  RESEARCH: '研究',
  NEWS: '资讯',
};

const CATS = ['POPSCI', 'RESEARCH', 'NEWS'];

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { category, tag, sort, view, q, page: pageStr } = await searchParams;
  const all = await getArticles({ category, q }).catch(() => []);

  const categoryCounts: Record<string, number> = {};
  for (const a of all) {
    if (a.category) categoryCounts[a.category] = (categoryCounts[a.category] ?? 0) + 1;
  }

  let articles = tag ? all.filter((a) => a.tags.includes(tag)) : all;

  articles = [...articles].sort((a, b) =>
    sort === 'oldest'
      ? a.publishedAt.localeCompare(b.publishedAt)
      : b.publishedAt.localeCompare(a.publishedAt),
  );

  const page = Number(pageStr) || 1;
  const { pageItems, totalPages } = paginate(articles, page, 9);

  const href = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (q) params.set('q', q);
    if (view) params.set('view', view);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete('page');
    const qs = params.toString();
    return `/articles${qs ? '?' + qs : ''}`;
  };

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

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <Link
          href={href({ category: undefined })}
          className="chip"
          style={{
            background: !category ? 'var(--brand)' : 'var(--surface-2)',
            color: !category ? 'var(--btn-text)' : 'var(--muted)',
            textDecoration: 'none',
          }}
        >
          全部
        </Link>
        {CATS.map((c) => (
          <Link
            key={c}
            href={href({ category: category === c ? undefined : c })}
            className="chip"
            style={{
              background: category === c ? 'var(--brand)' : 'var(--surface-2)',
              color: category === c ? 'var(--btn-text)' : 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            {CATEGORY_LABEL[c]}
            {categoryCounts[c] != null && <span style={{ opacity: 0.7, marginLeft: 4, fontSize: 12 }}>({categoryCounts[c]})</span>}
          </Link>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBox paramName="q" placeholder="搜索资讯…" width={170} />
          {(['newest', 'oldest'] as const).map((v) => {
            const active = (sort === 'oldest') === (v === 'oldest');
            return (
              <Link
                key={v}
                href={href({ sort: v === 'oldest' ? 'oldest' : undefined })}
                className="chip"
                style={{
                  background: active ? 'var(--brand)' : 'var(--surface-2)',
                  color: active ? 'var(--btn-text)' : 'var(--muted)',
                  textDecoration: 'none',
                }}
              >
                {v === 'newest' ? '最新发布' : '最早发布'}
              </Link>
            );
          })}
          <ViewToggle />
        </div>
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

      {articles.length === 0 ? (
        <EmptyState title="没有符合条件的资讯" hint="试试清除筛选条件，或更换关键词。" />
      ) : view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pageItems.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}
            >
              <Link href={`/articles/${a.slug}`} style={{ flex: 1, minWidth: 220, color: 'var(--ink)', textDecoration: 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                  {a.category ? (CATEGORY_LABEL[a.category] ?? a.category) : '资讯'}
                </div>
                <h3 style={{ margin: '4px 0 6px', fontSize: 17 }}>{a.title}</h3>
                {a.excerpt && (
                  <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 8px', lineHeight: 1.7 }}>{a.excerpt}</p>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.publishedAt}</div>
              </Link>
              <BookmarkButton
                type="article"
                id={a.slug}
                title={a.title}
                url={`/articles/${a.slug}`}
                subtitle={a.excerpt ?? undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {pageItems.map((a) => (
            <div key={a.id} className="card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                <BookmarkButton
                  type="article"
                  id={a.slug}
                  title={a.title}
                  url={`/articles/${a.slug}`}
                  subtitle={a.excerpt ?? undefined}
                />
              </div>
              <Link href={`/articles/${a.slug}`} style={{ display: 'block', color: 'var(--ink)', textDecoration: 'none', paddingRight: 36 }}>
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
            </div>
          ))}
        </div>
      )}

      <Pager basePath="/articles" params={{ category, tag, sort, view, q }} page={page} totalPages={totalPages} />
    </div>
  );
}
