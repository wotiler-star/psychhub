'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ViewedResource } from '@/components/ResourceViewTracker';

const KEY = 'psychhub:recent-resources';

// 资源导航页「最近浏览」侧栏（留存闭环）：读取本地最近浏览记录。
export default function RecentlyViewed({ limit = 6 }: { limit?: number }) {
  const [items, setItems] = useState<ViewedResource[] | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const list: ViewedResource[] = raw ? JSON.parse(raw) : [];
      setItems(list);
    } catch {
      setItems([]);
    }
  }, []);

  if (items === null) return null;
  if (items.length === 0) return null;

  const shown = items.slice(0, limit);

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>最近浏览</h2>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.removeItem(KEY);
            } catch {
              /* ignore */
            }
            setItems([]);
          }}
          style={{
            fontSize: 12,
            color: 'var(--muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          清空
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map((r) => (
          <li key={r.id}>
            <Link
              href={`/resources/${r.id}`}
              style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
            >
              {r.name}
            </Link>
            {r.subtitle && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {r.subtitle}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
