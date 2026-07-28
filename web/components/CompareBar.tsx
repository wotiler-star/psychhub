'use client';

import Link from 'next/link';
import { useCompare } from '@/lib/compare';

/** 底部浮动对比条：已选 >=1 时出现，>=2 可进入对比页 */
export default function CompareBar() {
  const { ids, clear } = useCompare();
  if (ids.length === 0) return null;

  const canCompare = ids.length >= 2;

  return (
    <div
      role="region"
      aria-label="资源对比栏"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 20,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 18px',
        borderRadius: 999,
        background: 'var(--card)',
        border: '1px solid var(--brand)',
        boxShadow: '0 8px 24px rgba(0,0,0,.18)',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
        已选 {ids.length}/4 个资源
      </span>
      {canCompare ? (
        <Link
          href={`/compare?ids=${ids.join(',')}`}
          className="btn-primary"
          style={{ height: 36, display: 'inline-flex', alignItems: 'center', padding: '0 16px', fontSize: 14, borderRadius: 999, textDecoration: 'none' }}
        >
          开始对比 →
        </Link>
      ) : (
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>再选 1 个即可对比</span>
      )}
      <button
        type="button"
        onClick={clear}
        aria-label="清空对比列表"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--muted)',
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: 4,
        }}
      >
        清空
      </button>
    </div>
  );
}
