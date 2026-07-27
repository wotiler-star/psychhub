import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAssessment } from '@/lib/api';
import AssessmentQuiz from '@/components/AssessmentQuiz';
import type { AssessmentQuestion, AssessmentBand } from '@/lib/types';
import { ogImageUrl } from '@/lib/og';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const a = await getAssessment(slug);
    const ogImage = ogImageUrl({ title: a.title, subtitle: a.description, tag: '免费测评' });
    return {
      title: `${a.title} | 免费在线测评`,
      description: a.description ?? undefined,
      alternates: { canonical: `/assessments/${slug}` },
      openGraph: {
        title: a.title,
        description: a.description ?? undefined,
        images: [{ url: ogImage, width: 1200, height: 630, alt: a.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: a.title,
        description: a.description ?? undefined,
        images: [ogImage],
      },
    };
  } catch {
    return { title: '测评未找到' };
  }
}

export default async function AssessmentDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let assessment;
  try {
    assessment = await getAssessment(slug);
  } catch {
    notFound();
  }

  const questions = (assessment.questions ?? []) as AssessmentQuestion[];
  const bands = (assessment.interpretation?.bands ?? []) as AssessmentBand[];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${assessment.title}的结果准确吗？`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            '本测评使用公共领域权威量表自动计分，结果仅用于自我觉察参考，不构成医学诊断。如有疑虑请咨询专业心理人员或医生。',
        },
      },
      {
        '@type': 'Question',
        name: '测评需要付费吗？',
        acceptedAnswer: { '@type': 'Answer', text: '本平台所有测评免费、匿名，不需要注册或付费。' },
      },
    ],
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 760 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>{assessment.title}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 8px', lineHeight: 1.7 }}>
        {assessment.description}
      </p>
      {assessment.source && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>量表来源：{assessment.source}</p>
      )}

      <AssessmentQuiz
        questions={questions}
        bands={bands}
        assessmentSlug={assessment.slug}
        assessmentTitle={assessment.title}
      />

      {/* FAQ 结构化（GEO R10.4 / SEO R9.5） */}
      <section className="card" style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>常见问题</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <strong style={{ fontSize: 15 }}>测评结果准确吗？</strong>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0', lineHeight: 1.7 }}>
              仅用于自我觉察参考，不构成医学诊断。如有疑虑请咨询专业心理人员或医生。
            </p>
          </div>
          <div>
            <strong style={{ fontSize: 15 }}>需要付费或注册吗？</strong>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0', lineHeight: 1.7 }}>
              全部免费、匿名，无需注册或付费。
            </p>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}
