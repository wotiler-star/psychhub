import type { Metadata } from 'next';
import { getArticles, getResources, getCounselors } from '@/lib/api';
import SearchResults from '@/components/SearchResults';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '全站搜索 | 心理资源聚合',
  description: '在心理资源、科普文章与咨询师中检索你需要的内容。',
  robots: { index: false, follow: true },
  alternates: { canonical: '/search' },
};

type SearchParams = { q?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q = '' } = await searchParams;
  const query = (q || '').trim();

  const [articles, resources, counselors] = await Promise.all([
    getArticles().catch(() => []),
    getResources().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  return (
    <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 920 }}>
      <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>全站搜索</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 20px', fontSize: 14 }}>
        跨「资源 · 文章 · 咨询师」检索；结果按相关度排序。
      </p>

      <form action="/search" method="get" style={{ marginBottom: 24 }}>
        <input
          name="q"
          defaultValue={query}
          placeholder="输入关键词，如：抑郁、焦虑、咨询师、睡眠…"
          aria-label="搜索关键词"
          autoFocus
          style={{
            width: '100%',
            minHeight: 46,
            padding: '0 16px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            fontSize: 16,
            background: 'var(--input-bg)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
      </form>

      <SearchResults
        query={query}
        articles={articles}
        resources={resources}
        counselors={counselors}
      />
    </div>
  );
}
