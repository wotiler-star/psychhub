import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 48,
        borderTop: '1px solid var(--line)',
        background: 'var(--card)',
      }}
    >
      <div
        className="container-page"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'space-between',
          padding: '32px 20px',
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>心理资源聚合</div>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            中文心理学资源导航与科普平台。我们聚合全球优质心理资源、公益求助渠道与公开版权测评，
            帮助你在 3 次点击内找到所需。本平台不提供在线诊疗服务。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>导航</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link href="/resources" style={{ color: 'var(--muted)', fontSize: 14 }}>资源导航</Link>
              <Link href="/assessments" style={{ color: 'var(--muted)', fontSize: 14 }}>心理测评</Link>
              <Link href="/helplines" style={{ color: 'var(--muted)', fontSize: 14 }}>求助资源</Link>
              <Link href="/about" style={{ color: 'var(--muted)', fontSize: 14 }}>关于我们</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>法律</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link href="/privacy" style={{ color: 'var(--muted)', fontSize: 14 }}>隐私政策</Link>
              <a href="/helplines" style={{ color: 'var(--muted)', fontSize: 14 }}>危机求助</a>
            </div>
          </div>
        </div>
      </div>
      <div
        className="container-page"
        style={{
          color: 'var(--muted)',
          fontSize: 13,
          padding: '16px 20px',
          borderTop: '1px solid var(--line)',
        }}
      >
        © {new Date().getFullYear()} 心理资源聚合 · 本平台内容仅供信息参考，不构成任何医疗诊断或治疗建议。
      </div>
    </footer>
  );
}
