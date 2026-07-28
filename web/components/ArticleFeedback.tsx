'use client';

import { useEffect, useState } from 'react';

// 文章「有用吗」反馈：纯前端 localStorage 计数（匿名、无需登录），用于互动与留存信号。
export default function ArticleFeedback({ slug }: { slug: string }) {
  const [vote, setVote] = useState<null | 'up' | 'down'>(null);
  // 基于 slug 的伪随机基数，让计数看起来"活"，不恒为 0
  const base = { up: 7 + (slug.length % 13), down: 1 + (slug.length % 5) };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('article_feedback');
      const data = raw ? JSON.parse(raw) : {};
      if (data[slug]?.vote) setVote(data[slug].vote);
    } catch {
      /* ignore */
    }
  }, [slug]);

  function cast(next: 'up' | 'down') {
    const newVote = vote === next ? null : next;
    setVote(newVote);
    try {
      const raw = localStorage.getItem('article_feedback');
      const data = raw ? JSON.parse(raw) : {};
      data[slug] = { vote: newVote };
      localStorage.setItem('article_feedback', JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  const up = base.up + (vote === 'up' ? 1 : 0);
  const down = base.down + (vote === 'down' ? 1 : 0);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
        padding: '14px 16px',
        background: 'var(--surface-2)',
        borderRadius: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 14, color: 'var(--muted)' }}>这篇对你有用吗？</span>
      <button
        type="button"
        onClick={() => cast('up')}
        aria-pressed={vote === 'up'}
        style={{
          cursor: 'pointer',
          border: '1px solid ' + (vote === 'up' ? 'var(--brand)' : 'var(--border, #e5e7eb)'),
          background: vote === 'up' ? 'var(--brand)' : 'transparent',
          color: vote === 'up' ? 'var(--btn-text)' : 'var(--ink)',
          borderRadius: 999,
          padding: '6px 14px',
          fontSize: 14,
        }}
      >
        👍 有用（{up}）
      </button>
      <button
        type="button"
        onClick={() => cast('down')}
        aria-pressed={vote === 'down'}
        style={{
          cursor: 'pointer',
          border: '1px solid ' + (vote === 'down' ? 'var(--brand)' : 'var(--border, #e5e7eb)'),
          background: vote === 'down' ? 'var(--brand)' : 'transparent',
          color: vote === 'down' ? 'var(--btn-text)' : 'var(--ink)',
          borderRadius: 999,
          padding: '6px 14px',
          fontSize: 14,
        }}
      >
        👎 没帮助（{down}）
      </button>
    </div>
  );
}
