import type { Metadata } from 'next';
import { getHelplines } from '@/lib/api';
import { HELPLINE_CATEGORY_META } from '@/lib/format';
import HelplineFilters from '@/components/HelplineFilters';
import BookmarkButton from '@/components/BookmarkButton';
import FilterPanel from '@/components/FilterPanel';
import Pager from '@/components/Pager';
import Breadcrumb from '@/components/Breadcrumb';
import EmptyState from '@/components/EmptyState';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import { paginate, withPagination } from '@/lib/paginate';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const helplines = await getHelplines({
    country: sp.country,
    language: sp.language,
    category: sp.category,
    q: sp.q,
  }).catch(() => []);
  return withPagination(
    {
      title: { absolute: t.meta.helplines.title },
      description: t.meta.helplines.desc,
      ...localeAlternates(locale, '/helplines'),
    },
    '/helplines',
    sp,
    page,
    helplines.length,
    12,
  );
}

interface SP {
  country?: string;
  language?: string;
  category?: string;
  q?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function HelplinesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  const helplines = await getHelplines({
    country: sp.country,
    language: sp.language,
    category: sp.category,
    q: sp.q,
  }).catch(() => []);

  const countries = Array.from(new Set(helplines.map((h) => h.country))).sort();
  const languages = Array.from(new Set(helplines.map((h) => h.language))).sort();

  const page = Number(sp.page) || 1;
  const { pageItems, totalPages } = paginate(helplines, page, 12);

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: t.nav.home, url: lp('/') },
          { name: t.sections.helplines, url: lp('/helplines') },
        ])}
      />
      <JsonLdScript
        data={itemListJsonLd(
          helplines.map((h) => ({
            name: h.name,
            url: lp('/helplines'),
            description: h.description ?? undefined,
          })),
        )}
      />

      <div className="crisis-bar" style={{ borderRadius: 12, marginBottom: 20 }}>
        <div className="container-page" style={{ padding: '10px 20px' }}>
          <strong>{t.pages.helplinesCrisis}</strong>
        </div>
      </div>

      <Breadcrumb items={[{ name: t.nav.home, url: lp('/') }, { name: t.sections.helplines, url: lp('/helplines') }]} />

      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>{t.sections.helplines}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        {t.helpline.subtitle}
      </p>

      <FilterPanel>
        <HelplineFilters countries={countries} languages={languages} />
      </FilterPanel>

      <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
        {t.pages.helplinesCount.replace('{n}', String(helplines.length))}
        {sp.category || sp.country || sp.language || sp.q ? t.pages.filteredNote : ''}
      </div>

      {helplines.length === 0 ? (
        <EmptyState title={t.pages.helplinesEmpty} hint={t.pages.helplinesEmptyHint} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {pageItems.map((h) => {
            const meta = h.category ? HELPLINE_CATEGORY_META[h.category] : null;
            return (
              <div key={h.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{h.name}</h3>
                  <BookmarkButton
                    type="helpline"
                    id={h.id}
                    title={h.name}
                    url={h.url ?? ''}
                    subtitle={h.description ?? undefined}
                  />
                </div>
                {meta && (
                  <span className={`chip ${meta.chip}`} style={{ display: 'inline-block', marginTop: 8 }}>
                    {meta.label}
                  </span>
                )}
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0', lineHeight: 1.7 }}>{h.description}</p>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>🌍 {h.country} · {h.language}</span>
                  {h.phone && (
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)' }}>
                      📞 <a href={`tel:${h.phone.replace(/\s/g, '')}`} style={{ color: 'var(--danger)' }}>{h.phone}</a>
                    </span>
                  )}
                  {h.url && (
                    <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>
                      {t.pages.visitSite}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pager basePath={lp('/helplines')} params={sp} page={page} totalPages={totalPages} />
    </div>
  );
}
