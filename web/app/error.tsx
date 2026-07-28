'use client';

import { useEffect } from 'react';

// 全局错误边界：捕获渲染期异常，提供可访问的重试入口
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 生产环境可在此上报监控（Sentry 等）
    console.error(error);
  }, [error]);

  return (
    <div
      className="container-page"
      role="alert"
      style={{
        padding: '64px 20px',
        textAlign: 'center',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>页面出了一点问题</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
        内容加载失败，可能是网络波动。你可以重试，或返回首页继续浏览。
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => reset()} style={{ cursor: 'pointer' }}>
          重试
        </button>
        <a className="btn-primary" href="/" style={{ background: 'var(--muted)' }}>
          返回首页
        </a>
      </div>
    </div>
  );
}
