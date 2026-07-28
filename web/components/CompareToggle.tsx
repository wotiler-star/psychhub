'use client';

import { useCompare } from '@/lib/compare';

/** 资源卡片上的「对比」勾选按钮 */
export default function CompareToggle({ id, name }: { id: string; name: string }) {
  const { has, toggle } = useCompare();
  const active = has(id);

  return (
    <button
      type="button"
      aria-label={active ? `将 ${name} 移出对比` : `将 ${name} 加入对比`}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const r = toggle(id);
        if (r === 'full') {
          window.alert('最多同时对比 4 个资源，请先移除一个');
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'inherit',
        border: `1px solid ${active ? 'var(--brand)' : 'var(--line)'}`,
        background: active ? 'var(--brand)' : 'var(--card)',
        color: active ? 'var(--btn-text)' : 'var(--muted)',
        fontWeight: active ? 700 : 500,
      }}
    >
      {active ? '✓ 已加入对比' : '+ 对比'}
    </button>
  );
}
