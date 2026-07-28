import type { Metadata } from 'next';
import Link from 'next/link';
import { getResources } from '@/lib/api';
import type { Resource } from '@/lib/types';
import { RESOURCE_TYPE_META } from '@/lib/format';
import { breadcrumbJsonLd, JsonLdScript } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '资源对比 | 心理服务平台横向对比',
  description: '多维度横向对比心理健康平台：类型、地区、语言、适用人群、热度与标签，帮你快速选出合适的服务。',
  robots: { index: false, follow: true },
  alternates: { canonical: '/compare' },
};

interface SP {
  ids?: string;
  [key: string]: string | undefined;
}

const ROWS: { key: string; label: string; render: (r: Resource) => string }[] = [
  { key: 'type', label: '类型', render: (r) => RESOURCE_TYPE_META[r.type]?.label ?? r.type },
  { key: 'country', label: '国家/地区', render: (r) => r.country ?? '—' },
  { key: 'language', label: '语言', render: (r) => r.language ?? '—' },
  { key: 'suitableFor', label: '适用人群', render: (r) => r.suitableFor ?? '—' },
  { key: 'trafficLevel', label: '热度', render: (r) => r.trafficLevel ?? '—' },
  { key: 'tags', label: '标签', render: (r) => (r.tags.length ? r.tags.join('、') : '—') },
  { key: 'featured', label: '编辑精选', render: (r) => (r.featured ? '✓ 是' : '—') },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const ids = (sp.ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const all = await getResources().catch(() => [] as Resource[]);
  const items = ids
    .map((id) => all.find((r) => r.id === id))
    .filter((r): r is Resource => !!r);

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '心理资源导航', url: '/resources' },
          { name: '资源对比', url: '/compare' },
        ])}
      />
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>资源对比</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 24px', lineHeight: 1.7 }}>
        横向对比 2–4 个心理服务平台的关键维度。信息来自公开资料整理，选择前请以平台官网为准。
      </p>

      {items.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: 16, margin: '0 0 8px' }}>
            {items.length === 0 ? '还没有选择要对比的资源' : '至少需要选择 2 个资源才能对比'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>
            去资源导航页，点击卡片上的「+ 对比」按钮选择 2–4 个平台。
          </p>
          <Link href="/resources" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 22px', textDecoration: 'none' }}>
            去挑选资源 →
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: 640,
              borderCollapse: 'separate',
              borderSpacing: 0,
              border: '1px solid var(--line)',
              borderRadius: 14,
              overflow: 'hidden',
              background: 'var(--card)',
            }}
          >
            <thead>
              <tr>
                <th style={{ ...cellTh, width: 110, textAlign: 'left' }}>维度</th>
                {items.map((r) => (
                  <th key={r.id} style={cellTh}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{r.name}</div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 500 }}
                    >
                      访问官网 ↗
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellTd, fontWeight: 700 }}>简介</td>
                {items.map((r) => (
                  <td key={r.id} style={{ ...cellTd, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {r.description ?? '—'}
                  </td>
                ))}
              </tr>
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <td style={{ ...cellTd, fontWeight: 700 }}>{row.label}</td>
                  {items.map((r) => (
                    <td key={r.id} style={cellTd}>
                      {row.render(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 20, lineHeight: 1.7 }}>
        ⚠ 本对比仅为信息聚合参考，不构成任何诊疗或消费建议。价格与服务可能变动，请以各平台官网实时信息为准。
      </p>
    </div>
  );
}

const cellTh: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--line)',
  background: 'var(--surface-2)',
  textAlign: 'left',
  verticalAlign: 'top',
};

const cellTd: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--line)',
  fontSize: 14,
  verticalAlign: 'top',
};
