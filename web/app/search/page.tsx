import type { Metadata } from 'next';
import { getArticles, getResources, getCounselors } from '@/lib/api';
import SearchResults from '@/components/SearchResults';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.search.title },
    description: t.meta.search.desc,
    robots: { index: false, follow: true },
    ...localeAlternates(locale, '/search'),
  };
}

type SearchParams = { q?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q = '' } = await searchParams;
  const query = (q || '').trim();
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);

  const [articles, resources, counselors] = await Promise.all([
    getArticles().catch(() => []),
    getResources().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  return (
    <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 920 }}>
      <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>{t.sections.search}</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 20px', fontSize: 14 }}>
        {t.pages.searchSubtitle}
      </p>

      <form action={lp('/search')} method="get" style={{ marginBottom: 24 }}>
        <input
          name="q"
          defaultValue={query}
          placeholder={t.pages.searchPlaceholder}
          aria-label={t.pages.searchPlaceholder}
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
