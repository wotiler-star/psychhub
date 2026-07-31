'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function btnStyle(active: boolean): React.CSSProperties {
  return {
    width: 38,
    height: 38,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    fontFamily: 'inherit',
    background: active ? 'var(--brand)' : 'var(--card)',
    color: active ? 'var(--btn-text)' : 'var(--ink)',
  };
}

/** 网格 ⇄ 列表视图切换（通过 URL ?view=list|grid 持久化，SSR 友好） */
export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const view = sp.get('view') === 'list' ? 'list' : 'grid';

  function set(v: 'grid' | 'list') {
    const params = new URLSearchParams(sp.toString());
    if (v === 'grid') params.delete('view');
    else params.set('view', v);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div
      role="group"
      aria-label="视图切换"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--line)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        aria-pressed={view === 'grid'}
        aria-label="网格视图"
        title="网格视图"
        onClick={() => set('grid')}
        style={btnStyle(view === 'grid')}
      >
        ▦
      </button>
      <button
        type="button"
        aria-pressed={view === 'list'}
        aria-label="列表视图"
        title="列表视图"
        onClick={() => set('list')}
        style={btnStyle(view === 'list')}
      >
        ☰
      </button>
    </div>
  );
}
