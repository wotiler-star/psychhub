import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAssessment, getAssessments, getCounselors, getHelplines } from '@/lib/api';
import AssessmentGate from '@/components/AssessmentGate';
import AssessmentTrends from '@/components/AssessmentTrends';
import type { Assessment, AssessmentQuestion, AssessmentBand, Counselor, Helpline } from '@/lib/types';
import { ogImageUrl } from '@/lib/og';
import Breadcrumb from '@/components/Breadcrumb';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import { Locale } from '@/i18n/config';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';
import { tEntity } from '@/i18n/content';
import LocaleLink from '@/components/LocaleLink';

// 测评详情页：FAQ 与板块小标题的本地化
const ASSESS_FAQ: Record<Locale, { q1: string; a1: string; q2: string; a2: string }> = {
  zh: {
    q1: '测评结果准确吗？',
    a1: '本测评使用公共领域权威量表自动计分，结果仅用于自我觉察参考，不构成医学诊断。如有疑虑请咨询专业心理人员或医生。',
    q2: '测评需要付费吗？',
    a2: '基础测评全部免费、匿名，无需注册或付费；部分深度测评需高级及以上会员解锁，开通后可无限次使用。',
  },
  en: {
    q1: 'How accurate are the results?',
    a1: 'This assessment auto-scores using a public-domain, validated scale. Results are for self-awareness only and are not a medical diagnosis. If in doubt, consult a mental-health professional or doctor.',
    q2: 'Does it cost anything?',
    a2: 'Basic assessments are free and anonymous — no sign-up or payment needed. Some in-depth assessments require Premium or higher; once subscribed you can take them unlimited times.',
  },
  ja: {
    q1: '結果の精度はどのくらいですか？',
    a1: '本チェックは公共領域の信頼できる尺度で自動採点され、結果は自己理解の参考のみで、医学的診断ではありません。不安な場合は専門家や医師にご相談ください。',
    q2: '料金はかかりますか？',
    a2: '基本的なチェックは無料・匿名で、登録や料金は不要です。一部の深層チェックはプレミアム以上の会員解禁が必要で、加入後は何度でも受けられます。',
  },
  ko: {
    q1: '결과는 얼마나 정확한가요?',
    a1: '이 진단은 공유 영역의 검증된 척도로 자동 채점되며, 결과는 자기 이해를 위한 참고용이며 의학적 진단이 아닙니다. 의심스러우면 전문가나 의사와 상담하세요.',
    q2: '비용이 드나요?',
    a2: '기본 진단은 무료·익명이며 가입이나 결제가 필요 없습니다. 일부 심층 진단은 프리미엄 이상 멤버십 해제가 필요하며, 가입 후 무제한 이용 가능합니다.',
  },
  es: {
    q1: '¿Qué tan precisos son los resultados?',
    a1: 'Esta evaluación se puntúa automáticamente con una escala validada de dominio público. Los resultados son solo para autoconocimiento y no constituyen un diagnóstico médico. Si tienes dudas, consulta a un profesional o médico.',
    q2: '¿Tiene algún costo?',
    a2: 'Las evaluaciones básicas son gratuitas y anónimas: no requieren registro ni pago. Algunas evaluaciones profundas requieren Premium o superior; una vez suscrito, úsalas las veces que quieras.',
  },
  fr: {
    q1: 'À quelle point les résultats sont-ils précis ?',
    a1: 'Cette évaluation est notée automatiquement avec une échelle validée du domaine public. Les résultats servent uniquement à votre propre compréhension et ne constituent pas un diagnostic médical. En cas de doute, consultez un professionnel ou un médecin.',
    q2: 'Y a-t-il un coût ?',
    a2: 'Les évaluations de base sont gratuites et anonymes : aucune inscription ni paiement. Certaines évaluations approfondies requièrent Premium ou plus ; une fois abonné, vous pouvez les passer sans limite.',
  },
};

