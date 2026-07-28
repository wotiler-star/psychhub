import Link from 'next/link';

interface PagerProps {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}

export default function Pager({ basePath, params, page, totalPages }: PagerProps) {
  if (totalPages <= 1) return null;

  const url = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && k !== 'page') sp.set(k, v);
    });
    sp.set('page', String(p));
    return `${basePath}?${sp.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav
      aria-label="分页导航"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        margin: '28px 0',
        flexWrap: 'wrap',
      }}
    >
      {page > 1 && (
        <Link className="chip" href={url(page - 1)} rel="prev" style={{ textDecoration: 'none' }}>
          ← 上一页
        </Link>
      )}
      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            {gap && <span style={{ color: 'var(--muted)' }}>…</span>}
            {p === page ? (
              <span className="chip" style={{ background: 'var(--brand)', color: 'var(--btn-text)' }}>
                {p}
              </span>
            ) : (
              <Link
                className="chip"
                href={url(p)}
                style={{ textDecoration: 'none', background: 'var(--surface-2)', color: 'var(--muted)' }}
              >
                {p}
              </Link>
            )}
          </span>
        );
      })}
      {page < totalPages && (
        <Link className="chip" href={url(page + 1)} rel="next" style={{ textDecoration: 'none' }}>
          下一页 →
        </Link>
      )}
    </nav>
  );
}
