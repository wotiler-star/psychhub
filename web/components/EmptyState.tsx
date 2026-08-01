import type { ReactNode } from 'react';

/**
 * 统一空状态组件：替代各页面内联的「暂无…」占位，保证文案与视觉一致。
 * 用法：<EmptyState title="没有匹配的资源" hint="试试清除筛选条件" />
 */
export default function EmptyState({
  title,
  hint,
  action,
  icon = '🔍',
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        color: 'var(--muted)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 32, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
      {hint && <div style={{ fontSize: 14, maxWidth: 420 }}>{hint}</div>}
      {action}
    </div>
  );
}
