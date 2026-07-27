import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们 | 心理资源聚合',
  description:
    '心理资源聚合是一个中文心理学资源导航平台，目标是用统一分类帮用户快速找到可靠的全球心理资源与求助渠道。我们不做在线诊疗。',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 820 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>关于我们</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
        最后更新：2026-07-24
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20 }}>我们是谁</h2>
        <p style={{ lineHeight: 1.8 }}>
          「心理资源聚合」是一个独立的中文心理学资源导航与科普平台。我们不做自营在线诊疗，
          而是聚合全球优质的心理网站、公益求助渠道与公开版权测评，帮助用户用最少的操作找到可靠资源。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20 }}>我们的目标</h2>
        <ul style={{ lineHeight: 1.9 }}>
          <li><strong>降低寻找成本：</strong>把分散、真假难辨的心理资源集中到一处，3 次点击内可达。</li>
          <li><strong>守住安全底线：</strong>全站常驻危机干预入口，优先呈现权威与公益渠道。</li>
          <li><strong>尊重隐私：</strong>测评免费、匿名，不收集可识别个人身份的信息。</li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20 }}>专业性与可信度（E-E-A-T）</h2>
        <p style={{ lineHeight: 1.8 }}>
          本平台内容基于公开、可核查的来源（如全球心理学网站调研、公共领域量表 PHQ-9 / GAD-7、
          各国官方危机干预热线）。所有测评结果均标注「仅供参考，不构成诊断」。
          我们不提供医疗建议；涉及诊断与治疗，请务必咨询持证专业人士。
        </p>
      </section>

      <section className="card" style={{ background: 'var(--surface-3)' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>免责声明</h2>
        <p style={{ color: 'var(--ink)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
          本站为信息导航与科普用途，不构成任何医疗、心理或法律建议。若你正经历危机，
          请立即使用<a href="/helplines" style={{ color: 'var(--danger)' }}>求助资源</a>中的热线。
        </p>
      </section>
    </div>
  );
}
