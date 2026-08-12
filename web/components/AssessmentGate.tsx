'use client';

import { useMembership } from '@/lib/membership';
import { isVipAssessment, canAccessVip, VIP_MIN_TIER } from '@/lib/vipAssessments';
import type { AssessmentQuestion, AssessmentBand } from '@/lib/types';
import AssessmentQuiz from '@/components/AssessmentQuiz';

interface Props {
  slug: string;
  title: string;
  type?: string | null;
  questions: AssessmentQuestion[];
  bands: AssessmentBand[];
}

export default function AssessmentGate({ slug, title, type, questions, bands }: Props) {
  const { state, tier, isExpired, ready } = useMembership();

  // 非专属测评：无需门禁，直接渲染
  const vip = isVipAssessment({ slug, type });
  if (!vip) {
    return (
      <AssessmentQuiz
        questions={questions}
        bands={bands}
        assessmentSlug={slug}
        assessmentTitle={title}
      />
    );
  }

  // 会员等级/过期判定
  const unlocked = canAccessVip(state.tier, isExpired);

  // 会员态尚未从 localStorage 读取完成：先占位，避免非会员闪现题目 / 会员闪现锁定
  if (!ready) {
    return (
      <div className="card" style={{ marginTop: 8, padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
        正在校验会员权益…
      </div>
    );
  }

  if (unlocked) {
    return (
      <div>
        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--brand)',
            fontWeight: 600,
          }}
        >
          <span className="chip chip-purple">会员专属深度测评</span>
          <span style={{ color: 'var(--muted)', fontWeight: 400 }}>
            当前 {tier.name} · 已解锁
          </span>
        </div>
        <AssessmentQuiz
          questions={questions}
          bands={bands}
          assessmentSlug={slug}
          assessmentTitle={title}
        />
      </div>
    );
  }

  // 锁定态：展示权益说明 + 开通入口
  return (
    <div
      className="card"
      style={{
        marginTop: 8,
        padding: 28,
        borderColor: 'var(--brand)',
        background: 'var(--surface-3)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 12 }}>🔒</div>
      <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>会员专属深度测评</h2>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 auto 8px', maxWidth: 460, lineHeight: 1.7 }}>
        「{title}」属于会员专属深度测评，需 <strong style={{ color: 'var(--ink)' }}>{VIP_MIN_TIER === 'pro' ? '高级会员' : VIP_MIN_TIER} 及以上</strong> 等级解锁。
        开通后可无限次使用全部深度测评，并获得个性化解读建议。
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>
        当前等级：{tier.name}
        {isExpired ? '（已过期）' : ''}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className="btn-primary" href="/membership">
          开通会员解锁 →
        </a>
        <a
          href="/assessments"
          style={{
            height: 44,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 18px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--card)',
            color: 'var(--ink)',
            textDecoration: 'none',
            fontFamily: 'inherit',
          }}
        >
          浏览免费测评
        </a>
      </div>
    </div>
  );
}
