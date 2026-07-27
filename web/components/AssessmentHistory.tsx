'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getAssessmentHistory,
  clearAssessmentHistory,
  type AssessmentRecord,
} from '@/lib/assessmentHistory';

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export default function AssessmentHistory() {
  const [list, setList] = useState<AssessmentRecord[] | null>(null);

  useEffect(() => {
    setList(getAssessmentHistory());
  }, []);

  function handleClear() {
    clearAssessmentHistory();
    setList([]);
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h2 style={{ fontSize: 18, marginTop: 28 }}>我的测评历史</h2>
        {list && list.length > 0 && (
          <button
            onClick={handleClear}
            className="chip"
            style={{
              cursor: 'pointer',
              border: '1px solid var(--line)',
              background: 'var(--card)',
              minHeight: 36,
              padding: '0 12px',
            }}
          >
            清除记录
          </button>
        )}
      </div>

      {list === null ? (
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>加载中…</p>
      ) : list.length === 0 ? (
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>
          你还没有完成任何测评。<Link href="/assessments">去做一个测评</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {list.map((r) => (
            <div className="card" key={r.id} style={{ padding: '16px 18px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href={`/assessments/${r.slug}`}
                  style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', textDecoration: 'none' }}
                >
                  {r.title}
                </Link>
                <span className="chip chip-green" style={{ fontSize: 13 }}>{r.level}</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--brand)' }}>总分 {r.total}</strong>
                <span style={{ marginLeft: 10 }}>完成于 {fmtDateTime(r.completedAt)}</span>
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.7 }}>{r.advice}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
