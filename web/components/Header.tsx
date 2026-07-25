'use client';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

// 主导航：一级栏目 ≤ 7（原则 R2.1：米勒法则），全部能回链业务目标
const NAV = [
  { href: '/', label: '首页' },
  { href: '/resources', label: '资源导航' },
  { href: '/assessments', label: '心理测评' },
  { href: '/helplines', label: '求助资源' },
  { href: '/articles', label: '心理资讯' },
  { href: '/counselors', label: '找咨询师' },
  { href: '/community', label: '社区' },
];

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--card)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        className="container-page"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 800,
            fontSize: 18,
            color: 'var(--ink)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--brand)',
              color: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
            }}
          >
            心
          </span>
          心理资源聚合
        </Link>
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                color: 'var(--muted)',
                fontSize: 15,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {n.label}
            </Link>
          ))}
          {!loading && user ? (
            <>
              <Link
                href="/account"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  color: 'var(--ink)',
                  fontSize: 15,
                  minHeight: 44,
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontWeight: 600,
                }}
              >
                我的
              </Link>
              <button
                onClick={() => logout()}
                className="chip"
                style={{
                  cursor: 'pointer',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  marginLeft: 4,
                  minHeight: 36,
                  padding: '0 12px',
                }}
              >
                退出
              </button>
            </>
          ) : !loading ? (
            <Link className="btn-primary" href="/login" style={{ marginLeft: 6 }}>
              登录
            </Link>
          ) : null}
          <a className="btn-primary" href="/helplines" style={{ marginLeft: 6 }}>
            需要帮助？
          </a>
        </nav>
      </div>
    </header>
  );
}
