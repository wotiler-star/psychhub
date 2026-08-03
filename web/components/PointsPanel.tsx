'use client';
import { useState } from 'react';
import { useMembership, type MembershipState } from '@/lib/membership';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PointsPanel() {
  const { state, signInToday, redeem } = useMembership();
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signedToday = state.lastSignDate === todayStr();

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }

  function handleSignIn() {
    const r = signInToday();
    if (r.already) flash('今天已经签到啦，明天再来～');
    else flash(`签到成功 +${r.gained} 积分（连续 ${r.streak} 天）`);
  }

  function extend7() {
    if (state.tier === 'free') {
      flash('免费会员暂不支持延长，先升级体验吧');
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      const ok = redeem(200, '兑换：延长会员 7 天', (s: MembershipState) => {
        const e = s.expiresAt ? new Date(s.expiresAt) : new Date();
        e.setDate(e.getDate() + 7);
        return { ...s, expiresAt: e.toISOString() };
      });
      flash(ok ? '已延长会员 7 天' : '积分不足（需 200）');
      setBusy(false);
    }, 350);
  }

  function trialPro() {
    setBusy(true);
    window.setTimeout(() => {
      const ok = redeem(300, '兑换：体验高级会员 3 天', (s: MembershipState) => {
        const e = new Date();
        e.setDate(e.getDate() + 3);
        return {
          ...s,
          tier: 'pro',
          subscribedAt: s.subscribedAt ?? new Date().toISOString(),
          expiresAt: e.toISOString(),
        };
      });
      flash(ok ? '已体验高级会员 3 天' : '积分不足（需 300）');
      setBusy(false);
    }, 350);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 17, margin: '0 0 14px' }}>积分与成长</h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>今日签到</div>
          <div style={{ fontSize: 14, marginTop: 2 }}>
            {signedToday ? (
              <span style={{ color: 'var(--safe)', fontWeight: 600 }}>
                已签到 · 连续 {state.signStreak} 天
              </span>
            ) : (
              <span style={{ color: 'var(--muted)' }}>
                连续 {state.signStreak} 天，明日加成更多
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={signedToday}
          className="btn-primary"
          style={{ fontSize: 14, minHeight: 40, opacity: signedToday ? 0.6 : 1 }}
        >
          {signedToday ? '今日已签' : '签到 +10 积分'}
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', margin: '16px 0' }} />

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>积分兑换</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <RedeemRow
          title="延长会员 7 天"
          cost={200}
          desc="适用于已开通的付费会员"
          disabled={state.tier === 'free' || busy}
          onClick={extend7}
        />
        <RedeemRow
          title="体验高级会员 3 天"
          cost={300}
          desc="解锁会员专属深度测评"
          disabled={busy}
          onClick={trialPro}
        />
      </div>

      <div style={{ borderTop: '1px solid var(--line)', margin: '16px 0' }} />

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>积分流水</div>
      {state.history.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>暂无记录，签到或升级即可获得积分。</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {state.history.slice(0, 8).map((h, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: 'var(--muted)',
              }}
            >
              <span>{h.reason}</span>
              <span style={{ color: h.points >= 0 ? 'var(--safe)' : 'var(--warn)', fontWeight: 600 }}>
                {h.points >= 0 ? `+${h.points}` : h.points}
              </span>
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <div
          role="status"
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--chip-green-bg)',
            color: 'var(--alert-success-ink)',
            fontSize: 13,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function RedeemRow({
  title,
  cost,
  desc,
  disabled,
  onClick,
}: {
  title: string;
  cost: number;
  desc: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: '1px solid var(--line)',
        borderRadius: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="chip"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: '1px solid var(--brand)',
          color: 'var(--brand)',
          background: disabled ? 'var(--surface-2)' : 'var(--chip-bg)',
          fontFamily: 'inherit',
          fontSize: 13,
        }}
      >
        {cost} 积分
      </button>
    </div>
  );
}
