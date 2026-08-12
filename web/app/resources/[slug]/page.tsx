import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getResource, getResources } from '@/lib/api';
import type { Resource, ResourceType } from '@/lib/types';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';
import ResourceCard from '@/components/ResourceCard';
import ResourceSubNav from '@/components/ResourceSubNav';
import ResourceFilters from '@/components/ResourceFilters';
import FilterPanel from '@/components/FilterPanel';
import ViewToggle from '@/components/ViewToggle';
import CompareBar from '@/components/CompareBar';
import Breadcrumb from '@/components/Breadcrumb';
import BookmarkButton from '@/components/BookmarkButton';
import CompareToggle from '@/components/CompareToggle';
import Pager from '@/components/Pager';
import EmptyState from '@/components/EmptyState';
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  JsonLdScript,
} from '@/lib/jsonld';
import { paginate } from '@/lib/paginate';
import { sortResources } from '@/lib/resourceSort';

export const dynamic = 'force-dynamic';

interface SP {
  q?: string;
  country?: string;
  language?: string;
  tag?: string;
  sort?: string;
  page?: string;
  [key: string]: string | undefined;
}

// slug 是否命中某个资源类型（大小写不敏感）→ 视为子版块落地页
function resolveType(slug: string): ResourceType | null {
  const up = slug.toUpperCase();
  return (RESOURCE_TYPES as string[]).includes(up) ? (up as ResourceType) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const type = resolveType(slug);
  // 子版块落地页
  if (type) {
    const meta = RESOURCE_TYPE_META[type];
    return {
      title: `${meta.label} | 心理学资源导航`,
      description: meta.desc,
      alternates: { canonical: `/resources/${type.toLowerCase()}` },
      openGraph: {
        type: 'website',
        title: `${meta.label} | 心理学资源导航`,
        description: meta.desc,
      },
    };
  }
  // 资源详情
  try {
    const r = await getResource(slug);
    const meta = RESOURCE_TYPE_META[r.type] ?? { label: r.type };
    const desc =
      r.description ??
      `发现并访问「${r.name}」——一个${meta.label}类心理学资源${r.country ? `（${r.country}）` : ''}。`;
    return {
      title: `${r.name} | 资源导航`,
      description: desc,
      alternates: { canonical: `/resources/${r.id}` },
      openGraph: {
        type: 'article',
        title: r.name,
        description: desc,
      },
    };
  } catch {
    return { title: '资源未找到' };
  }
}

export default async function ResourceRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const type = resolveType(slug);
  if (type) return <SubBoard type={type} sp={sp} />;
  return <Detail slug={slug} />;
}

