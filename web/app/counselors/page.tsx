import type { Metadata } from 'next';
import Link from 'next/link';
import { getCounselors } from '@/lib/api';
import type { Counselor } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '找心理咨询师 | 聚合推荐与转介',
  description:
    '按擅长议题、地区与价格筛选心理咨询师与执业者。本平台仅做信息聚合与转介，不构成诊疗建议；紧急情况请优先拨打危机干预热线。',
  alternates: { canonical: '/counselors' },
};

const PRICE_TIERS = [
  { label: '不限', value: '' },
  { label: '≤ 400 元', value: '400' },
  { label: '≤ 500 元', value: '500' },
  { label: '≤ 600 元', value: '600' },
  { label: '≤ 800 元', value: '800' },
];

const selectStyle: React.CSSProperties = {
  minHeight: 40,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--card)',
  color: 'var(--ink)',
  fontSize: 14,
  minWidth: 150,
};

export default async function CounselorsPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; region?: string; maxPrice?: string }>;
}) {
  const sp = await searchParams;
  const specialty = sp.specialty || '';
  const region = sp.region || '';
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : null;

  const all = await getCounselors().catch(() => [] as Counselor[]);

  const specialties = Array.from(new Set(all.flatMap((c) => c.specialties))).sort();
  const regions = Array.from(
    new Set(all.map((c) => c.region).filter((r): r is string => !!r)),
  ).sort();

  const list = all
    .filter((c) => (specialty ? c.specialties.includes(specialty) : true))
    .filter((c) => (region ? c.region === region : true))
    .filter((c) => (maxPrice != null ? (c.pricePerSession ?? Infinity) <= maxPrice : true))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>找心理咨询师</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 720, lineHeight: 1.7 }}>
        按擅长议题、地区与价格筛选咨询师与执业者。
        <strong>本平台仅做信息聚合与转介，不构成任何诊疗建议。</strong>
        如遇紧急危机，请优先拨打公益心理危机干预热线。
      </p>

      {/* 筛选器：原生 form GET，保持 SSR 与可分享 URL（GEO/SEO 友好） */}
      <form
        method="get"
        className="card"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
          擅长议题
          <select name="specialty" defaultValue={specialty} style={selectStyle}>
            <option value="">全部</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
          地区
          <select name="region" defaultValue={region} style={selectStyle}>
            <option value="">全部</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
          价格（单次）
          <select name="maxPrice" defaultValue={sp.maxPrice || ''} style={selectStyle}>
            {PRICE_TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary" style={{ minHeight: 40 }}>
          筛选
        </button>
        {(specialty || region || sp.maxPrice) && (
          <Link href="/counselors" className="chip" style={{ alignSelf: 'center', textDecoration: 'none' }}>
            清除筛选
          </Link>
        )}
      </form>

      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
        共 {list.length} 位咨询师
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
