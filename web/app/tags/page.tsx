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

const collator = new Intl.Collator('zh-Hans-CN');

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

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]));

  // 热门标签 Top 12（按内容数）
  const hot = entries.slice(0, 12);
  const rest = entries.slice(12);

  // 剩余标签按首字分组：拉丁字母 A-Z 在前，中文按拼音序（Intl.Collator 'zh'）
  const grouped = new Map<string, Array<[string, number]>>();
  for (const [t, n] of rest) {
    const ch = t[0] || '#';
    const key = /[a-zA-Z]/.test(ch) ? ch.toUpperCase() : ch;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push([t, n]);
  }
  const groupKeys = Array.from(grouped.keys()).sort((a, b) => {
    const aL = /[A-Z]/.test(a);
    const bL = /[A-Z]/.test(b);
    if (aL !== bL) return aL ? -1 : 1;
    return collator.compare(a, b);
  });

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
          entries.map(([t, n]) => ({ name: t, url: `/tags/${encodeURIComponent(t)}`, description: `${n} 条内容` })),
        )}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>标签导航</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        按标签聚合本站的心理学文章、资源与咨询师。点击任意标签查看相关内容。
      </p>

      {/* 热门标签 Top */}
      {hot.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip chip-rose" style={{ fontSize: 12 }}>热门</span> 热门标签 Top {hot.length}
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {hot.map(([t, n]) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="chip"
                style={{
                  textDecoration: 'none',
                  background: 'var(--surface-2)',
                  color: 'var(--ink)',
                  fontSize: 15,
                  padding: '8px 16px',
                }}
              >
                {t} <span style={{ color: 'var(--muted)' }}>· {n}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 首字分组（拉丁 A-Z / 中文拼音序） */}
      <section>
        {groupKeys.map((key) => (
          <div key={key} style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--brand)',
                borderBottom: '1px solid var(--line)',
                paddingBottom: 6,
                marginBottom: 12,
              }}
            >
              {key}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {grouped.get(key)!.map(([t, n]) => (
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
        ))}
        {groupKeys.length === 0 && hot.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
            暂未收录任何标签。
          </div>
        )}
      </section>
    </div>
  );
}
