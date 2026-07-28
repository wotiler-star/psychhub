'use client';

import { useEffect, useRef, useState } from 'react';
import type { AssessmentQuestion, AssessmentBand } from '@/lib/types';
import { saveAssessmentRecord } from '@/lib/assessmentHistory';

interface Props {
  questions: AssessmentQuestion[];
  bands: AssessmentBand[];
  assessmentSlug: string;
  assessmentTitle: string;
}

type Mode = 'step' | 'full';

export default function AssessmentQuiz({
  questions,
  bands,
  assessmentSlug,
  assessmentTitle,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<Mode>('step');
  const [current, setCurrent] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const total = questions.reduce((s, q) => {
    const raw = answers[q.id] ?? 0;
    // 反向计分题：当前档位为 0-3，实际得分 = 3 - 原得分
    const sc = q.reverse ? 3 - raw : raw;
    return s + sc;
  }, 0);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= questions.length;

  const band = submitted
    ? bands.find((b) => total <= b.max) ?? bands[bands.length - 1]
    : null;

  useEffect(() => {
    if (submitted && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitted]);

  function choose(qid: string, score: number) {
    setAnswers((prev) => ({ ...prev, [qid]: score }));
    // 逐题模式：作答后自动前进
    if (mode === 'step') {
      const idx = questions.findIndex((q) => q.id === qid);
      if (idx >= 0 && idx < questions.length - 1) {
        window.setTimeout(() => setCurrent(idx + 1), 220);
      }
    }
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
    setCurrent(0);
  }

  const progressPct = Math.round((answeredCount / questions.length) * 100);

  const modeBtn = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: 'inherit',
        border: '1px solid transparent',
        background: mode === m ? 'var(--brand)' : 'var(--chip-bg)',
        color: mode === m ? 'var(--btn-text)' : 'var(--brand)',
        fontWeight: mode === m ? 700 : 500,
      }}
    >
      {label}
    </button>
  );

  const renderQuestion = (q: AssessmentQuestion, i: number) => (
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
  );

  return (
    <div>
      {/* 模式切换 + 进度 */}
      {!submitted && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            {modeBtn('step', '逐题作答')}
            {modeBtn('full', '整卷浏览')}
            <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>
              已完成 {answeredCount}/{questions.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="测评进度"
            style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: 999,
                background: 'var(--brand)',
                transition: 'width .25s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* 题目区 */}
      {!submitted && mode === 'step' && (
        <>
          <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
            {renderQuestion(questions[current], current)}
          </ol>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'var(--card)',
                color: current === 0 ? 'var(--muted)' : 'var(--ink)',
                cursor: current === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ← 上一题
            </button>
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              disabled={current >= questions.length - 1}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'var(--card)',
                color: current >= questions.length - 1 ? 'var(--muted)' : 'var(--ink)',
                cursor: current >= questions.length - 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              下一题 →
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              第 {current + 1} / {questions.length} 题
            </span>
          </div>
        </>
      )}

      {!submitted && mode === 'full' && (
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {questions.map((q, i) => renderQuestion(q, i))}
        </ol>
      )}

      {/* 操作区 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {!submitted && (
          <button
            onClick={submit}
            disabled={!allAnswered}
            className="btn-primary"
            style={{ fontSize: 16, opacity: !allAnswered ? 0.5 : 1, cursor: !allAnswered ? 'not-allowed' : 'pointer' }}
          >
            查看结果
          </button>
        )}
        {submitted && (
          <button onClick={reset} style={{ height: 44, padding: '0 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
            重新测试
          </button>
        )}
        {saved && (
          <span style={{ color: 'var(--alert-success-ink)', fontSize: 14, fontWeight: 600 }}>
            ✓ 已保存到「我的测评」
          </span>
        )}
      </div>

      {submitted && band && (
        <div ref={resultRef} className="card" style={{ marginTop: 24, borderColor: 'var(--brand)', background: 'var(--surface-3)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>总分</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand)' }}>{total}</span>
            <span className="chip chip-green" style={{ fontSize: 14 }}>{band.level}</span>
          </div>
          {/* 分数在量表区间中的位置 */}
          <div style={{ margin: '14px 0 4px' }}>
            {(() => {
              const maxScore = bands[bands.length - 1]?.max ?? 27;
              const pct = Math.min(100, Math.round((total / maxScore) * 100));
              return (
                <div style={{ height: 10, borderRadius: 999, background: 'var(--surface-2)', position: 'relative' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'var(--brand)' }} />
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              <span>0</span>
              <span>{bands[bands.length - 1]?.max ?? ''}</span>
            </div>
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
