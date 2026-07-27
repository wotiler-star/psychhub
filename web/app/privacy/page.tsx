import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 | 心理资源聚合',
  description: '心理资源聚合隐私政策：我们如何（不）收集、使用与保护你的数据。测评匿名、免费。',
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 820 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>隐私政策</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>生效日期：2026-07-24</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>1. 我们收集什么</h2>
        <p style={{ lineHeight: 1.8 }}>
          本平台以「数据最小化」为原则。浏览与搜索资源、查看求助热线均<strong>无需注册</strong>，
          我们不会收集姓名、手机号、邮箱等可识别个人身份的信息。
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>2. 在线测评数据</h2>
        <p style={{ lineHeight: 1.8 }}>
          心理测评在<strong>你的浏览器本地</strong>完成计分，结果不回传服务器、不与任何账号绑定、
          我们不会存储你的作答。关闭页面后相关临时状态即被清除。
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>3. Cookie 与分析</h2>
        <p style={{ lineHeight: 1.8 }}>
          我们仅使用必要的技术与匿名化访问统计以改进体验，不向第三方出售或共享个人数据。
          你可以在浏览器设置中管理 Cookie。
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>4. 你的权利</h2>
        <p style={{ lineHeight: 1.8 }}>
          依据适用法律法规（含《个人信息保护法》），你有权查询、更正与删除我们持有的你的个人信息。
          由于本平台默认不收集可识别信息，通常无需额外操作。如有疑问，可通过关于页联系我们。
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>5. 数据留存与安全</h2>
        <p style={{ lineHeight: 1.8 }}>
          站点内容数据用于展示与检索；我们采取 HTTPS 传输加密与访问控制等安全措施保护数据。
        </p>
      </section>

      <section className="card" style={{ background: 'var(--surface-2)' }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>
          本站为信息导航与科普用途，<strong>不构成医疗建议</strong>。本政策可能不定期更新，重大变更将在此页说明。
        </p>
      </section>
    </div>
  );
}
