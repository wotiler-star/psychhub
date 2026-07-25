import type { Resource } from '@/lib/types';
import { RESOURCE_TYPE_META } from '@/lib/format';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const meta = RESOURCE_TYPE_META[resource.type] ?? { label: resource.type, chip: '' };
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card"
      style={{ display: 'block', color: 'var(--ink)', textDecoration: 'none' }}
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
          <span key={t} className="chip" style={{ background: '#f1f5f9', color: 'var(--muted)' }}>
            {t}
          </span>
        ))}
      </div>
    </a>
  );
}
