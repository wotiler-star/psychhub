import type { Metadata } from 'next';
import { getResources } from '@/lib/api';
import ResourceCard from '@/components/ResourceCard';
import ResourceFilters from '@/components/ResourceFilters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '资源导航 | 全球心理学网站目录',
  description:
    '按类型、国家、语言筛选全球优质心理学网站：内容媒体、执业 SaaS、在线咨询、公益组织、测评工具、冥想自助与学术教育资源。',
  alternates: { canonical: '/resources' },
};

interface SP {
  q?: string;
  type?: string;
  country?: string;
  language?: string;
  tag?: string;
  sort?: string;
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

  // 排序（导航站常见：流量优先 / 名称 A-Z）
  const resources =
    sp.sort === 'traffic'
      ? [...raw].sort((a, b) => trafficScore(b.trafficLevel) - trafficScore(a.trafficLevel))
      : sp.sort === 'name'
        ? [...raw].sort((a, b) => a.name.localeCompare(b.name))
        : raw;

  // 国家 / 语言选项从数据派生（用于筛选器下拉）
  const countries = Array.from(
    new Set(resources.map((r) => r.country).filter((c): c is string => !!c)),
  ).sort();
  const languages = Array.from(
    new Set(resources.map((r) => r.language).filter((c): c is string => !!c)),
  ).sort();

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>心理资源导航</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        聚合全球优质心理学网站，按类型、国家与语言筛选。点击任意卡片直达原站。
        （数据源自《全球心理学网站 TOP50 调研报告》）
      </p>

      <ResourceFilters countries={countries} languages={languages} />

      <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
        共 {resources.length} 个资源
        {sp.type || sp.country || sp.language || sp.tag || sp.q ? '（已按筛选条件）' : ''}
      </div>

      {resources.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          没有匹配的资源。试试清除筛选条件，或使用顶部搜索。
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
