import type { Metadata } from 'next';
import Link from 'next/link';
import { getReviews } from '@/lib/api';
import type { Review } from '@/lib/types';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.community.title },
    description: t.meta.community.desc,
    ...localeAlternates(locale, '/community'),
  };
}

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('zh-CN');
  } catch {
    return s;
  }
}

export default async function CommunityPage() {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
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
    name: `${t.sections.community} · ${t.pages.communityStatReviews}`,
    url: `${SITE_URL}/community`,
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 920 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>{t.sections.community}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 20px' }}>
        {t.pages.communitySubtitle}
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link className="btn-primary" href={lp('/counselors')}>
          {t.pages.communityFindBtn}
        </Link>
        <Link
          href={lp('/helplines')}
          className="chip chip-rose"
          style={{ padding: '10px 16px', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
        >
          {t.pages.communityHelpBtn}
        </Link>
      </div>

      {/* 统计概览 */}
      {reviews.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div className="card" style={{ flex: '1 1 160px', padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{total}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.pages.communityStatReviews}</div>
          </div>
          <div className="card" style={{ flex: '1 1 160px', padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warn)' }}>★ {avgRating.toFixed(1)}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.pages.communityStatAvg}</div>
          </div>
          <div className="card" style={{ flex: '1 1 160px', padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{counselorCount}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.pages.communityStatCounselors}</div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          {t.pages.communityNoReviews} → <Link href={lp('/counselors')}>{t.pages.communityNoReviewsLink}</Link>
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
                  href={lp(`/counselors/${r.counselorId}`)}
                  style={{ fontSize: 14, color: 'var(--brand)' }}
                >
                  {t.counselor.title}：{r.counselorName ?? t.pages.cViewHelplines} →
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
        <strong style={{ fontSize: 15 }}>{t.pages.communityCovenant}</strong>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.7 }}>
          {t.pages.communityCovenantText}
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
