import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles, getResources, getCounselors } from '@/lib/api';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.tags.title },
    description: t.meta.tags.desc,
    ...localeAlternates(locale, '/tags'),
  };
}

const collator = new Intl.Collator('zh-Hans-CN');

export default async function TagsIndexPage() {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  const [articles, resources, counselors] = await Promise.all([
    getArticles().catch(() => []),
    getResources().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  const counts = new Map<string, number>();
  const bump = (tags: string[]) => tags.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  articles.forEach((a) => bump(a.tags));
  resources.forEach((r) => bump(r.tags));
  counselors.forEach((c) => bump(c.tags));

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]));

  // 热门标签 Top 12（按内容数）
  const hot = entries.slice(0, 12);
  const rest = entries.slice(12);

  // 剩余标签按首字分组：拉丁字母 A-Z 在前，中文按拼音序（Intl.Collator 'zh'）
  const grouped = new Map<string, Array<[string, number]>>();
  for (const [x, n] of rest) {
    const ch = x[0] || '#';
    const key = /[a-zA-Z]/.test(ch) ? ch.toUpperCase() : ch;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push([x, n]);
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
          { name: t.nav.home, url: lp('/') },
          { name: t.sections.tags, url: lp('/tags') },
        ])}
      />
      <JsonLdScript
        data={itemListJsonLd(
          entries.map(([x, n]) => ({ name: x, url: lp(`/tags/${encodeURIComponent(x)}`), description: `${n}` })),
        )}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>{t.sections.tags}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        {t.pages.tagsSubtitle}
      </p>

      {/* 热门标签 Top */}
      {hot.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip chip-rose" style={{ fontSize: 12 }}>{t.pages.tagsHotChip}</span> {t.pages.tagsHotTitle.replace('{n}', String(hot.length))}
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {hot.map(([x, n]) => (
              <Link
                key={x}
                href={lp(`/tags/${encodeURIComponent(x)}`)}
                className="chip"
                style={{
                  textDecoration: 'none',
                  background: 'var(--surface-2)',
                  color: 'var(--ink)',
                  fontSize: 15,
                  padding: '8px 16px',
                }}
              >
                {x} <span style={{ color: 'var(--muted)' }}>· {n}</span>
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
              {grouped.get(key)!.map(([x, n]) => (
                <Link
                  key={x}
                  href={lp(`/tags/${encodeURIComponent(x)}`)}
                  className="chip"
                  style={{ textDecoration: 'none', background: 'var(--surface-2)', color: 'var(--ink)' }}
                >
                  {x} <span style={{ color: 'var(--muted)' }}>· {n}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {groupKeys.length === 0 && hot.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
            {t.pages.tagsNoTags}
          </div>
        )}
      </section>
    </div>
  );
}
