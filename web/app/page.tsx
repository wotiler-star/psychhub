import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getResources,
  getFeaturedResources,
  getAssessments,
  getArticles,
  getCounselors,
} from '@/lib/api';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';
import ResourceCard from '@/components/ResourceCard';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';
import { Locale } from '@/i18n/config';

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

const HOME_HEADINGS: Record<Locale, Record<string, string>> = {
  zh: { featured: '✨ 编辑精选', topCounselors: '🔥 热门咨询师榜', topSites: '🏆 站点人气榜', latest: '🆕 最新收录', hotArticles: '🔥 热门文章', tags: '🏷 大家都在搜', friends: '🔗 友情链接', about: '关于本平台（事实底座）' },
  en: { featured: '✨ Editor’s Picks', topCounselors: '🔥 Top Counselors', topSites: '🏆 Most Popular Sites', latest: '🆕 Recently Added', hotArticles: '🔥 Popular Articles', tags: '🏷 Trending Tags', friends: '🔗 Friend Links', about: 'About This Platform (Fact Base)' },
  ja: { featured: '✨ 編集部おすすめ', topCounselors: '🔥 人気カウンセラー', topSites: '🏆 人気サイト', latest: '🆕 新着', hotArticles: '🔥 人気記事', tags: '🏷 話題のタグ', friends: '🔗 提携サイト', about: '本プラットフォームについて（事実ベース）' },
  ko: { featured: '✨ 편집 추천', topCounselors: '🔥 인기 상담사', topSites: '🏆 인기 사이트', latest: '🆕 최신 추가', hotArticles: '🔥 인기 아티클', tags: '🏷 인기 태그', friends: '🔗 친구 링크', about: '이 플랫폼 소개(사실 기반)' },
  es: { featured: '✨ Selección del editor', topCounselors: '🔥 Terapeutas populares', topSites: '🏆 Sitios más populares', latest: '🆕 Añadido recientemente', hotArticles: '🔥 Artículos populares', tags: '🏷 Etiquetas populares', friends: '🔗 Enlaces amigos', about: 'Sobre esta plataforma (base de hechos)' },
  fr: { featured: '✨ Coups de cœur', topCounselors: '🔥 Thérapeutes populaires', topSites: '🏆 Sites les plus populaires', latest: '🆕 Récemment ajouté', hotArticles: '🔥 Articles populaires', tags: '🏷 Tags tendance', friends: '🔗 Liens amis', about: 'À propos de la plateforme (base factuelle)' },
};

const VIEW_ALL: Record<Locale, string> = {
  zh: '查看全部 →',
  en: 'View all →',
  ja: 'すべて見る →',
  ko: '전체 보기 →',
  es: 'Ver todo →',
  fr: 'Tout voir →',
};

const CARD: Record<Locale, { resources: string; assessments: string; helplines: string; counselors: string }> = {
  zh: {
    resources: '按类型、国家、语言筛选 40+ 优质心理站点，含流量与适用人群。',
    assessments: '使用公共领域权威量表，即时计分与分级解读（仅供参考）。',
    helplines: '汇总中国及全球危机干预、支持与低价求助渠道，关键时刻用得上。',
    counselors: '按擅长议题、地区与价格筛选心理咨询师，仅做聚合转介，不直接诊疗。',
  },
  en: {
    resources: 'Filter 40+ quality mental-health sites by type, country and language, with traffic and audience.',
    assessments: 'Use public-domain authoritative scales with instant scoring and tiered interpretation (for reference).',
    helplines: 'A roundup of crisis-intervention, support and low-cost channels in China and worldwide.',
    counselors: 'Filter counselors by issue, region and price. Aggregation and referral only — no direct treatment.',
  },
  ja: {
    resources: '種類・国・言語で40以上の優良サイトを絞り込み、アクセスと対象者付き。',
    assessments: '公共領域の信頼できる尺度で即時採点と段階解説（参考用）。',
    helplines: '中国と世界の危機介入・支援・低価格チャネルを総まとめ。',
    counselors: '得意な议题・地域・料金で絞り込み。紹介のみで診療はしません。',
  },
  ko: {
    resources: '유형·국가·언어로 40개 이상 우수 사이트를 필터링, 트래픽과 대상 포함.',
    assessments: '공공 영역 신뢰 척도로 즉시 채점과 단계 해설(참고용).',
    helplines: '중국과 전 세계의 위기 개입·지원·저비용 채널 총정리.',
    counselors: '전문议题·지역·가격으로 필터링. 연결만 하며 진료는 하지 않음.',
  },
  es: {
    resources: 'Filtra más de 40 sitios de calidad por tipo, país e idioma, con tráfico y público.',
    assessments: 'Usa escalas de dominio público con puntuación instantánea e interpretación por niveles (de referencia).',
    helplines: 'Recopilación de canales de crisis, apoyo y bajo costo en China y el mundo.',
    counselors: 'Filtra por tema, región y precio. Solo agregación y derivación, sin tratamiento.',
  },
  fr: {
    resources: 'Filtrez plus de 40 sites de qualité par type, pays et langue, avec trafic et public.',
    assessments: 'Échelles de domaine public à score instantané et interprétation par niveaux (à titre indicatif).',
    helplines: 'Synthèse des canaux de crise, de soutien et à bas coût en Chine et dans le monde.',
    counselors: 'Filtrez par sujet, région et prix. Agrégation et orientation, pas de soins.',
  },
};

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.home.title },
    description: t.meta.home.desc,
    ...localeAlternates(locale, '/'),
  };
}

