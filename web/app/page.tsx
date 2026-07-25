import Link from 'next/link';
import { getFeaturedResources, getAssessments, getArticles, getCounselors } from '@/lib/api';
import ResourceCard from '@/components/ResourceCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, assessments, articles, counselors] = await Promise.all([
    getFeaturedResources().catch(() => []),
    getAssessments().catch(() => []),
    getArticles().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  const featuredCounselors = counselors.filter((c) => c.featured);

  return (
    <div>
      {/* Hero：前 600px 交代「你是谁、能给我什么」（R5.1 / L5.1） */}
      <section className="container-page" style={{ padding: '56px 20px 40px' }}>
        <span className="chip" style={{ marginBottom: 16 }}>中文心理学资源导航平台</span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.25, margin: '12px 0 16px', fontWeight: 800 }}>
          3 次点击内，<br />找到你需要的心理资源
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 620, lineHeight: 1.7, margin: '0 0 28px' }}>
          我们聚合全球优质心理学网站、公益求助热线与公开版权测评，
          帮你快速筛选、对比、直达。本平台不提供在线诊疗，仅做导航与转介。
        </p>
        {/* 主 CTA ≤ 2（L2.2） */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/resources" className="btn-primary" style={{ fontSize: 16 }}>
            浏览心理资源
          </Link>
          <Link
            href="/assessments"
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 20px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              fontWeight: 600,
            }}
          >
            免费心理测评
          </Link>
        </div>
      </section>

      {/* 四大核心入口（对应业务目标 R1.2：资源 / 测评 / 求助 / 咨询师） */}
      <section className="container-page" style={{ padding: '8px 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <Link href="/resources" className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>资源导航</div>
            <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>全球心理学网站目录</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
              按类型、国家、语言筛选 40+ 优质心理站点，含流量与适用人群。
            </p>
          </Link>
          <Link href="/assessments" className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>心理测评</div>
            <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>PHQ-9 / GAD-7 自测</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
              使用公共领域权威量表，即时计分与分级解读（仅供参考）。
            </p>
          </Link>
          <Link href="/helplines" className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>求助资源</div>
            <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>危机与公益热线</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
              汇总中国及全球危机干预、支持与低价求助渠道，关键时刻用得上。
            </p>
          </Link>
          <Link href="/counselors" className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>找咨询师</div>
            <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>按议题筛选执业者</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
              按擅长议题、地区与价格筛选心理咨询师，仅做聚合转介，不直接诊疗。
            </p>
          </Link>
        </div>
      </section>

      {/* 三大核心入口延伸：资讯聚合（二期） */}
      <section className="container-page" style={{ padding: '0 20px 24px' }}>
        <div className="card" style={{ color: 'var(--ink)', textDecoration: 'none', display: 'block', background: 'linear-gradient(135deg,#eef4ff,#f8faff)' }}>
          <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>心理资讯</div>
          <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>可信科普 · 研究解读 · 求助资源</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.7 }}>
            聚合原创与引用的心理学科普、研究解读与求助资源，所有内容标注来源，附「仅供参考」声明。
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {articles.slice(0, 3).map((a) => (
              <Link key={a.id} href={`/articles/${a.slug}`} className="chip" style={{ background: '#fff', color: 'var(--ink)' }}>
                {a.title}
              </Link>
            ))}
            <Link href="/articles" className="btn-primary" style={{ fontSize: 14 }}>查看全部资讯</Link>
          </div>
        </div>
      </section>

      {/* 精选咨询师（三期：转介层） */}
      {featuredCounselors.length > 0 && (
        <section className="container-page" style={{ padding: '0 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>精选咨询师</h2>
            <Link href="/counselors" style={{ color: 'var(--muted)', fontSize: 14 }}>查看全部 →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {featuredCounselors.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/counselors/${c.id}`}
                className="card"
                style={{ color: 'var(--ink)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: '0', fontSize: 17 }}>{c.name}</h3>
                    {c.title && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.title}</div>}
                  </div>
                  <span className="chip chip-green">精选</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.specialties.slice(0, 3).map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {c.region}
                  {c.remote ? ' · 远程' : ''} · {c.pricePerSession != null ? `¥${c.pricePerSession}/次` : '面议'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 精选资源（真实 HTML 文本，利于 SEO / GEO） */}
      {featured.length > 0 && (
        <section className="container-page" style={{ padding: '32px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>精选资源</h2>
            <Link href="/resources" style={{ color: 'var(--muted)', fontSize: 14 }}>查看全部 →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {featured.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      {/* 事实底座（GEO R10.9：可被 AI 引用的定义 / 数据块） */}
      <section className="container-page" style={{ padding: '16px 20px 48px' }}>
        <div className="card" style={{ background: '#f8faff' }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>关于本平台（事实底座）</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--ink)', lineHeight: 1.9, fontSize: 15 }}>
            <li>定位：中文「心理学资源聚合导航平台」，不做自营在线诊疗，规避牌照风险。</li>
            <li>覆盖：全球心理学网站 TOP50 调研收录的优质站点、公开版权测评（PHQ-9、GAD-7）与多国求助热线。</li>
            <li>价值：用统一分类与筛选，解决「心理资源分散、真假难辨、危机时找不到入口」的痛点。</li>
            <li>合规：全站危机干预常驻；仅使用公共领域 / 授权量表；所有内容标注「仅供参考，不构成诊断」。</li>
            <li>已上线测评：{assessments.length} 套（持续扩充）；已聚合资讯 {articles.length} 篇；已入驻咨询师 {counselors.length} 位（按议题 / 地区 / 价格筛选转介）。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
