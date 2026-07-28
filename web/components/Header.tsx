'use client';
import { useState, useEffect } from 'react';
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const cur =
      (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    setTheme(cur);
  }, []);

  const toggleTheme = () => {
    const next: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch (_) {
      /* 隐私模式下忽略 */
    }
    setTheme(next);
  };

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
              color: 'var(--btn-text)',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
            }}
          >
            心
          </span>
          心理资源聚合
        </Link>
        <nav aria-label="主导航" style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
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
          {/* 全站搜索框（GET 跳转到 /search，SSR 友好） */}
          <form action="/search" method="get" style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}>
            <input
              name="q"
              placeholder="搜索…"
              aria-label="全站搜索"
              style={{
                minHeight: 36,
                width: 130,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                fontSize: 14,
                background: 'var(--card)',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </form>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            aria-label="打开命令面板"
            title="命令面板 (⌘K / Ctrl+K)"
            className="chip"
            style={{
              cursor: 'pointer',
              border: '1px solid var(--line)',
              background: 'var(--card)',
              marginLeft: 4,
              minHeight: 36,
              padding: '0 10px',
              fontSize: 14,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              color: 'var(--muted)',
            }}
          >
            ⌘K
          </button>
          <Link
            href="/saved"
            aria-label="我的收藏"
            title="我的收藏"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 36,
              minWidth: 36,
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--card)',
              color: 'var(--muted)',
              marginLeft: 4,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            ★
          </Link>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <Link
            href="/submit"
            style={{
              marginLeft: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--brand)',
              color: 'var(--brand)',
              fontSize: 15,
              fontWeight: 600,
              minHeight: 36,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            提交收录
          </Link>
          <a className="btn-primary" href="/helplines" style={{ marginLeft: 6 }}>
            需要帮助？
          </a>
        </nav>
      </div>
    </header>
  );
}
