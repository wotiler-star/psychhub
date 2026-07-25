'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { postReview } from '@/lib/api';

const STARS = [5, 4, 3, 2, 1];

export default function ReviewForm({ counselorId }: { counselorId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!user) {
      router.push(`/login?redirect=/counselors/${counselorId}`);
      return;
    }
    setBusy(true);
    try {
      await postReview({ counselorId, rating, content });
      setContent('');
      setRating(5);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || '提交失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="card" style={{ marginTop: 28, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', margin: '0 0 12px' }}>
          登录后即可发表你对这位咨询师的评价
        </p>
        <Link className="btn-primary" href={`/login?redirect=/counselors/${counselorId}`}>
          登录 / 注册
        </Link>
      </div>
    );
  }

  return (
    <form className="card" style={{ marginTop: 28 }} onSubmit={submit}>
      <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>发表评价</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>评分</span>
        {STARS.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setRating(s)}
            aria-label={`${s} 星`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              color: s <= rating ? 'var(--warn)' : 'var(--line)',
              lineHeight: 1,
            }}
          >
            ★
          </button>
        ))}
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>{rating} 分</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="分享你的体验（至少 5 个字），帮助更多人做选择"
        rows={4}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 10,
          border: '1px solid var(--line)',
          padding: '12px 14px',
          fontSize: 15,
          fontFamily: 'inherit',
          resize: 'vertical',
          background: 'var(--bg)',
          color: 'var(--ink)',
        }}
      />
      {err && <p style={{ color: 'var(--danger)', fontSize: 14, margin: '8px 0 0' }}>{err}</p>}
      <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 12 }}>
        {busy ? '提交中…' : '提交评价'}
      </button>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 0' }}>
        请基于真实体验客观评价，禁止人身攻击与广告。评价内容由平台展示，仅供参考。
      </p>
    </form>
  );
}
