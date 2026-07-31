import Link from 'next/link';

export interface Crumb {
  name: string;
  href: string;
}

/**
 * 可见面包屑导航（与服务端注入的 BreadcrumbList JSON-LD 互为表里）。
 * 服务端组件，可直接在页面 JSX 内使用。
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="面包屑导航" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
      <ol
        style={{
          listStyle: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: 0,
          margin: 0,
          alignItems: 'center',
        }}
      >
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={it.href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {last ? (
                <span aria-current="page" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  {it.name}
                </span>
              ) : (
                <Link href={it.href} style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                  {it.name}
                </Link>
              )}
              {!last && (
                <span aria-hidden="true" style={{ color: 'var(--line)' }}>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
