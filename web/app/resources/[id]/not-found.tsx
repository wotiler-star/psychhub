import Link from 'next/link';

export default function ResourceNotFound() {
  return (
    <div className="container-page" style={{ padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔎</div>
      <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>未找到该资源</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
        该资源可能已被移除，或链接有误。
      </p>
      <Link className="btn-primary" href="/resources">
        返回资源导航
      </Link>
    </div>
  );
}
