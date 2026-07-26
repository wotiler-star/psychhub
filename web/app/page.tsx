import Link from 'next/link';
import {
  getResources,
  getFeaturedResources,
  getAssessments,
  getArticles,
  getCounselors,
} from '@/lib/api';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';
import ResourceCard from '@/components/ResourceCard';

// 将资源 trafficLevel（混合「高/中」与「X万/月」）归一为可比较的热度分，用于站点榜单排序
function trafficScore(level: string | null): number {
  if (!level) return 0;
  const m = level.match(/(\d+)(?:-(\d+))?万\/月/);
  if (m) {
    const lo = Number(m[1]);
    const hi = m[2] ? Number(m[2]) : lo;
    return (lo + hi) / 2;
  }
  if (level.includes('高')) return 3000;
  if (level.includes('中')) return 1000;
  if (level.includes('低')) return 300;
  return 0;
}

const ARTICLE_CATEGORY_LABEL: Record<string, string> = {
  POPSCI: '科普',
  RESEARCH: '研究',
  NEWS: '资讯',
};

// 友情链接（导航站常见模块：推荐/合作站点外链，静态配置）
const FRIEND_LINKS: { name: string; url: string }[] = [
  { name: '中科院心理研究所', url: 'https://psych.cas.cn' },
  { name: '简单心理', url: 'https://www.jiandanxinli.com' },
  { name: '壹心理', url: 'https://www.xinli001.com' },
  { name: 'KnowYourself', url: 'https://www.knowyourself.cc' },
  { name: '丁香医生', url: 'https://dxy.com' },
  { name: 'APA', url: 'https://www.apa.org' },
  { name: 'Psychology Today', url: 'https://www.psychologytoday.com' },
  { name: 'Mind (UK)', url: 'https://www.mind.org.uk' },
];

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [all, featured, assessments, articles, counselors] = await Promise.all([
    getResources().catch(() => []),
    getFeaturedResources().catch(() => []),
    getAssessments().catch(() => []),
    getArticles().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  // 按资源类型分组，每组优先展示 featured，取前 4 个（导航站范式：分类网格）
  const groups = RESOURCE_TYPES.map((t) => ({
    type: t,
    meta: RESOURCE_TYPE_META[t],
    items: all
      .filter((r) => r.type === t)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, 4),
  })).filter((g) => g.items.length > 0);

  // 热门咨询师榜：按评分降序 Top5（导航站范式：🔥 排行榜）
  const topCounselors = [...counselors]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  // 站点人气榜：按流量热度降序 Top10（导航站范式：🏆 榜单）
  const topSites = [...all]
    .sort((a, b) => trafficScore(b.trafficLevel) - trafficScore(a.trafficLevel))
    .slice(0, 10);

  // 最新收录：按种子录入顺序取最近 8 条（生产环境可改为按 createdAt 降序）
  const latestResources = all.slice(-8).reverse();

  // 标签云：聚合全部资源标签，按出现频次取 Top 18
  const tagFreq = new Map<string, number>();
  for (const r of all) for (const t of (r.tags ?? [])) tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1);
  const topTags = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18);

  return (
    <div>
      {/* Hero：搜索框 + 分类快捷标签 + 主 CTA（对齐导航站范式） */}
      <section className="container-page" style={{ padding: '48px 20px 28px' }}>
        <span className="chip" style={{ marginBottom: 14 }}>中文心理学资源导航平台</span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.25, margin: '12px 0 14px', fontWeight: 800 }}>
          3 次点击内，<br />找到你需要的心理资源
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 620, lineHeight: 1.7, margin: '0 0 22px' }}>
          我们聚合全球优质心理学网站、公益求助热线与公开版权测评，
          帮你快速筛选、对比、直达。本平台不提供在线诊疗，仅做导航与转介。
        </p>

        {/* 全站搜索框（GET 跳转到 /resources?q=，SSR 友好） */}
        <form
          action="/resources"
          method="get"
          style={{ display: 'flex', gap: 8, maxWidth: 580, marginBottom: 18 }}
        >
          <input
            name="q"
            placeholder="搜索心理资源、测评、咨询师…"
            aria-label="搜索心理资源"
            style={{
              flex: 1,
              minHeight: 48,
              padding: '0 16px',
              borderRadius: 12,
              border: '1px solid var(--line)',
              fontSize: 16,
              background: 'var(--card)',
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
          <button type="submit" className="btn-primary" style={{ minHeight: 48, fontSize: 16 }}>
            搜索
          </button>
        </form>

        {/* 分类快捷标签栏（对应鱼皮「AI写作 / AI图像…」一行） */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {RESOURCE_TYPES.map((t) => (
            <Link
              key={t}
              href={`/resources?type=${t}`}
              className={`chip ${RESOURCE_TYPE_META[t].chip}`}
              style={{ fontSize: 13, padding: '6px 14px', textDecoration: 'none' }}
            >
              {RESOURCE_TYPE_META[t].label}
            </Link>
          ))}
        </div>

        {/* 主 CTA ≤ 2（L2.2） */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
          <Link href="/resources" className="btn-primary" style={{ fontSize: 16 }}>
            浏览全部资源
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
              textDecoration: 'none',
            }}
          >
            免费心理测评
          </Link>
        </div>
      </section>

      {/* 四大核心入口（对应业务目标 R1.2：资源 / 测评 / 求助 / 咨询师） */}
      <section className="container-page" style={{ padding: '8px 20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
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

      {/* ✨ 编辑精选推荐横条（导航站常见模块：横向滚动重点曝光） */}
      {featured.length > 0 && (
        <section className="container-page" style={{ padding: '4px 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>✨ 编辑精选</h2>
            <Link href="/resources" style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>
              查看全部资源 →
            </Link>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 10,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {featured.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  flex: '0 0 280px',
                  scrollSnapAlign: 'start',
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className={`chip ${RESOURCE_TYPE_META[r.type]?.chip ?? ''}`}>
                    {RESOURCE_TYPE_META[r.type]?.label ?? r.type}
                  </span>
                  {r.country && <span style={{ fontSize: 12, color: 'var(--muted)' }}>🌍 {r.country}</span>}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{r.name}</h3>
                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: 13,
                    margin: 0,
                    lineHeight: 1.7,
                    flex: 1,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {r.description}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.tags?.slice(0, 2).map((t) => (
                    <span key={t} className="chip" style={{ background: '#f1f5f9', color: 'var(--muted)' }}>
                      {t}
                    </span>
                  ))}
                </div>
                <span className="btn-primary" style={{ textAlign: 'center', fontSize: 14 }}>
                  直达资源 →
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 按分类分组的资源网格（导航站核心范式：每组标题 + 查看更多 + 卡片网格） */}
      {groups.map((g) => (
        <section className="container-page" key={g.type} style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>{g.meta.label}</h2>
            <Link href={`/resources?type=${g.type}`} style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>
              查看更多 →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {g.items.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      ))}

      {/* 🔥 热门咨询师榜（导航站范式：排行榜） */}
      {topCounselors.length > 0 && (
        <section className="container-page" style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>🔥 热门咨询师榜</h2>
            <Link href="/counselors" style={{ color: 'var(--muted)', fontSize: 14 }}>查看全部 →</Link>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {topCounselors.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/counselors/${c.id}`}
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink)', textDecoration: 'none', padding: '14px 18px' }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 15,
                      background: i < 3 ? 'var(--brand)' : '#eef2ff',
                      color: i < 3 ? '#fff' : 'var(--brand)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.specialties.slice(0, 3).join(' · ')}
                      {c.region ? ` · ${c.region}` : ''}
                      {c.remote ? ' · 远程' : ''}
                    </div>
                  </div>
                  <span className="chip chip-green" style={{ flexShrink: 0 }}>
                    {c.rating != null ? `${c.rating} 分` : '暂无评分'}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 🏆 站点人气榜（导航站范式：🏆 榜单，按流量热度排名） */}
      {topSites.length > 0 && (
        <section className="container-page" style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>🏆 站点人气榜</h2>
            <Link href="/resources" style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>
              全部资源 →
            </Link>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {topSites.map((r, i) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink)', textDecoration: 'none', padding: '14px 18px' }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 15,
                      background: i < 3 ? 'var(--brand)' : '#eef2ff',
                      color: i < 3 ? '#fff' : 'var(--brand)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {RESOURCE_TYPE_META[r.type]?.label ?? r.type}
                      {r.trafficLevel ? ` · 📈 ${r.trafficLevel}` : ''}
                      {r.country ? ` · ${r.country}` : ''}
                    </div>
                  </div>
                  <span className="chip" style={{ flexShrink: 0, background: '#eef2ff', color: 'var(--brand)' }}>
                    直达 →
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 🆕 最新收录（导航站常见模块：近期新增资源列表） */}
      {latestResources.length > 0 && (
        <section className="container-page" style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>🆕 最新收录</h2>
            <Link href="/resources" style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>
              全部资源 →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {latestResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      {/* 🔥 热门文章（导航站常见模块：文章卡片网格，按发布时间取最新 6 篇） */}
      {articles.length > 0 && (
        <section className="container-page" style={{ padding: '0 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>🔥 热门文章</h2>
            <Link href="/articles" style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>
              查看全部资讯 →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[...articles]
              .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')))
              .slice(0, 6)
              .map((a) => (
                <Link
                  key={a.id}
                  href={`/articles/${a.slug}`}
                  className="card"
                  style={{ color: 'var(--ink)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="chip" style={{ background: '#eef2ff', color: 'var(--brand)' }}>
                      {ARTICLE_CATEGORY_LABEL[a.category ?? ''] ?? a.category ?? ''}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.publishedAt}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{a.title}</h3>
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: 13,
                      margin: 0,
                      lineHeight: 1.7,
                      flex: 1,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {a.excerpt}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {a.sourceName}
                    {a.author ? ` · ${a.author}` : ''}
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* 🏷 标签云（导航站常见模块：按标签快速探索资源） */}
      {topTags.length > 0 && (
        <section className="container-page" style={{ padding: '0 20px 24px' }}>
          <h2 style={{ fontSize: 22, margin: '0 0 14px' }}>🏷 大家都在搜</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {topTags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/resources?tag=${encodeURIComponent(tag)}`}
                className="chip"
                style={{
                  fontSize: Math.min(18, 12 + count),
                  padding: '6px 14px',
                  background: '#eef2ff',
                  color: 'var(--brand)',
                  textDecoration: 'none',
                }}
              >
                {tag}
                <span style={{ opacity: 0.6, marginLeft: 6, fontSize: 11 }}>{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 🔗 友情链接（导航站常见模块：推荐/合作站点外链） */}
      <section className="container-page" style={{ padding: '0 20px 24px' }}>
        <h2 style={{ fontSize: 22, margin: '0 0 14px' }}>🔗 友情链接</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {FRIEND_LINKS.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{
                color: 'var(--ink)',
                textDecoration: 'none',
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.name}
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>↗</span>
            </a>
          ))}
        </div>
      </section>

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
