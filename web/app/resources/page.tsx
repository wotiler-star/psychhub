import type { Metadata } from 'next';
import { getResources } from '@/lib/api';
import ResourceCard from '@/components/ResourceCard';
import ResourceFilters from '@/components/ResourceFilters';
import Pager from '@/components/Pager';
import CompareBar from '@/components/CompareBar';
import ViewToggle from '@/components/ViewToggle';
import BookmarkButton from '@/components/BookmarkButton';
import CompareToggle from '@/components/CompareToggle';
import FilterPanel from '@/components/FilterPanel';
import { RESOURCE_TYPE_META } from '@/lib/format';
import { breadcrumbJsonLd, JsonLdScript } from '@/lib/jsonld';
import { paginate, withPagination } from '@/lib/paginate';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const resources = await getResources({
    q: sp.q,
    type: sp.type,
    country: sp.country,
    language: sp.language,
    tag: sp.tag,
  }).catch(() => []);
  return withPagination(
    {
      title: '资源导航 | 全球心理学网站目录',
      description:
        '按类型、国家、语言筛选全球优质心理学网站：内容媒体、执业 SaaS、在线咨询、公益组织、测评工具、冥想自助与学术教育资源。',
      alternates: { canonical: '/resources' },
    },
    '/resources',
    sp,
    page,
    resources.length,
    12,
  );
}

interface SP {
  q?: string;
  type?: string;
  country?: string;
  language?: string;
  tag?: string;
  sort?: string;
  view?: string;
  page?: string;
  [key: string]: string | undefined;
}

// 将资源 trafficLevel（混合「高/中」与「X万/月」）归一为可比较的热度分，用于排序
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

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const query = {
    q: sp.q,
    type: sp.type,
    country: sp.country,
    language: sp.language,
    tag: sp.tag,
  };
  const raw = await getResources(query).catch(() => []);

  // 排序（导航站常见：精选优先 / 流量优先 / 名称 A-Z / 最新收录）
  const resources =
    sp.sort === 'traffic'
      ? [...raw].sort((a, b) => trafficScore(b.trafficLevel) - trafficScore(a.trafficLevel))
      : sp.sort === 'name'
        ? [...raw].sort((a, b) => a.name.localeCompare(b.name))
        : sp.sort === 'featured'
          ? [...raw].sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
          : sp.sort === 'newest'
            ? [...raw].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
            : raw;

  const page = Number(sp.page) || 1;
  const { pageItems, totalPages } = paginate(resources, page, 12);

  // 国家 / 语言选项从数据派生（用于筛选器下拉）
  const countries = Array.from(
    new Set(resources.map((r) => r.country).filter((c): c is string => !!c)),
  ).sort();
  const languages = Array.from(
    new Set(resources.map((r) => r.language).filter((c): c is string => !!c)),
  ).sort();

  // 类型分面计数（用于筛选器上展示每类数量）
  const typeCounts: Record<string, number> = {};
  for (const r of raw) typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '心理资源导航', url: '/resources' },
        ])}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>心理资源导航</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        聚合全球优质心理学网站，按类型、国家与语言筛选。点击任意卡片直达原站。
        （数据源自《全球心理学网站 TOP50 调研报告》）
      </p>

      <FilterPanel>
        <ResourceFilters countries={countries} languages={languages} typeCounts={typeCounts} />
      </FilterPanel>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>
          共 {resources.length} 个资源
          {sp.type || sp.country || sp.language || sp.tag || sp.q ? '（已按筛选条件）' : ''}
        </div>
        <ViewToggle />
      </div>

      {pageItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          没有匹配的资源。试试清除筛选条件，或使用顶部搜索。
        </div>
      ) : sp.view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pageItems.map((r) => {
            const meta = RESOURCE_TYPE_META[r.type] ?? { label: r.type, chip: '' };
            return (
              <div
                key={r.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, minWidth: 200, color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }}
                >
                  {r.name}
                </a>
                <span className={`chip ${meta.chip}`} style={{ flexShrink: 0 }}>
                  {meta.label}
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>
                  {[r.country, r.trafficLevel].filter(Boolean).join(' · ')}
                </span>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <CompareToggle id={r.id} name={r.name} />
                  <BookmarkButton
                    type="resource"
                    id={r.id}
                    title={r.name}
                    url={r.url}
                    subtitle={r.description ?? undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {pageItems.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}

      <Pager basePath="/resources" params={sp} page={page} totalPages={totalPages} />
      <CompareBar />
    </div>
  );
}
