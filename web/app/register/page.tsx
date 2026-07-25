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

function RegisterInner() {
  const { register, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/account';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await register({ name, email, password });
      router.push(redirect);
    } catch (e: any) {
      setErr(e?.message || '注册失败，请重试');
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
      <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>注册</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>
        创建账号（写入 PostgreSQL，持久保存），可立即发表咨询师评价。
        演示账号：demo@psychhub.cn / demo1234。
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ fontSize: 14 }}>
          昵称
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="希望被怎么称呼"
            style={inputStyle}
          />
        </label>
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
            placeholder="任意字符即可（演示）"
            style={inputStyle}
          />
        </label>
        {err && (
          <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{err}</p>
        )}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? '注册中…' : '注册并登录'}
        </button>
      </form>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 16 }}>
        已有账号？<Link href="/login">去登录</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page" style={{ padding: '40px 20px' }}>
          加载中…
        </div>
      }
    >
      <RegisterInner />
    </Suspense>
  );
}
