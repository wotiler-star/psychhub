/**
 * 段级加载骨架：用于各子板块的 loading.tsx，在客户端路由切换（筛选/翻页）时
 * 提供内容占位，避免白屏。纯 CSS 动画，尊重 prefers-reduced-motion。
 */
export default function PageSkeleton({
  cards = 6,
  title = true,
}: {
  cards?: number;
  title?: boolean;
}) {
  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      {title && <div className="skel skel-title" style={{ width: 220, height: 28, marginBottom: 8 }} />}
      {title && <div className="skel" style={{ width: '60%', height: 16, marginBottom: 24 }} />}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skel" style={{ width: '50%', height: 16 }} />
            <div className="skel" style={{ width: '100%', height: 12 }} />
            <div className="skel" style={{ width: '90%', height: 12 }} />
            <div className="skel" style={{ width: '40%', height: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
