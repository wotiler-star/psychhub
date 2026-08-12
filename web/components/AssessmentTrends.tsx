'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAssessmentHistory, type AssessmentRecord } from '@/lib/assessmentHistory';

interface Props {
  slug: string;
}

// 测评结果趋势：复用本地测评历史（assessmentHistory），展示同一量表的多次复测走势，
// 把「测一次」变成「可追踪」的闭环（测评 → 结果 → 复测 → 对比）。
export default function AssessmentTrends({ slug }: Props) {
  const [records, setRecords] = useState<AssessmentRecord[] | null>(null);

  useEffect(() => {
    const mine = getAssessmentHistory()
      .filter((r) => r.slug === slug)
      .sort((a, b) => String(a.completedAt).localeCompare(String(b.completedAt)));
    setRecords(mine);
  }, [slug]);

  if (records === null) return null; // 首屏未读取完
  if (records.length === 0) return null; // 尚未测过，不渲染

  const scores = records.map((r) => r.total);
  const maxScore = Math.max(...scores, 1);
  const scaleMax = Math.ceil(maxScore * 1.15);
  const W = 240;
  const H = 64;
  const pad = 10;
  const n = records.length;
  const xAt = (i: number) => (n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1));
  const yAt = (s: number) => H - pad - (s / scaleMax) * (H - 2 * pad);
  const points = scores.map((s, i) => `${xAt(i).toFixed(1)},${yAt(s).toFixed(1)}`).join(' ');

  return (
    <section className="card" style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>你的测评趋势</h2>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>已完成 {records.length} 次 · 本地记录</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="测评分数走势图"
          style={{ display: 'block', maxWidth: W, height: 'auto' }}
        >
          <polyline
            points={points}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {scores.map((s, i) => (
            <circle key={i} cx={xAt(i)} cy={yAt(s)} r={3.2} fill="var(--brand)" />
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          <span>首次 {scores[0]} 分</span>
          <span>最近 {scores[n - 1]} 分</span>
        </div>
      </div>

      <ol style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {records
          .slice()
          .reverse()
          .map((r) => (
            <li
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                padding: '8px 10px',
                background: 'var(--surface-2)',
                borderRadius: 8,
              }}
            >
              <span style={{ color: 'var(--muted)', fontSize: 12, minWidth: 92 }}>
                {new Date(r.completedAt).toLocaleDateString('zh-CN')}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--brand)', minWidth: 48 }}>{r.total} 分</span>
              <span className="chip chip-green" style={{ fontSize: 12 }}>
                {r.level}
              </span>
            </li>
          ))}
      </ol>

      <div style={{ marginTop: 14 }}>
        <Link
          href={`/assessments/${slug}`}
          className="chip"
          style={{ background: 'var(--brand)', color: 'var(--btn-text)', textDecoration: 'none' }}
        >
          重新测评 / 对比 →
        </Link>
      </div>
    </section>
  );
}