export default async function HomePage() {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  const H = HOME_HEADINGS[locale];

  const [all, featured, assessments, articles, counselors] = await Promise.all([
    getResources().catch(() => []),
    getFeaturedResources().catch(() => []),
    getAssessments().catch(() => []),
    getArticles().catch(() => []),
    getCounselors().catch(() => []),
  ]);

  const groups = RESOURCE_TYPES.map((t2) => ({
    type: t2,
    meta: RESOURCE_TYPE_META[t2],
    items: all
      .filter((r) => r.type === t2)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, 4),
  })).filter((g) => g.items.length > 0);

  const topCounselors = [...counselors]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  const topSites = [...all]
    .sort((a, b) => trafficScore(b.trafficLevel) - trafficScore(a.trafficLevel))
    .slice(0, 10);

  const latestResources = all.slice(-8).reverse();

  const tagFreq = new Map<string, number>();
  for (const r of all) for (const tg of (r.tags ?? [])) tagFreq.set(tg, (tagFreq.get(tg) ?? 0) + 1);
  const topTags = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18);

  const CORE = [
    { key: 'resources', href: '/resources', title: t.sections.resources, desc: CARD[locale].resources },
    { key: 'assessments', href: '/assessments', title: t.sections.assessments, desc: CARD[locale].assessments },
    { key: 'helplines', href: '/helplines', title: t.sections.helplines, desc: CARD[locale].helplines },
    { key: 'counselors', href: '/counselors', title: t.sections.counselors, desc: CARD[locale].counselors },
  ] as const;

  return (
    <div>
      {/* Hero */}
      <section className="container-page" style={{ padding: '48px 20px 28px' }}>
        <span className="chip" style={{ marginBottom: 14 }}>{t.siteName}</span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.25, margin: '12px 0 14px', fontWeight: 800 }}>
          {t.home.heroTitle}
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 620, lineHeight: 1.7, margin: '0 0 22px' }}>
          {t.home.heroSubtitle}
        </p>

        <form
          action={lp('/search')}
          method="get"
          style={{ display: 'flex', gap: 8, maxWidth: 580, marginBottom: 18 }}
        >
          <input
            name="q"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
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
            {t.sections.search}
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {RESOURCE_TYPES.map((tp) => (
            <Link
              key={tp}
              href={lp(`/resources?type=${tp}`)}
              className={`chip ${RESOURCE_TYPE_META[tp].chip}`}
              style={{ fontSize: 13, padding: '6px 14px', textDecoration: 'none' }}
            >
              {RESOURCE_TYPE_META[tp].label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
          <Link href={lp('/resources')} className="btn-primary" style={{ fontSize: 16 }}>
            {t.home.heroCtaResources}
          </Link>
          <Link
            href={lp('/assessments')}
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
            {t.home.heroCtaAssess}
          </Link>
        </div>
      </section>

      {/* 四大核心入口 */}
      <section className="container-page" style={{ padding: '8px 20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {CORE.map((c) => (
            <Link key={c.key} href={lp(c.href)} className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
              <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>{c.title}</div>
              <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>{c.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 编辑精选 */}
      {featured.length > 0 && (
        <section className="container-page" style={{ padding: '4px 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>{H.featured}</h2>
            <Link href={lp('/resources')} style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>
              {VIEW_ALL[locale]}
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 10, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {featured.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="card" style={{ flex: '0 0 280px', scrollSnapAlign: 'start', color: 'var(--ink)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className={`chip ${RESOURCE_TYPE_META[r.type]?.chip ?? ''}`}>{RESOURCE_TYPE_META[r.type]?.label ?? r.type}</span>
                  {r.country && <span style={{ fontSize: 12, color: 'var(--muted)' }}>🌍 {r.country}</span>}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{r.name}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0, lineHeight: 1.7, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{r.description}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.tags?.slice(0, 2).map((tg) => (<span key={tg} className="chip" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{tg}</span>))}
                </div>
                <span className="btn-primary" style={{ textAlign: 'center', fontSize: 14 }}>→</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 分组网格 */}
      {groups.map((g) => (
        <section className="container-page" key={g.type} style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>{g.meta.label}</h2>
            <Link href={lp(`/resources?type=${g.type}`)} style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>{VIEW_ALL[locale]}</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {g.items.map((r) => (<ResourceCard key={r.id} resource={r} />))}
          </div>
        </section>
      ))}

      {/* 热门咨询师榜 */}
      {topCounselors.length > 0 && (
        <section className="container-page" style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>{H.topCounselors}</h2>
            <Link href={lp('/counselors')} style={{ color: 'var(--muted)', fontSize: 14 }}>{VIEW_ALL[locale]}</Link>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {topCounselors.map((c, i) => (
              <li key={c.id}>
                <Link href={lp(`/counselors/${c.id}`)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink)', textDecoration: 'none', padding: '14px 18px' }}>
                  <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, background: i < 3 ? 'var(--brand)' : 'var(--chip-bg)', color: i < 3 ? 'var(--btn-text)' : 'var(--brand)' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.specialties.slice(0, 3).join(' · ')}{c.region ? ` · ${c.region}` : ''}{c.remote ? ' · 远程' : ''}</div>
                  </div>
                  <span className="chip chip-green" style={{ flexShrink: 0 }}>{c.rating != null ? `${c.rating} 分` : '暂无评分'}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 站点人气榜 */}
      {topSites.length > 0 && (
        <section className="container-page" style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>{H.topSites}</h2>
            <Link href={lp('/resources')} style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>{VIEW_ALL[locale]}</Link>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {topSites.map((r, i) => (
              <li key={r.id}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink)', textDecoration: 'none', padding: '14px 18px' }}>
                  <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, background: i < 3 ? 'var(--brand)' : 'var(--chip-bg)', color: i < 3 ? 'var(--btn-text)' : 'var(--brand)' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{RESOURCE_TYPE_META[r.type]?.label ?? r.type}{r.trafficLevel ? ` · 📈 ${r.trafficLevel}` : ''}{r.country ? ` · ${r.country}` : ''}</div>
                  </div>
                  <span className="chip" style={{ flexShrink: 0, background: 'var(--chip-bg)', color: 'var(--brand)' }}>→</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 最新收录 */}
      {latestResources.length > 0 && (
        <section className="container-page" style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>{H.latest}</h2>
            <Link href={lp('/resources')} style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>{VIEW_ALL[locale]}</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {latestResources.map((r) => (<ResourceCard key={r.id} resource={r} />))}
          </div>
        </section>
      )}

      {/* 热门文章 */}
      {articles.length > 0 && (
        <section className="container-page" style={{ padding: '0 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>{H.hotArticles}</h2>
            <Link href={lp('/articles')} style={{ color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>{VIEW_ALL[locale]}</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[...articles]
              .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')))
              .slice(0, 6)
              .map((a) => (
                <Link key={a.id} href={lp(`/articles/${a.slug}`)} className="card" style={{ color: 'var(--ink)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="chip" style={{ background: 'var(--chip-bg)', color: 'var(--brand)' }}>{ARTICLE_CATEGORY_LABEL[a.category ?? ''] ?? a.category ?? ''}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.publishedAt}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{a.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0, lineHeight: 1.7, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{a.excerpt}</p>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.sourceName}{a.author ? ` · ${a.author}` : ''}</div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* 标签云 */}
      {topTags.length > 0 && (
        <section className="container-page" style={{ padding: '0 20px 24px' }}>
          <h2 style={{ fontSize: 22, margin: '0 0 14px' }}>{H.tags}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {topTags.map(([tag, count]) => (
              <Link key={tag} href={lp(`/resources?tag=${encodeURIComponent(tag)}`)} className="chip" style={{ fontSize: Math.min(18, 12 + count), padding: '6px 14px', background: 'var(--chip-bg)', color: 'var(--brand)', textDecoration: 'none' }}>
                {tag}
                <span style={{ opacity: 0.6, marginLeft: 6, fontSize: 11 }}>{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 友情链接 */}
      <section className="container-page" style={{ padding: '0 20px 24px' }}>
        <h2 style={{ fontSize: 22, margin: '0 0 14px' }}>{H.friends}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {FRIEND_LINKS.map((f) => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="card" style={{ color: 'var(--ink)', textDecoration: 'none', padding: '12px 16px', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {f.name}
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>↗</span>
            </a>
          ))}
        </div>
      </section>

      {/* 事实底座 */}
      <section className="container-page" style={{ padding: '16px 20px 48px' }}>
        <div className="card" style={{ background: 'var(--surface-3)' }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>{H.about}</h2>
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
