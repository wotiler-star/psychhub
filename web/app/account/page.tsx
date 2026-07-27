'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getReviews, getMySubmissions, type Submission } from '@/lib/api';
import type { Review } from '@/lib/types';
import AssessmentHistory from '@/components/AssessmentHistory';

const SUBMISSION_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: '待审核', bg: 'var(--chip-bg)', fg: 'var(--brand)' },
  approved: { label: '已收录', bg: 'var(--alert-success-bg)', fg: 'var(--alert-success-ink)' },
  rejected: { label: '未通过', bg: 'var(--alert-danger-bg)', fg: 'var(--alert-danger-ink)' },
};

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export default function AccountPage() {
  const { user, logout, loading } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);

  useEffect(() => {
    if (!user) {
      setReviews(null);
      setSubmissions(null);
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
    getMySubmissions(user.email)
      .then((s) => {
        if (alive) setSubmissions(s);
      })
      .catch(() => {
        if (alive) setSubmissions([]);
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
      <>
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

        {/* 测评历史为浏览器本地保存，无需登录即可回看 */}
        <AssessmentHistory />
      </>
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

      <h2 style={{ fontSize: 18, marginTop: 28 }}>我的收录提交</h2>
      {submissions && submissions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {submissions.map((s) => {
            const st = SUBMISSION_STATUS[s.status] || SUBMISSION_STATUS.pending;
            return (
              <div className="card" key={s.id} style={{ padding: '16px 18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</span>
                    <span className="chip" style={{ background: 'var(--chip-bg)', color: 'var(--brand)' }}>
                      {s.kind === 'counselor' ? '咨询师' : '资源'}
                    </span>
                  </div>
                  <span
                    style={{
                      background: st.bg,
                      color: st.fg,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                    }}
                  >
                    {st.label}
                  </span>
                </div>
                {s.description && (
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{s.description}</p>
                )}
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
                      {s.url}
                    </a>
                  )}
                  <span style={{ marginLeft: 12 }}>提交于 {fmtDate(s.submittedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: 'var(--muted)' }}>你还没有提交过站点收录。</p>
          <Link className="btn-primary" href="/submit">
            提交新站点
          </Link>
        </div>
      )}

      {/* 测评历史为浏览器本地保存，无需登录即可回看 */}
      <AssessmentHistory />
    </div>
  );
}
