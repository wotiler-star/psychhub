import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles, getResources, getCounselors } from '@/lib/api';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: `${t.pages.tagHeading.replace('{decoded}', decoded)} | ${t.sections.tags}` },
    description: t.pages.tagCount.replace('{n}', '0'),
    ...localeAlternates(locale, `/tags/${tag}`),
  };
}

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);

  const [articles, resources, counselors] = await Promise.all([
    getArticles().catch(() => []),
    getResources().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  const matchedArticles = articles.filter((a) => a.tags.includes(decoded));
  const matchedResources = resources.filter((r) => r.tags.includes(decoded));
  const matchedCounselors = counselors.filter((c) => c.tags.includes(decoded));

  const items = [
    ...matchedArticles.map((a) => ({ name: a.title, url: lp(`/articles/${a.slug}`), description: a.excerpt ?? undefined })),
    ...matchedResources.map((r) => ({ name: r.name, url: r.url, description: r.description ?? undefined })),
    ...matchedCounselors.map((c) => ({
      name: c.name,
      url: lp(`/counselors/${c.id}`),
      description: [c.title, ...c.specialties].filter(Boolean).join(' · '),
    })),
  ];

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: t.nav.home, url: lp('/') },
          { name: t.sections.tags, url: lp('/tags') },
          { name: decoded, url: lp(`/tags/${tag}`) },
        ])}
      />
      <JsonLdScript data={itemListJsonLd(items)} />

      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>
        {t.pages.tagHeading.replace('{decoded}', decoded)}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
        {t.pages.tagCount.replace('{n}', String(items.length))}
        {' · '}
        <Link href={lp('/tags')} style={{ color: 'var(--brand)' }}>
          {t.pages.tagBackAll}
        </Link>
      </p>

      {matchedArticles.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>{t.pages.tagArticles.replace('{n}', String(matchedArticles.length))}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {matchedArticles.map((a) => (
              <Link key={a.id} href={lp(`/articles/${a.slug}`)} className="card" style={{ color: 'var(--ink)', textDecoration: 'none', padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                  {a.category ? (a.category === 'POPSCI' ? t.pages.catPop : a.category === 'RESEARCH' ? t.pages.catResearch : a.category === 'NEWS' ? t.pages.catNews : a.category) : t.sections.articles}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, margin: '6px 0 4px', lineHeight: 1.4 }}>{a.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedResources.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>{t.pages.tagResources.replace('{n}', String(matchedResources.length))}</h2>
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
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>{t.pages.tagCounselors.replace('{n}', String(matchedCounselors.length))}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {matchedCounselors.map((c) => (
              <Link key={c.id} href={lp(`/counselors/${c.id}`)} className="card" style={{ color: 'var(--ink)', textDecoration: 'none', padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{c.specialties.slice(0, 3).join('、')}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>{t.pages.tagEmpty.replace('{decoded}', decoded)}</p>
      )}
    </div>
  );
}
