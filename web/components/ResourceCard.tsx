import type { Resource } from '@/lib/types';
import { RESOURCE_TYPE_META } from '@/lib/format';
import BookmarkButton from '@/components/BookmarkButton';
import CompareToggle from '@/components/CompareToggle';
import Link from 'next/link';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const meta = RESOURCE_TYPE_META[resource.type] ?? { label: resource.type, chip: '' };
  return (
    <div className="card" style={{ position: 'relative', display: 'block' }}>
      <Link
        href={`/resources/${resource.id}`}
        style={{ display: 'block', color: 'var(--ink)', textDecoration: 'none', paddingRight: 44 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{resource.name}</h3>
          {meta.label && <span className={`chip ${meta.chip}`}>{meta.label}</span>}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0', lineHeight: 1.7 }}>
          {resource.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {resource.country && <span style={{ fontSize: 12, color: 'var(--muted)' }}>🌍 {resource.country}</span>}
          {resource.trafficLevel && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>📈 {resource.trafficLevel}</span>
          )}
          {resource.tags?.slice(0, 3).map((t) => (
            <span key={t} className="chip" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              {t}
            </span>
          ))}
        </div>
      </Link>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ minHeight: 36, padding: '0 14px', fontSize: 14 }}
        >
          访问官网 ↗
        </a>
        <CompareToggle id={resource.id} name={resource.name} />
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <BookmarkButton
          type="resource"
          id={resource.id}
          title={resource.name}
          url={resource.url}
          subtitle={resource.description ?? undefined}
        />
      </div>
    </div>
  );
}
