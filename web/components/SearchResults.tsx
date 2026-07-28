'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import type { Article, Resource, Counselor } from '@/lib/types';

type Kind = 'article' | 'resource' | 'counselor';

interface Row {
  kind: Kind;
  id: string;
  title: string;
  url: string;
  excerpt: string;
  tags: string[];
  score: number;
  external?: boolean;
}

const KIND_LABEL: Record<Kind, string> = {
  article: '文章',
  resource: '资源',
  counselor: '咨询师',
};

function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  if (!ql) return text;
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const found = lower.indexOf(ql, i);
    if (found === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (found > i) parts.push(text.slice(i, found));
    parts.push(
      <mark
        key={key++}
        style={{ background: 'var(--mark-bg)', color: 'inherit', padding: '0 2px', borderRadius: 3 }}
      >
        {text.slice(found, found + q.length)}
      </mark>,
    );
    i = found + q.length;
  }
  return parts;
}

export default function SearchResults({
  query,
  articles,
  resources,
  counselors,
}: {
  query: string;
  articles: Article[];
  resources: Resource[];
  counselors: Counselor[];
}) {
  const q = query.trim();

  const rows = useMemo<Row[]>(() => {
    if (!q) return [];
    const ql = q.toLowerCase();
    const out: Row[] = [];

    for (const a of articles) {
      const title = a.title ?? '';
      const excerpt = a.excerpt ?? '';
      const tags = a.tags ?? [];
      const hay = `${title} ${excerpt} ${tags.join(' ')} ${(a.author ?? '')}`.toLowerCase();
      const score = (title.toLowerCase().includes(ql) ? 5 : 0) +
        (tags.some((t) => t.toLowerCase().includes(ql)) ? 3 : 0) +
        (hay.includes(ql) ? 1 : 0);
      if (score > 0)
        out.push({
          kind: 'article',
          id: a.slug,
          title,
          url: `/articles/${a.slug}`,
          excerpt,
          tags,
          score,
        });
    }

    for (const r of resources) {
      const title = r.name ?? '';
      const excerpt = r.description ?? '';
      const tags = r.tags ?? [];
      const hay = `${title} ${excerpt} ${tags.join(' ')} ${(r.country ?? '')}`.toLowerCase();
      const score = (title.toLowerCase().includes(ql) ? 5 : 0) +
        (tags.some((t) => t.toLowerCase().includes(ql)) ? 3 : 0) +
        (hay.includes(ql) ? 1 : 0);
      if (score > 0)
        out.push({
          kind: 'resource',
          id: r.id,
          title,
          url: r.url,
          excerpt,
          tags,
          score,
          external: true,
        });
    }

    for (const c of counselors) {
      const title = c.name ?? '';
      const sub = (c.specialties ?? []).join('、');
      const hay = `${title} ${sub} ${(c.title ?? '')} ${(c.region ?? '')}`.toLowerCase();
      const score = (title.toLowerCase().includes(ql) ? 5 : 0) +
        (sub.toLowerCase().includes(ql) ? 3 : 0) +
        (hay.includes(ql) ? 1 : 0);
      if (score > 0)
        out.push({
          kind: 'counselor',
          id: c.id,
          title: c.title ? `${title} · ${c.title}` : title,
          url: `/counselors/${c.id}`,
          excerpt: sub,
          tags: c.specialties ?? [],
          score,
        });
    }

    return out.sort((a, b) => b.score - a.score);
  }, [q, articles, resources, counselors]);

  if (!q) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
        输入关键词即可跨全站检索心理资源、科普文章与咨询师。
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
        没有找到与「<strong>{q}</strong>」相关的内容。试试更宽泛的关键词，如「抑郁」「焦虑」「睡眠」「咨询」。
      </div>
    );
  }

  const byKind = (['article', 'resource', 'counselor'] as const).map((k) => ({
    k,
    list: rows.filter((r) => r.kind === k),
  }));

  return (
    <div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 16px' }}>
        找到 <strong style={{ color: 'var(--ink)' }}>{rows.length}</strong> 条与「{q}」相关的结果
      </p>
      {byKind.map(({ k, list }) =>
        list.length ? (
          <section key={k} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>
              {KIND_LABEL[k]}（{list.length}）
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map((r) => (
                <Link
                  key={r.kind + r.id}
                  href={r.url}
                  target={r.external ? '_blank' : undefined}
                  rel={r.external ? 'noopener noreferrer' : undefined}
                  className="card"
                  style={{ color: 'var(--ink)', textDecoration: 'none', padding: '14px 16px' }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>
                    <Highlight text={r.title} q={q} />
                    {r.external && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>↗</span>}
                  </div>
                  {r.excerpt && (
                    <div
                      style={{
                        fontSize: 14,
                        color: 'var(--muted)',
                        marginTop: 6,
                        lineHeight: 1.7,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      <Highlight text={r.excerpt} q={q} />
                    </div>
                  )}
                  {r.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {r.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="chip"
                          style={{ background: 'var(--surface-2)', color: 'var(--muted)', fontSize: 12 }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