const ASSESS_HEADINGS: Record<string, Record<Locale, string>> = {
  faq: { zh: '常见问题', en: 'FAQ', ja: 'よくある質問', ko: '자주 묻는 질문', es: 'Preguntas frecuentes', fr: 'FAQ' },
  related: { zh: '相关测评', en: 'Related assessments', ja: '関連するチェック', ko: '관련 진단', es: 'Evaluaciones relacionadas', fr: 'Évaluations liées' },
  more: { zh: '需要更多支持？', en: 'Need more support?', ja: 'さらにサポートが必要ですか？', ko: '더 많은 도움이 필요하신가요?', es: '¿Necesitas más apoyo?', fr: 'Besoin de plus de soutien ?' },
  moreDesc: {
    zh: '测评只是自我觉察的起点。若想深入梳理，可预约专业咨询师；如遇紧急危机，请优先拨打求助热线。',
    en: 'An assessment is only the start of self-awareness. To go deeper, book a professional counselor; in a crisis, call a helpline first.',
    ja: 'チェックは自己理解の第一歩にすぎません。深く整理したいなら専門カウンセラーを予約を。緊急時はまず相談窓口へ。',
    ko: '진단은 자기 이해의 시작일 뿐입니다. 깊이 다루려면 전문 상담사를 예약하세요. 위기 시에는 먼저 핫라인으로 연락하세요.',
    es: 'La evaluación es solo el inicio de la autoconciencia. Para profundizar, reserva un consejero profesional; en crisis, llama primero a una línea de ayuda.',
    fr: 'L’évaluation n’est qu’un point de départ. Pour aller plus loin, prenez rendez-vous avec un psychologue ; en crise, appelez d’abord une ligne d’aide.',
  },
  featured: { zh: '精选', en: 'Featured', ja: '注目', ko: '추천', es: 'Destacado', fr: 'En vedette' },
  helplinesCta: {
    zh: '查看心理求助热线 →',
    en: 'View mental-health hotlines →',
    ja: '心理の相談窓口を見る →',
    ko: '마음 핫라인 보기 →',
    es: 'Ver líneas de salud mental →',
    fr: 'Voir les lignes d’aide →',
  },
};
const ah = (k: string, locale: Locale) => ASSESS_HEADINGS[k]?.[locale] ?? ASSESS_HEADINGS[k]?.zh ?? k;

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  try {
    const a = await getAssessment(slug);
    const tt = tEntity(a.slug, { title: a.title, description: a.description ?? undefined }, locale);
    const ogImage = ogImageUrl({ title: tt.title, subtitle: tt.description, tag: '在线测评' });
    return {
      title: { absolute: `${tt.title} | ${t.siteName}` },
      description: tt.description || undefined,
      ...localeAlternates(locale, `/assessments/${slug}`),
      openGraph: {
        title: tt.title,
        description: tt.description || undefined,
        images: [{ url: ogImage, width: 1200, height: 630, alt: tt.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: tt.title,
        description: tt.description || undefined,
        images: [ogImage],
      },
    };
  } catch {
    return { title: t.common.notFoundTitle };
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

  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  const tt = tEntity(assessment.slug, { title: assessment.title, description: assessment.description ?? undefined }, locale);
  const faq = ASSESS_FAQ[locale];

  const questions = (assessment.questions ?? []) as AssessmentQuestion[];
  const bands = (assessment.interpretation?.bands ?? []) as AssessmentBand[];

  // 相关测评：按同类型加权排序，取前 3 个（排除自身）
  const allAssessments = await getAssessments().catch(() => [] as Assessment[]);
  const related = allAssessments
    .filter((a) => a.slug !== assessment.slug)
    .map((a) => ({ a, score: a.type && a.type === assessment.type ? 2 : 0 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map((r) => r.a);

  // 跨板块推荐：测评类型 → 擅长议题关键词，推荐相关咨询师；并引导至求助热线
  const TYPE_TO_SPECIALTY: Record<string, string[]> = {
    DEPRESSION: ['抑郁', '情绪', '心境'],
    ANXIETY: ['焦虑', '情绪'],
    STRESS: ['压力', '情绪'],
    SLEEP: ['睡眠'],
    SELF_ESTEEM: ['自尊', '自信'],
    WELLBEING: ['幸福感', '正念', '个人成长'],
    PERSONALITY: ['人格', '性格'],
  };
  const kws = TYPE_TO_SPECIALTY[assessment.type ?? ''] ?? [];
  const counselorsAll = await getCounselors().catch(() => [] as Counselor[]);
  const supportCounselors = counselorsAll
    .map((c) => ({
      c,
      score:
        (kws.some((k) => c.specialties.some((s) => s.includes(k))) ? 2 : 0) +
        (c.featured ? 1 : 0) +
        (c.rating ?? 0) / 5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((r) => r.c);
  const helplines = await getHelplines({ category: 'CRISIS' }).catch(() => []);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: faq.q1,
        acceptedAnswer: { '@type': 'Answer', text: faq.a1 },
      },
      {
        '@type': 'Question',
        name: faq.q2,
        acceptedAnswer: { '@type': 'Answer', text: faq.a2 },
      },
    ],
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 760 }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: t.nav.home, url: lp('/') },
          { name: t.sections.assessments, url: lp('/assessments') },
          { name: tt.title, url: lp(`/assessments/${assessment.slug}`) },
        ])}
      />
      <Breadcrumb
        items={[
          { name: '首页', href: '/' },
          { name: '心理测评', href: '/assessments' },
          { name: assessment.title, href: `/assessments/${assessment.slug}` },
        ]}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>{tt.title}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 8px', lineHeight: 1.7 }}>
        {tt.description}
      </p>
      {assessment.source && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>量表来源：{assessment.source}</p>
      )}

      <AssessmentGate
        slug={assessment.slug}
        title={assessment.title}
        type={assessment.type}
        questions={questions}
        bands={bands}
        locale={locale}
      />

      <AssessmentTrends slug={assessment.slug} locale={locale} />

      {/* FAQ 结构化（GEO R10.4 / SEO R9.5） */}
      <section className="card" style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>{ah('faq', locale)}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <strong style={{ fontSize: 15 }}>{faq.q1}</strong>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0', lineHeight: 1.7 }}>
              {faq.a1}
            </p>
          </div>
          <div>
            <strong style={{ fontSize: 15 }}>{faq.q2}</strong>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0', lineHeight: 1.7 }}>
              {faq.a2}
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section style={{ marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 16px' }}>{ah('related', locale)}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {related.map((a) => (
              <Link
                key={a.slug}
                href={lp(`/assessments/${a.slug}`)}
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
                <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                  {a.type ?? '测评'}
                </div>
                <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.4 }}>{a.title}</h3>
                {a.description && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                    {a.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 跨板块推荐：测评 → 咨询师 / 求助热线 */}
      <section style={{ marginTop: 32, borderTop: '1px solid var(--line)', paddingTop: 24 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>{ah('more', locale)}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 16px', lineHeight: 1.7 }}>
          {ah('moreDesc', locale)}
        </p>
        {supportCounselors.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {supportCounselors.map((c: Counselor) => (
              <Link
                key={c.id}
                href={lp(`/counselors/${c.id}`)}
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
                  <h3 style={{ margin: 0, fontSize: 16 }}>{c.name}</h3>
                  {c.featured && <span className="chip chip-green">{ah('featured', locale)}</span>}
                </div>
                {c.title && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{c.title}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.specialties.slice(0, 3).map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {c.region}
                  {c.remote ? ' · 支持远程' : ''}
                  {c.rating != null && ` · ★ ${c.rating}`}
                </div>
              </Link>
            ))}
          </div>
        )}
        <LocaleLink className="btn-primary" href="/helplines" locale={locale}>
          {helplines.length > 0 ? `${helplines.length} ${ah('helplinesCta', locale)}` : ah('helplinesCta', locale)}
        </LocaleLink>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {related.length > 0 && (
        <JsonLdScript
          data={itemListJsonLd(
            related.map((a) => ({
              name: a.title,
              url: lp(`/assessments/${a.slug}`),
              description: a.description ?? undefined,
            })),
          )}
        />
      )}
    </div>
  );
}
