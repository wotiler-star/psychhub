// 路由级加载骨架：提升导航感知性能（LCP 前先呈现稳定布局，避免布局抖动）
export default function Loading() {
  return (
    <div
      className="container-page"
      style={{
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 1120,
        margin: '0 auto',
      }}
      aria-busy="true"
      aria-live="polite"
      aria-label="加载中"
    >
      <div
        style={{
          width: 220,
          height: 28,
          borderRadius: 8,
          background: 'var(--surface-2)',
        }}
      />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 320,
              height: 120,
              borderRadius: 14,
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
