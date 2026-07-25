'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getReviews } from '@/lib/api';
import type { Review } from '@/lib/types';

export default function AccountPage() {
  const { user, logout, loading } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    if (!user) {
      setReviews(null);
      return;
    }
    let alive = true;
    getReviews(user.id)
      .then((r) => {
        if (alive) setReviews(r);
      })
      .catch(() => {
        if (alive) setReviews([]);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="container-page" style={{ padding: '40px 20px' }}>
        加载中…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="container-page"
        style={{ padding: '40px 20px', maxWidth: 460, textAlign: 'center' }}
      >
        <h1 style={{ fontSize: 24 }}>我的账号</h1>
        <p style={{ color: 'var(--muted)' }}>请先登录以查看你的信息与评价。</p>
        <Link className="btn-primary" href="/login">
          登录 / 注册
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 820 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>{user.name}</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>{user.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="chip"
          style={{
            cursor: 'pointer',
            border: '1px solid var(--line)',
            background: 'var(--card)',
            minHeight: 40,
            padding: '0 16px',
          }}
        >
          退出登录
        </button>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>我发表的评价</h2>
      {reviews && reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {reviews.map((r) => (
            <div className="card" key={r.id} style={{ padding: '16px 18px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--warn)' }}>
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </span>
                <Link href={`/counselors/${r.counselorId}`} style={{ fontSize: 14 }}>
                  {r.counselorName ?? '咨询师'} →
                </Link>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>{r.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>
          你还没有发表过评价。<Link href="/counselors">去找一位咨询师评价</Link>
        </p>
      )}
    </div>
  );
}
