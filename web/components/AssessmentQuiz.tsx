'use client';

import { useState } from 'react';
import type { AssessmentQuestion, AssessmentBand } from '@/lib/types';
import { saveAssessmentRecord } from '@/lib/assessmentHistory';

interface Props {
  questions: AssessmentQuestion[];
  bands: AssessmentBand[];
  assessmentSlug: string;
  assessmentTitle: string;
}

export default function AssessmentQuiz({
  questions,
  bands,
  assessmentSlug,
  assessmentTitle,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = questions.reduce((s, q) => {
    const raw = answers[q.id] ?? 0;
    // 反向计分题：当前档位为 0-3，实际得分 = 3 - 原得分
    const sc = q.reverse ? 3 - raw : raw;
    return s + sc;
  }, 0);
  const answeredCount = Object.keys(answers).length;

  const band =
    submitted
      ? bands.find((b) => total <= b.max) ?? bands[bands.length - 1]
      : null;

  function choose(qid: string, score: number) {
    setAnswers((prev) => ({ ...prev, [qid]: score }));
  }

  function submit() {
    const b = bands.find((x) => total <= x.max) ?? bands[bands.length - 1];
    setSubmitted(true);
    saveAssessmentRecord({
      slug: assessmentSlug,
      title: assessmentTitle,
      total,
      level: b.level,
      advice: b.advice,
    });
    setSaved(true);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setSaved(false);
  }

  return (
    <div>
      <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {questions.map((q, i) => (
          <li key={q.id} className="card">
            <p style={{ fontWeight: 700, margin: '0 0 12px', fontSize: 16 }}>
              {i + 1}. {q.text}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((o) => {
                const checked = answers[q.id] === o.score;
                return (
                  <label
                    key={o.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      border: `1px solid ${checked ? 'var(--brand)' : 'var(--line)'}`,
                      borderRadius: 10,
                      background: checked ? 'var(--chip-bg)' : 'var(--bg)',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() => choose(q.id, o.score)}
                      style={{ width: 18, height: 18, accentColor: 'var(--brand)' }}
                    />
                    <span style={{ fontSize: 15 }}>{o.label}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {!submitted && (
          <button
            onClick={submit}
            disabled={answeredCount < questions.length}
            className="btn-primary"
            style={{ fontSize: 16, opacity: answeredCount < questions.length ? 0.5 : 1, cursor: answeredCount < questions.length ? 'not-allowed' : 'pointer' }}
          >
            查看结果
          </button>
        )}
        {submitted && (
          <button onClick={reset} style={{ height: 44, padding: '0 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer' }}>
            重新测试
          </button>
        )}
        {answeredCount < questions.length && !submitted && (
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>已完成 {answeredCount}/{questions.length}</span>
        )}
        {saved && (
          <span style={{ color: 'var(--alert-success-ink)', fontSize: 14, fontWeight: 600 }}>
            ✓ 已保存到「我的测评」
          </span>
        )}
      </div>

      {submitted && band && (
        <div className="card" style={{ marginTop: 24, borderColor: 'var(--brand)', background: 'var(--surface-3)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>总分</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand)' }}>{total}</span>
            <span className="chip chip-green" style={{ fontSize: 14 }}>{band.level}</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.7, margin: '12px 0 0' }}>{band.advice}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12, lineHeight: 1.7 }}>
            ⚠ 本结果由公共领域 / 授权量表自动计分，<strong>仅供自我觉察参考，不构成医学诊断</strong>。
            若你或他人存在自伤风险，请立即联系
            <a href="/helplines" style={{ color: 'var(--danger)' }}>危机求助热线</a>。
          </p>
        </div>
      )}
    </div>
  );
}
