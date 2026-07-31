'use client';

import { useState, type ReactNode } from 'react';

/**
 * 筛选面板：桌面端直接展开；移动端（≤768px）收起为「筛选」按钮，点击展开为抽屉式面板。
 * 通过全局 CSS（.filter-panel / .filter-panel__content）控制显示，避免内联样式覆盖媒体查询。
 */
export default function FilterPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`filter-panel${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="filter-panel__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          alignItems: 'center',
          gap: 6,
          height: 40,
          padding: '0 14px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          background: 'var(--brand)',
          color: 'var(--btn-text)',
          fontSize: 14,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        筛选 {open ? '▲' : '▼'}
      </button>
      <div className="filter-panel__content">{children}</div>
    </div>
  );
}