// ───────────────────────── 子版块落地页 ─────────────────────────
async function SubBoard({ type, sp }: { type: ResourceType; sp: SP }) {
  const meta = RESOURCE_TYPE_META[type];
  const all = await getResources({ type }).catch(() => [] as Resource[]);

  const ql = (sp.q || '').toLowerCase();
  const matchesText = (r: Resource) =>
    !ql ||
    r.name.toLowerCase().includes(ql) ||
    (r.description || '').toLowerCase().includes(ql) ||
    r.tags.some((t) => t.toLowerCase().includes(ql));

  // 子版块类型由路由固定，仅对国家/语言/标签/搜索做交叉筛选
  const raw = all.filter(
    (r) =>
      matchesText(r) &&
      (!sp.country || r.country === sp.country) &&
      (!sp.language || r.language === sp.language) &&
      (!sp.tag || r.tags.includes(sp.tag)),
  );

  const resources = sortResources(raw, sp.sort);

  const page = Number(sp.page) || 1;
  const { pageItems, totalPages } = paginate(resources, page, 12);
  const basePath = `/resources/${type.toLowerCase()}`;

  // 国家 / 语言 / 标签分面（从当前类型全量派生，便于交叉筛选计数）
  const countries = Array.from(
    new Set(raw.map((r) => r.country).filter((c): c is string => !!c)),
  ).sort();
  const languages = Array.from(
    new Set(raw.map((r) => r.language).filter((c): c is string => !!c)),
  ).sort();
  const tagCounts: Record<string, number> = {};
  for (const r of all) {
    if (!matchesText(r)) continue;
    if (sp.country && r.country !== sp.country) continue;
    if (sp.language && r.language !== sp.language) continue;
    for (const t of r.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }
  const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '资源导航', url: '/resources' },
          { name: meta.label, url: basePath },
        ])}
      />

      <Breadcrumb
        items={[
          { name: '首页', url: '/' },
          { name: '资源导航', url: '/resources' },
          { name: meta.label, url: basePath },
        ]}
      />

      <section style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 40, lineHeight: 1 }}>{meta.emoji}</div>
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>{meta.label}</h1>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
              共 {all.length} 个{meta.label}类资源
            </div>
          </div>
          <a
            href="/resources"
            className="chip"
            style={{ marginLeft: 'auto', textDecoration: 'none', color: 'var(--brand)' }}
          >
            查看全部资源 →
          </a>
        </div>
        <p
          style={{
            color: 'var(--ink)',
            fontSize: 15,
            lineHeight: 1.8,
            margin: '12px 0 0',
            maxWidth: 760,
          }}
        >
          {meta.desc}
        </p>
      </section>

      <ResourceSubNav active={type.toLowerCase()} />

      <FilterPanel>
        <ResourceFilters
          hideType
          countries={countries}
          languages={languages}
          tags={tags}
          tagCounts={tagCounts}
        />
      </FilterPanel>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '4px 0 16px',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>
          共 {resources.length} 个资源
          {sp.country || sp.language || sp.tag || sp.q ? '（已按筛选条件）' : ''}
        </div>
        <ViewToggle />
      </div>

      {pageItems.length === 0 ? (
        <EmptyState title="该子版块暂无匹配资源" hint="试试清除筛选条件，或到「提交收录」推荐优质站点。" />
      ) : sp.view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pageItems.map((r) => {
            const rmeta = RESOURCE_TYPE_META[r.type] ?? { label: r.type, chip: '' };
            return (
              <div
                key={r.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Link href={`/resources/${r.id}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }}>
                    {r.name}
                  </Link>
                  <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 8 }}>
                    {[r.country, r.trafficLevel].filter(Boolean).join(' · ')}
                    {' '}
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>
                      访问 ↗
                    </a>
                  </span>
                </div>
                <span className={`chip ${rmeta.chip}`} style={{ flexShrink: 0 }}>
                  {rmeta.label}
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

      <Pager basePath={basePath} params={sp} page={page} totalPages={totalPages} />

      {pageItems.length > 0 && (
        <JsonLdScript
          data={itemListJsonLd(
            pageItems.map((x) => ({
              name: x.name,
              url: `/resources/${x.id}`,
              description: x.description ?? undefined,
            })),
          )}
        />
      )}
      <CompareBar />
    </div>
  );
}

// ───────────────────────── 资源详情 ─────────────────────────
async function Detail({ slug }: { slug: string }) {
  let r: Resource;
  try {
    r = await getResource(slug);
  } catch {
    notFound();
  }

  const meta = RESOURCE_TYPE_META[r.type] ?? { label: r.type, chip: '' };

  let sameType = await getResources({ type: r.type }).catch(() => [] as Resource[]);
  let related = sameType
    .filter((x) => x.id !== r.id)
    .map((x) => ({
      x,
      score:
        x.tags.filter((t) => r.tags.includes(t)).length + (x.country === r.country ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((o) => o.x);
  if (related.length === 0) {
    const all = await getResources().catch(() => [] as Resource[]);
    related = all
      .filter((x) => x.id !== r.id)
      .slice(0, 4);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: r.name,
    description: r.description ?? undefined,
    url: r.url,
    category: meta.label,
    ...(r.tags?.length ? { keywords: r.tags.join(', ') } : {}),
    brand: { '@type': 'Brand', name: r.name },
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 920 }}>
      <Breadcrumb
        items={[
          { name: '首页', url: '/' },
          { name: '资源导航', url: '/resources' },
          { name: r.name, url: `/resources/${r.id}` },
        ]}
      />

      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginTop: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 28, margin: 0 }}>{r.name}</h1>
            {meta.label && <span className={`chip ${meta.chip}`}>{meta.label}</span>}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
            {[r.country, r.language, r.trafficLevel].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ minHeight: 44 }}
          >
            访问官网 ↗
          </a>
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

      {r.description && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>简介</h2>
          <p style={{ color: 'var(--ink)', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            {r.description}
          </p>
        </section>
      )}

      {r.tags && r.tags.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>标签</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {r.tags.map((t) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="chip"
                style={{
                  background: 'var(--surface-2)',
                  color: 'var(--muted)',
                  textDecoration: 'none',
                }}
              >
                {t}
              </Link>
            ))}
          </div>
        </section>
      )}

      {r.suitableFor && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>适合人群</h2>
          <p style={{ color: 'var(--ink)', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            {r.suitableFor}
          </p>
        </section>
      )}

      <div
        style={{
          marginTop: 28,
          borderLeft: '3px solid var(--brand)',
          background: 'var(--card)',
          padding: '16px 18px',
          borderRadius: 8,
        }}
      >
        <strong style={{ fontSize: 15 }}>关于本站收录</strong>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.7 }}>
          本平台仅聚合与展示第三方心理学资源链接，不对站外内容负责。若发现链接失效或内容不当，欢迎通过「提交收录」反馈。
        </p>
      </div>

      {related.length > 0 && (
        <section style={{ marginTop: 36, borderTop: '1px solid var(--line)', paddingTop: 24 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 16px' }}>相关资源</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {related.map((x) => (
              <ResourceCard key={x.id} resource={x} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '资源导航', url: '/resources' },
          { name: r.name, url: `/resources/${r.id}` },
        ])}
      />
      {related.length > 0 && (
        <JsonLdScript
          data={itemListJsonLd(
            related.map((x) => ({
              name: x.name,
              url: `/resources/${x.id}`,
              description: x.description ?? undefined,
            })),
          )}
        />
      )}
    </div>
  );
}
