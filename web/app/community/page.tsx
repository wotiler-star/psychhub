import type { Metadata } from 'next';
import Link from 'next/link';
import { getReviews } from '@/lib/api';
import type { Review } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '心理社区 | 咨询师评价与真实反馈',
  description:
    '心理社区：用户分享的咨询师真实评价与反馈，帮助你更安心地选择合适的心理支持。',
  alternates: { canonical: '/community' },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('zh-CN');
  } catch {
    return s;
  }
}

export default async function CommunityPage() {
  let reviews: Review[] = [];
  try {
    reviews = await getReviews();
  } catch {
    reviews = [];
  }

  const total = reviews.length;
  const avgRating = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const counselorCount = new Set(reviews.map((r) => r.counselorId)).size;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '心理社区 · 咨询师评价',
    url: `${SITE_URL}/community`,
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 920 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>心理社区</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 20px' }}>
        这里汇集了用户对咨询师的真实评价与反馈。选择咨询师前，不妨先看看大家的真实声音。
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link className="btn-primary" href="/counselors">
          找咨询师并评价
        </Link>
        <Link
          href="/helplines"
          className="chip chip-rose"
          style={{ padding: '10px 16px', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
        >
          需要帮助？
        </Link>
      </div>

      {/* 统计概览 */}
      {reviews.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div className="card" style={{ flex: '1 1 160px', padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{total}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>条真实评价</div>
          </div>
          <div className="card" style={{ flex: '1 1 160px', padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warn)' }}>★ {avgRating.toFixed(1)}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>平均评分</div>
          </div>
          <div className="card" style={{ flex: '1 1 160px', padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{counselorCount}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>位咨询师被评价</div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          还没有评价。成为第一个分享体验的人吧 → <Link href="/counselors">去评价</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map((r) => (
            <div className="card" key={r.id} style={{ padding: '18px 20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700 }}>{r.authorName}</span>
                  <span style={{ color: 'var(--warn)', fontSize: 14 }}>
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{fmtDate(r.createdAt)}</span>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.8 }}>{r.content}</p>
              <div style={{ marginTop: 10 }}>
                <Link
                  href={`/counselors/${r.counselorId}`}
                  style={{ fontSize: 14, color: 'var(--brand)' }}
                >
                  关于咨询师：{r.counselorName ?? '查看'} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 28,
          borderLeft: '3px solid var(--brand)',
          background: 'var(--card)',
          padding: '16px 18px',
          borderRadius: 8,
        }}
      >
        <strong style={{ fontSize: 15 }}>社区公约</strong>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.7 }}>
          评价仅代表用户个人体验，不构成诊疗建议。本平台不核实咨询关系，亦不替任何咨询师背书。如遇紧急心理危机，请立即拨打求助热线。
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
