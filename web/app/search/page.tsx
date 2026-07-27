import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getResources, getCounselors, getArticles } from '@/lib/api';
import { RESOURCE_TYPE_META } from '@/lib/format';
import type { Resource, Counselor, Article } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '全站搜索 | 心理资源聚合',
  description:
    '一站式检索全球心理学网站、心理咨询师与心理资讯。输入关键词即可跨资源、咨询师与文章聚合结果。',
  alternates: { canonical: '/search' },
};

const ARTICLE_CATEGORY_LABEL: Record<string, string> = {
  POPSCI: '科普',
  RESEARCH: '研究',
  NEWS: '资讯',
};

interface SP {
  q?: string;
  type?: string;
}

type Kind = 'resource' | 'counselor' | 'article';

interface ResultItem {
  kind: Kind;
  id: string;
  title: string;
  href: string;
  external: boolean;
  description: string | null;
  meta: string[];
  chipLabel: string;
  chipClass: string;
  score: number;
}

function matches(haystack: string | null | undefined, q: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(q.toLowerCase());
}

// 相关度评分：标题命中权重最高，其次描述 / 标签
function scoreOf(title: string, description: string | null, tags: string[], q: string): number {
  if (!q) return 0;
  let s = 0;
  const t = title.toLowerCase();
  const ql = q.toLowerCase();
  if (t.includes(ql)) s += 10;
  if (t.startsWith(ql)) s += 5;
  if (matches(description, q)) s += 3;
  if (tags.some((tag) => matches(tag, q))) s += 2;
  return s;
}

// 高亮命中的关键词（数据均来自可信数据源，渲染受控）
function highlight(text: string | null, q: string): ReactNode {
  if (!text) return null;
  if (!q) return text;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i <= text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      if (i < text.length) out.push(text.slice(i));
      break;
    }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <mark
        key={key++}
        style={{ background: 'var(--mark-bg)', color: 'inherit', padding: '0 2px', borderRadius: 3 }}
      >
        {text.slice(idx, idx + ql.length)}
      </mark>,
    );
    i = idx + ql.length;
  }
  return <>{out}</>;
}

function MetaLine({ items }: { items: string[] }) {
  const parts = items.filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 ? <span style={{ opacity: 0.5, margin: '0 6px' }}>·</span> : null}
        </span>
      ))}
    </div>
  );
}

