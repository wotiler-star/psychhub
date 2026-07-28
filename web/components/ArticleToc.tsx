'use client';

import { useEffect, useState } from 'react';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export default function ArticleToc({ headings }: { headings: TocHeading[] }) {
  const [active, setActive] = useState<string>(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="文章目录" className="card" style={{ margin: '16px 0 24px', padding: '14px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>本文目录</div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? 14 : 0 }}>
            <a
              href={`#${h.id}`}
              style={{
                fontSize: 14,
                color: active === h.id ? 'var(--brand)' : 'var(--muted)',
                fontWeight: active === h.id ? 600 : 400,
                textDecoration: 'none',
                borderLeft: active === h.id ? '2px solid var(--brand)' : '2px solid transparent',
                paddingLeft: 8,
                lineHeight: 1.4,
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
