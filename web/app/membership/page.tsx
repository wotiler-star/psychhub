import type { Metadata } from 'next';
import MembershipExplorer from '@/components/MembershipExplorer';
import { breadcrumbJsonLd, JsonLdScript } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: '会员中心 | 心理资源聚合',
  description: '了解心理资源聚合的会员体系：免费 / 基础 / 高级 / 尊享四档权益对比，开通会员解锁专属测评、无广告浏览与成长积分。',
  robots: { index: true, follow: true },
  alternates: { canonical: '/membership' },
};

export default function MembershipPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '会员中心', url: '/membership' },
        ])}
      />
      <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 1080 }}>
        <header style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="chip" style={{ background: 'var(--chip-purple-bg)', color: '#7c3aed' }}>
            会员体系
          </span>
          <h1 style={{ fontSize: 30, margin: '12px 0 8px' }}>选择适合你的会员方案</h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 640, margin: '0 auto' }}>
            从免费探索到一对一陪伴，我们为不同阶段的你提供心理成长支持。签到积累积分，可兑换会员时长与专属体验。
          </p>
        </header>
        <MembershipExplorer />
      </div>
    </>
  );
}
