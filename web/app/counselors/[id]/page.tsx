import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCounselor, getCounselors, getCounselorReviews } from '@/lib/api';
import type { Counselor, Review } from '@/lib/types';
import ReviewForm from '@/components/ReviewForm';
import BookmarkButton from '@/components/BookmarkButton';
import Breadcrumb from '@/components/Breadcrumb';
import { ogImageUrl } from '@/lib/og';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const c = await getCounselor(id);
    const desc =
      c.bio ?? `${c.name}，${c.title ?? '心理咨询师'}，擅长${c.specialties.join('、')}。`;
    const ogImage = ogImageUrl({
      title: `${c.name} · ${c.title ?? '心理咨询师'}`,
      subtitle: `擅长：${c.specialties.slice(0, 4).join(' / ')}`,
      tag: '咨询师',
    });
    return {
      title: `${c.name} | 心理咨询师`,
      description: desc,
      alternates: { canonical: `/counselors/${id}` },
      openGraph: {
        type: 'profile',
        title: `${c.name} · ${c.title ?? '心理咨询师'}`,
        description: desc,
        images: [{ url: ogImage, width: 1200, height: 630, alt: c.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${c.name} · ${c.title ?? '心理咨询师'}`,
        description: desc,
        images: [ogImage],
      },
    };
  } catch {
    return { title: '咨询师未找到' };
  }
}

export default async function CounselorDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let c: Counselor;
  try {
    c = await getCounselor(id);
  } catch {
    notFound();
  }

  let reviews: Review[] = [];
  try {
    reviews = await getCounselorReviews(id);
  } catch {
    reviews = [];
  }

  // 相似咨询师：按擅长议题重合度 + 同地区加权排序，取前 3 位（排除自身）
  const allCounselors = await getCounselors().catch(() => [] as Counselor[]);
  const related = allCounselors
    .filter((x) => x.id !== c.id)
    .map((x) => {
      const shared = x.specialties.filter((s) => c.specialties.includes(s)).length;
      const sameRegion = x.region && x.region === c.region ? 1 : 0;
      return { x, score: shared * 2 + sameRegion };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.x);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: c.name,
    jobTitle: c.title ?? '心理咨询师',
    description: c.bio ?? undefined,
    knowsAbout: c.specialties,
    areaServed: c.region ?? undefined,
    url: c.bookingUrl ?? undefined,
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 820 }}>
      <Breadcrumb
        items={[
          { name: '首页', href: '/' },
          { name: '找心理咨询师', href: '/counselors' },
          { name: c.name, href: `/counselors/${c.id}` },
        ]}
      />

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ fontSize: 28, margin: '0 0 4px' }}>{c.name}</h1>
          {c.title && <div style={{ color: 'var(--muted)', fontSize: 16 }}>{c.title}</div>}
          {c.org && <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{c.org}</div>}
        </div>
        {c.bookingUrl && (
          <a
            className="btn-primary"
            href={c.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
          >
            前往预约 ↗
          </a>
        )}
        <BookmarkButton
          type="counselor"
          id={c.id}
          title={`${c.name}${c.title ? ' · ' + c.title : ''}`}
          url={`/counselors/${c.id}`}
          subtitle={c.specialties.join('、')}
        />
      </div>

      <div
        className="card"
        style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
        }}
      >
        <Field label="所在地区" value={c.region ?? '—'} />
        <Field label="远程咨询" value={c.remote ? '支持' : '仅线下'} />
        <Field label="参考价格" value={c.pricePerSession != null ? `¥${c.pricePerSession} / 次` : '价格面议'} />
        <Field label="从业年限" value={c.yearsExperience != null ? `${c.yearsExperience} 年` : '—'} />
        <Field label="参考评分" value={c.rating != null ? `★ ${c.rating}` : '—'} />
        <Field label="使用语言" value={c.languages.join('、')} />
      </div>

      {c.bio && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>简介</h2>
          <p style={{ color: 'var(--ink)', fontSize: 15, lineHeight: 1.8, margin: 0 }}>{c.bio}</p>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>擅长议题</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {c.specialties.map((s) => (
            <span key={s} className="chip chip-green">
              {s}
            </span>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>取向 / 流派</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {c.approach.map((a) => (
            <span key={a} className="chip">
              {a}
            </span>
          ))}
        </div>
      </section>

      <div
        style={{
          marginTop: 28,
          borderLeft: '3px solid var(--brand)',
          background: 'var(--card)',
          padding: '16px 18px',
          borderRadius: 8,
        }}
      >
        <strong style={{ fontSize: 15 }}>重要提示</strong>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.7 }}>
          本平台仅提供咨询师信息聚合与转介，不构成诊疗建议或医疗关系。若出现持续自伤念头等紧急情况，请立即拨打公益心理危机干预热线（见「求助资源」）。
        </p>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>
          用户评价（{reviews.length}）
        </h2>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>暂无评价，成为第一个分享体验的人。</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map((r) => (
              <div className="card" key={r.id} style={{ padding: '16px 18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{r.authorName}</span>
                  <span style={{ color: 'var(--warn)', fontSize: 14 }}>
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </span>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.8 }}>{r.content}</p>
              </div>
            ))}
          </div>
        )}
        <ReviewForm counselorId={c.id} />
      </section>

      {related.length > 0 && (
        <section style={{ marginTop: 36, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 16px' }}>相似咨询师</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {related.map((x) => (
              <Link
                key={x.id}
                href={`/counselors/${x.id}`}
                className="card"
                style={{
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{x.name}</h3>
                  {x.featured && <span className="chip chip-green">精选</span>}
                </div>
                {x.title && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{x.title}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {x.specialties.slice(0, 3).map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {x.region}
                  {x.remote ? ' · 远程' : ''}
                  {x.rating != null && ` · ★ ${x.rating}`}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '找心理咨询师', url: '/counselors' },
          { name: c.name, url: `/counselors/${c.id}` },
        ])}
      />
      {related.length > 0 && (
        <JsonLdScript
          data={itemListJsonLd(
            related.map((x) => ({
              name: x.name,
              url: `/counselors/${x.id}`,
              description: [x.title, ...x.specialties].filter(Boolean).join(' · '),
            })),
          )}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontSize: 15, marginTop: 2, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
