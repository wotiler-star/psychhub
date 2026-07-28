import type { Metadata } from 'next';
import Link from 'next/link';
import { getCounselors } from '@/lib/api';
import type { Counselor } from '@/lib/types';
import CounselorFilters from '@/components/CounselorFilters';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '找心理咨询师 | 聚合推荐与转介',
  description:
    '按擅长议题、地区与价格筛选心理咨询师与执业者。本平台仅做信息聚合与转介，不构成诊疗建议；紧急情况请优先拨打危机干预热线。',
  alternates: { canonical: '/counselors' },
};

interface SP {
  specialty?: string;
  region?: string;
  maxPrice?: string;
  remote?: string;
  sort?: string;
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
  };

  // 取全量用于派生筛选项；取筛选后结果用于展示（后端 mock 已原生支持筛选）
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

  // 排序（服务端处理后返回，覆盖后端默认 featured 排序）
  const sort = sp.sort ?? '';
  const list = [...filtered].sort((a, b) => {
    if (sort === 'rating') {
      return (b.rating ?? -1) - (a.rating ?? -1);
    }
    if (sort === 'price') {
      const pa = a.pricePerSession ?? Infinity;
      const pb = b.pricePerSession ?? Infinity;
      return pa - pb;
    }
    // 综合 / 精选优先：精选置顶
    return Number(!!b.featured) - Number(!!a.featured);
  });

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

      <CounselorFilters specialties={specialties} regions={regions} />

      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
        共 {list.length} 位咨询师
        {sp.specialty || sp.region || sp.maxPrice || sp.remote ? '（已按筛选条件）' : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {list.map((c) => (
          <Link
            key={c.id}
            href={`/counselors/${c.id}`}
            className="card"
            style={{
              color: 'var(--ink)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <h3 style={{ margin: '0', fontSize: 18 }}>{c.name}</h3>
                {c.title && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{c.title}</div>}
              </div>
              {c.featured && <span className="chip chip-green">精选</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.specialties.slice(0, 3).map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
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
                  margin: 0,
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
        ))}
      </div>

      {list.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          没有符合条件的咨询师，试试放宽筛选条件。
        </div>
      )}
    </div>
  );
}
