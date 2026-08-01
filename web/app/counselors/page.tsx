import type { Metadata } from 'next';
import Link from 'next/link';
import { getCounselors } from '@/lib/api';
import type { Counselor } from '@/lib/types';
import CounselorFilters from '@/components/CounselorFilters';
import Pager from '@/components/Pager';
import ViewToggle from '@/components/ViewToggle';
import BookmarkButton from '@/components/BookmarkButton';
import FilterPanel from '@/components/FilterPanel';
import SearchBox from '@/components/SearchBox';
import EmptyState from '@/components/EmptyState';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import { paginate, withPagination } from '@/lib/paginate';

export const dynamic = 'force-dynamic';

interface SP {
  specialty?: string;
  region?: string;
  maxPrice?: string;
  minRating?: string;
  remote?: string;
  q?: string;
  sort?: string;
  view?: string;
  page?: string;
  [key: string]: string | undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const query = {
    specialty: sp.specialty,
    region: sp.region,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    remote: sp.remote === '1' ? true : undefined,
    q: sp.q,
  };
  const filtered = await getCounselors(query).catch(() => [] as Counselor[]);
  return withPagination(
    {
      title: '找心理咨询师 | 聚合推荐与转介',
      description:
        '按擅长议题、地区与价格筛选心理咨询师与执业者。本平台仅做信息聚合与转介，不构成诊疗建议；紧急情况请优先拨打危机干预热线。',
      alternates: { canonical: '/counselors' },
    },
    '/counselors',
    sp,
    page,
    filtered.length,
    9,
  );
}

export default async function CounselorsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const query = {
    specialty: sp.specialty,
    region: sp.region,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    remote: sp.remote === '1' ? true : undefined,
    q: sp.q,
  };

  const [all, filtered] = await Promise.all([
    getCounselors().catch(() => [] as Counselor[]),
    getCounselors(query).catch(() => [] as Counselor[]),
  ]);

  const specialties = Array.from(
    new Set(all.flatMap((c) => c.specialties)),
  ).sort();
  const regions = Array.from(
    new Set(all.map((c) => c.region).filter((r): r is string => !!r)),
  ).sort();

  const specialtyCounts: Record<string, number> = {};
  for (const c of all) for (const s of c.specialties) specialtyCounts[s] = (specialtyCounts[s] ?? 0) + 1;

  // 最低评分过滤（前端派生，后端 mock 无此参数）
  const minRating = sp.minRating ? Number(sp.minRating) : 0;
  const rated = minRating > 0 ? filtered.filter((c) => (c.rating ?? 0) >= minRating) : filtered;

  const sort = sp.sort ?? '';
  const list = [...rated].sort((a, b) => {
    if (sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
    if (sort === 'price') {
      const pa = a.pricePerSession ?? Infinity;
      const pb = b.pricePerSession ?? Infinity;
      return pa - pb;
    }
    if (sort === 'experience') return (b.yearsExperience ?? -1) - (a.yearsExperience ?? -1);
    return Number(!!b.featured) - Number(!!a.featured);
  });

  const page = Number(sp.page) || 1;
  const { pageItems, totalPages } = paginate(list, page, 9);

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '找心理咨询师', url: '/counselors' },
        ])}
      />
      <JsonLdScript
        data={itemListJsonLd(
          list.map((c) => ({
            name: c.name,
            url: `/counselors/${c.id}`,
            description: [c.title, ...c.specialties].filter(Boolean).join(' · '),
          })),
        )}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>找心理咨询师</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 720, lineHeight: 1.7 }}>
        按擅长议题、地区与价格筛选咨询师与执业者。
        <strong>本平台仅做信息聚合与转介，不构成任何诊疗建议。</strong>
        如遇紧急危机，请优先拨打公益心理危机干预热线。
      </p>

      <FilterPanel>
        <CounselorFilters specialties={specialties} regions={regions} specialtyCounts={specialtyCounts} />
      </FilterPanel>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>
          共 {list.length} 位咨询师
          {sp.specialty || sp.region || sp.maxPrice || sp.minRating || sp.remote || sp.q ? '（已按筛选条件）' : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBox paramName="q" placeholder="搜索咨询师 / 议题…" width={180} />
          <ViewToggle />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="没有符合条件的咨询师" hint="试试放宽筛选条件，或更换关键词。" />
      ) : sp.view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pageItems.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}
            >
              <Link
                href={`/counselors/${c.id}`}
                style={{ flex: 1, minWidth: 220, color: 'var(--ink)', textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{c.name}</h3>
                  {c.featured && <span className="chip chip-green">精选</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  {[c.title, c.region, c.remote ? '远程' : null, c.pricePerSession != null ? `¥${c.pricePerSession}/次` : '价格面议', c.rating != null ? `★ ${c.rating}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </Link>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                {c.specialties.slice(0, 3).map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
              <BookmarkButton
                type="counselor"
                id={c.id}
                title={`${c.name}${c.title ? ' · ' + c.title : ''}`}
                url={`/counselors/${c.id}`}
                subtitle={c.specialties.join('、')}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {pageItems.map((c) => (
            <div key={c.id} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                <BookmarkButton
                  type="counselor"
                  id={c.id}
                  title={`${c.name}${c.title ? ' · ' + c.title : ''}`}
                  url={`/counselors/${c.id}`}
                  subtitle={c.specialties.join('、')}
                />
              </div>
              <Link href={`/counselors/${c.id}`} style={{ display: 'block', color: 'var(--ink)', textDecoration: 'none', paddingRight: 36 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: '0', fontSize: 18 }}>{c.name}</h3>
                    {c.title && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{c.title}</div>}
                  </div>
                  {c.featured && <span className="chip chip-green">精选</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {c.specialties.slice(0, 3).map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
                  {c.region}
                  {c.remote ? ' · 支持远程' : ''} ·{' '}
                  {c.pricePerSession != null ? `¥${c.pricePerSession}/次` : '价格面议'}
                  {c.rating != null && ` · ★ ${c.rating}`}
                </div>
                {c.bio && (
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--muted)',
                      margin: '8px 0 0',
                      lineHeight: 1.7,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.bio}
                  </p>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}

      <Pager basePath="/counselors" params={sp} page={page} totalPages={totalPages} />
    </div>
  );
}
