import type { Metadata } from 'next';
import Link from 'next/link';
import { getAssessments } from '@/lib/api';
import Pager from '@/components/Pager';
import SearchBox from '@/components/SearchBox';
import EmptyState from '@/components/EmptyState';
import { breadcrumbJsonLd, itemListJsonLd, JsonLdScript } from '@/lib/jsonld';
import { paginate, withPagination } from '@/lib/paginate';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const assessments = await getAssessments({ q: sp.q, type: sp.type }).catch(() => []);
  return withPagination(
    {
      title: '心理测评 | PHQ-9 / GAD-7 免费自测',
      description:
        '使用公共领域权威量表（PHQ-9 抑郁、GAD-7 焦虑）进行免费自评，即时计分与分级解读。结果仅供参考，不构成诊断。',
      alternates: { canonical: '/assessments' },
    },
    '/assessments',
    sp,
    page,
    assessments.length,
    6,
  );
}

const TYPE_LABEL: Record<string, string> = {
  DEPRESSION: '抑郁筛查',
  ANXIETY: '焦虑筛查',
  STRESS: '压力感知',
  SELF_ESTEEM: '自尊水平',
  SLEEP: '睡眠状况',
  WELLBEING: '主观幸福感',
  PERSONALITY: '人格测评',
};

const TYPES = Object.keys(TYPE_LABEL);

interface SP {
  q?: string;
  type?: string;
  sort?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  const [all, list] = await Promise.all([
    getAssessments().catch(() => []),
    getAssessments({ q: sp.q, type: sp.type }).catch(() => []),
  ]);

  // 类型分面计数（基于全量）
  const typeCounts: Record<string, number> = {};
  for (const a of all) if (a.type) typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1;

  // 排序（服务端按 createdAt asc 返回，这里覆盖）
  const sort = sp.sort ?? '';
  const sorted = [...list].sort((a, b) => {
    if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
    if (sort === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  const { pageItems, totalPages } = paginate(sorted, page, 6);

  // 构造保留其它参数的链接
  const hrefWith = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (sp.q) params.set('q', sp.q);
    if (sp.type) params.set('type', sp.type);
    if (sp.sort) params.set('sort', sp.sort);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete('page');
    const qs = params.toString();
    return `/assessments${qs ? '?' + qs : ''}`;
  };

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '心理测评', url: '/assessments' },
        ])}
      />
      <JsonLdScript
        data={itemListJsonLd(
          list.map((a) => ({
            name: a.title,
            url: `/assessments/${a.slug}`,
            description: a.description ?? undefined,
          })),
        )}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>心理测评</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 20px', maxWidth: 680 }}>
        以下测评使用公共领域 / 授权公开的权威量表，全部免费、匿名、即时出分。
        <strong>结果仅供参考，不构成任何医疗诊断或治疗建议。</strong>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <SearchBox paramName="q" placeholder="搜索测评…" width={200} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            href={hrefWith({ type: undefined })}
            className="chip"
            style={{
              background: !sp.type ? 'var(--brand)' : 'var(--surface-2)',
              color: !sp.type ? 'var(--btn-text)' : 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            全部
          </Link>
          {TYPES.map((t) => (
            <Link
              key={t}
              href={hrefWith({ type: sp.type === t ? undefined : t })}
              className="chip"
              style={{
                background: sp.type === t ? 'var(--brand)' : 'var(--surface-2)',
                color: sp.type === t ? 'var(--btn-text)' : 'var(--muted)',
                textDecoration: 'none',
              }}
              title={`${TYPE_LABEL[t]}（${typeCounts[t] ?? 0}）`}
            >
              {TYPE_LABEL[t]}
              {typeCounts[t] != null && <span style={{ opacity: 0.7, marginLeft: 4, fontSize: 12 }}>({typeCounts[t]})</span>}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>排序：</span>
        {([
          { v: '', label: '默认' },
          { v: 'newest', label: '最新' },
          { v: 'title', label: '名称 A-Z' },
        ] as const).map((o) => (
          <Link
            key={o.v}
            href={hrefWith({ sort: o.v || undefined })}
            className="chip"
            style={{
              background: (sp.sort || '') === o.v ? 'var(--brand)' : 'var(--surface-2)',
              color: (sp.sort || '') === o.v ? 'var(--btn-text)' : 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="没有符合条件的测评" hint="试试清除筛选条件，或更换关键词。" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {pageItems.map((a) => (
            <Link key={a.id} href={`/assessments/${a.slug}`} className="card" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
              <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>
                {a.type ? (TYPE_LABEL[a.type] ?? a.type) : '测评'}
              </div>
              <h3 style={{ margin: '8px 0 6px', fontSize: 18 }}>{a.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px', lineHeight: 1.7 }}>{a.description}</p>
              <span className="chip chip-green">免费 · 匿名</span>
            </Link>
          ))}
        </div>
      )}

      <Pager basePath="/assessments" params={{ q: sp.q, type: sp.type, sort: sp.sort }} page={page} totalPages={totalPages} />
    </div>
  );
}
