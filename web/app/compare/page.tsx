import type { Metadata } from 'next';
import Link from 'next/link';
import { getResources } from '@/lib/api';
import type { Resource } from '@/lib/types';
import { RESOURCE_TYPE_META } from '@/lib/format';
import { breadcrumbJsonLd, JsonLdScript } from '@/lib/jsonld';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.compare.title },
    description: t.meta.compare.desc,
    robots: { index: false, follow: true },
    ...localeAlternates(locale, '/compare'),
  };
}

interface SP {
  ids?: string;
  [key: string]: string | undefined;
}

const ROWS: { key: string; render: (r: Resource) => string }[] = [
  { key: 'type', render: (r) => RESOURCE_TYPE_META[r.type]?.label ?? r.type },
  { key: 'country', render: (r) => r.country ?? '—' },
  { key: 'language', render: (r) => r.language ?? '—' },
  { key: 'suitableFor', render: (r) => r.suitableFor ?? '—' },
  { key: 'trafficLevel', render: (r) => r.trafficLevel ?? '—' },
  { key: 'tags', render: (r) => (r.tags.length ? r.tags.join('、') : '—') },
  { key: 'featured', render: (r) => (r.featured ? '✓' : '—') },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  const ids = (sp.ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const all = await getResources().catch(() => [] as Resource[]);
  const items = ids
    .map((id) => all.find((r) => r.id === id))
    .filter((r): r is Resource => !!r);

  const ROW_LABELS: Record<string, string> = {
    type: t.pages.dimDimension,
    country: t.pages.dimCountry,
    language: t.pages.dimLang,
    suitableFor: t.pages.dimSuitable,
    trafficLevel: t.pages.dimTraffic,
    tags: t.pages.dimTags,
    featured: t.pages.dimFeatured,
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: t.nav.home, url: lp('/') },
          { name: t.sections.resources, url: lp('/resources') },
          { name: t.sections.compare, url: lp('/compare') },
        ])}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>{t.sections.compare}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 24px', lineHeight: 1.7 }}>
        {t.pages.compareSubtitle}
      </p>

      {items.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: 16, margin: '0 0 8px' }}>
            {items.length === 0 ? t.pages.compareEmpty0 : t.pages.compareEmptyFew}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>
            {t.pages.compareEmptyHint}
          </p>
          <Link href={lp('/resources')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 22px', textDecoration: 'none' }}>
            {t.pages.compareGoto}
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: 640,
              borderCollapse: 'separate',
              borderSpacing: 0,
              border: '1px solid var(--line)',
              borderRadius: 14,
              overflow: 'hidden',
              background: 'var(--card)',
            }}
          >
            <thead>
              <tr>
                <th style={{ ...cellTh, width: 110, textAlign: 'left' }}>{t.pages.dimDimension}</th>
                {items.map((r) => (
                  <th key={r.id} style={cellTh}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{r.name}</div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 500 }}
                    >
                      {t.pages.compareVisit}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellTd, fontWeight: 700 }}>{t.pages.dimIntro}</td>
                {items.map((r) => (
                  <td key={r.id} style={{ ...cellTd, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {r.description ?? '—'}
                  </td>
                ))}
              </tr>
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <td style={{ ...cellTd, fontWeight: 700 }}>{ROW_LABELS[row.key]}</td>
                  {items.map((r) => (
                    <td key={r.id} style={cellTd}>
                      {row.render(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 20, lineHeight: 1.7 }}>
        {t.pages.compareWarning}
      </p>
    </div>
  );
}

const cellTh: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--line)',
  background: 'var(--surface-2)',
  textAlign: 'left',
  verticalAlign: 'top',
};

const cellTd: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--line)',
  fontSize: 14,
  verticalAlign: 'top',
};
