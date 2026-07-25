'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 6,
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid var(--line)',
  fontSize: 15,
  fontFamily: 'inherit',
  background: 'var(--bg)',
  color: 'var(--ink)',
};

function LoginInner() {
  const { login, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login({ email, password });
      router.push(redirect);
    } catch (e: any) {
      setErr(e?.message || '登录失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="container-page" style={{ padding: '40px 20px', maxWidth: 460, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>
          你已登录为 {user.name}（{user.email}）
        </p>
        <Link className="btn-primary" href="/account">
          前往我的账号
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page" style={{ padding: '40px 20px', maxWidth: 460 }}>
      <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>登录</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>
        生产环境已接入 NestJS + Auth（PostgreSQL 持久化）。
        演示账号：demo@psychhub.cn / demo1234。
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ fontSize: 14 }}>
          邮箱
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 14 }}>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="演示账号：demo@psychhub.cn / demo1234"
            style={inputStyle}
          />
        </label>
        {err && (
          <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{err}</p>
        )}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? '登录中…' : '登录'}
        </button>
      </form>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 16 }}>
        还没有账号？<Link href="/register">立即注册</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page" style={{ padding: '40px 20px' }}>
          加载中…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