function ResultCard({ item, q }: { item: ResultItem; q: string }) {
  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
          {highlight(item.title, q)}
        </h3>
        <span className={`chip ${item.chipClass}`} style={{ flexShrink: 0 }}>
          {item.chipLabel}
        </span>
      </div>
      {item.description && (
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0', lineHeight: 1.7 }}>
          {highlight(item.description, q)}
        </p>
      )}
      <MetaLine items={item.meta} />
    </>
  );

  const style: React.CSSProperties = {
    display: 'block',
    color: 'var(--ink)',
    textDecoration: 'none',
  };

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="card" style={style}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} className="card" style={style}>
      {inner}
    </Link>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const type = (sp.type ?? 'all').trim();

  // 资源：后端原生支持 q 过滤；咨询师 / 文章：拉全量在服务端按关键词过滤
  const [rawResources, rawCounselors, rawArticles] = await Promise.all([
    getResources(q ? { q } : {}).catch(() => [] as Resource[]),
    getCounselors().catch(() => [] as Counselor[]),
    getArticles().catch(() => [] as Article[]),
  ]);

  const resources = q
    ? rawResources.filter(
        (r) =>
          matches(r.name, q) ||
          matches(r.description, q) ||
          (r.tags ?? []).some((t) => matches(t, q)) ||
          matches(r.country, q),
      )
    : rawResources;

  const counselors = q
    ? rawCounselors.filter(
        (c) =>
          matches(c.name, q) ||
          matches(c.title, q) ||
          matches(c.bio, q) ||
          c.specialties.some((s) => matches(s, q)) ||
          c.region === q,
      )
    : rawCounselors;

  const articles = q
    ? rawArticles.filter(
        (a) =>
          matches(a.title, q) ||
          matches(a.excerpt, q) ||
          (a.tags ?? []).some((t) => matches(t, q)) ||
          matches(a.sourceName, q) ||
          matches(a.author, q),
      )
    : rawArticles;

  // 统一为 ResultItem
  const resourceItems: ResultItem[] = resources.map((r) => {
    const meta = RESOURCE_TYPE_META[r.type] ?? { label: r.type, chip: '' };
    return {
      kind: 'resource',
      id: r.id,
      title: r.name,
      href: r.url,
      external: true,
      description: r.description,
      meta: [meta.label, r.country ?? '', r.trafficLevel ? `📈 ${r.trafficLevel}` : ''].filter(Boolean),
      chipLabel: meta.label,
      chipClass: meta.chip,
      score: scoreOf(r.name, r.description, r.tags ?? [], q),
    };
  });

  const counselorItems: ResultItem[] = counselors.map((c) => ({
    kind: 'counselor',
    id: c.id,
    title: c.name,
    href: `/counselors/${c.id}`,
    external: false,
    description: c.bio,
    meta: [
      c.specialties.slice(0, 2).join(' · '),
      c.region ?? '',
      c.remote ? '支持远程' : '',
      c.pricePerSession != null ? `¥${c.pricePerSession}/次` : '',
      c.rating != null ? `★ ${c.rating}` : '',
    ].filter(Boolean),
    chipLabel: '咨询师',
    chipClass: 'chip-green',
    score: scoreOf(c.name, c.bio, c.specialties, q),
  }));

  const articleItems: ResultItem[] = articles.map((a) => ({
    kind: 'article',
    id: a.id,
    title: a.title,
    href: `/articles/${a.slug}`,
    external: false,
    description: a.excerpt,
    meta: [
      ARTICLE_CATEGORY_LABEL[a.category ?? ''] ?? a.category ?? '',
      a.sourceName ?? '',
      a.publishedAt ?? '',
    ].filter(Boolean),
    chipLabel: '资讯',
    chipClass: '',
    score: scoreOf(a.title, a.excerpt, a.tags ?? [], q),
  }));

  const allItems = [...resourceItems, ...counselorItems, ...articleItems];
  if (q) allItems.sort((a, b) => b.score - a.score);

  const counts = {
    all: allItems.length,
    resource: resourceItems.length,
    counselor: counselorItems.length,
    article: articleItems.length,
  };

  const visible =
    type === 'resource'
      ? resourceItems
      : type === 'counselor'
        ? counselorItems
        : type === 'article'
          ? articleItems
          : allItems;

  const tab = (key: string, label: string, count: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (key !== 'all') params.set('type', key);
    const qs = params.toString();
    const href = `/search${qs ? `?${qs}` : ''}`;
    const active = (type === 'all' && key === 'all') || type === key;
    return (
      <Link
        key={key}
        href={href}
        className={active ? 'chip chip-green' : 'chip'}
        style={{
          textDecoration: 'none',
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: active ? 700 : 500,
        }}
      >
        {label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
      </Link>
    );
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>全站搜索</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 20px', maxWidth: 680 }}>
        跨「资源 · 咨询师 · 资讯」的统一检索。输入关键词，一次找到你要的心理资源。
      </p>

      {/* 搜索框（GET 跳转 /search?q=，SSR 友好且可分享） */}
      <form
        action="/search"
        method="get"
        style={{ display: 'flex', gap: 8, maxWidth: 620, marginBottom: 18 }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索心理资源、咨询师、文章关键词…"
          aria-label="全站搜索"
          autoFocus
          style={{
            flex: 1,
            minHeight: 48,
            padding: '0 16px',
            borderRadius: 12,
            border: '1px solid var(--line)',
            fontSize: 16,
            background: 'var(--card)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button type="submit" className="btn-primary" style={{ minHeight: 48, fontSize: 16 }}>
          搜索
        </button>
      </form>

      {/* 类型切换标签（保留 q） */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {tab('all', '全部', counts.all)}
        {tab('resource', '资源', counts.resource)}
        {tab('counselor', '咨询师', counts.counselor)}
        {tab('article', '资讯', counts.article)}
      </div>

      {/* 结果摘要 */}
      <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
        {q ? (
          <>
            关键词「<strong style={{ color: 'var(--ink)' }}>{q}</strong>」共 {visible.length} 条结果
            {type !== 'all' ? `（${labelByType(type)}）` : ''}
          </>
        ) : (
          <>共 {visible.length} 条内容（输入关键词开始检索）</>
        )}
      </div>

      {/* 结果列表 */}
      {visible.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px' }}>
          {q ? (
            <>
              没有找到与「{q}」相关的内容。
              <br />
              试试更宽泛的关键词，或
              <Link href="/resources" style={{ color: 'var(--brand)' }}>
                浏览全部资源
              </Link>
              。
            </>
          ) : (
            '暂无可检索内容。'
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {visible.map((item) => (
            <ResultCard key={`${item.kind}-${item.id}`} item={item} q={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function labelByType(type: string): string {
  if (type === 'resource') return '资源';
  if (type === 'counselor') return '咨询师';
  if (type === 'article') return '资讯';
  return '';
}
