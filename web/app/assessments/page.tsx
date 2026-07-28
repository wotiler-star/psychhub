import type { Metadata } from 'next';
import Link from 'next/link';
import { getAssessments } from '@/lib/api';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '心理测评 | PHQ-9 / GAD-7 免费自测',
  description:
    '使用公共领域权威量表（PHQ-9 抑郁、GAD-7 焦虑）进行免费自评，即时计分与分级解读。结果仅供参考，不构成诊断。',
  alternates: { canonical: '/assessments' },
};

const TYPE_LABEL: Record<string, string> = {
  DEPRESSION: '抑郁筛查',
  ANXIETY: '焦虑筛查',
  STRESS: '压力感知',
  SELF_ESTEEM: '自尊水平',
  SLEEP: '睡眠状况',
  WELLBEING: '主观幸福感',
  PERSONALITY: '人格测评',
};

export default async function AssessmentsPage() {
  const assessments = await getAssessments().catch(() => []);

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '心理测评', url: '/assessments' },
        ])}
      />
      <JsonLdScript
        data={itemListJsonLd(
          assessments.map((a) => ({
            name: a.title,
            url: `/assessments/${a.slug}`,
            description: a.description ?? undefined,
          })),
        )}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>心理测评</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        以下测评使用公共领域 / 授权公开的权威量表，全部免费、匿名、即时出分。
        <strong>结果仅供参考，不构成任何医疗诊断或治疗建议。</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {assessments.map((a) => (
          <Link key={a.id} href={`/assessments/${a.slug}`} className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>
              {a.type ? (TYPE_LABEL[a.type] ?? a.type) : '测评'}
            </div>
            <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>{a.title}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px', lineHeight: 1.7 }}>{a.description}</p>
            <span className="chip chip-green">免费 · 匿名</span>
            {(a as any).questions?.length > 0 && (
              <span className="chip" style={{ background: 'var(--surface-2)', color: 'var(--muted)', marginLeft: 6 }}>
                {(a as any).questions.length} 题
              </span>
            )}
          </Link>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          测评加载中或暂不可用，请稍后重试。
        </div>
      )}
    </div>
  );
}
