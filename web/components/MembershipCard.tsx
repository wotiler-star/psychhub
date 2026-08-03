'use client';
import Link from 'next/link';
import { useMembership } from '@/lib/membership';

export default function MembershipCard({
  showUpgrade = true,
}: {
  showUpgrade?: boolean;
}) {
  const { state, tier, isExpired } = useMembership();
  const exp = state.expiresAt
    ? new Date(state.expiresAt).toLocaleDateString('zh-CN')
    : null;

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        border: `1px solid ${tier.color}55`,
      }}
    >
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${tier.color}, ${tier.color}99)`,
        }}
      />
      <div style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span
              className="chip"
              style={{ background: `${tier.color}1a`, color: tier.color, marginBottom: 8 }}
            >
              {tier.name}
            </span>
            <h2 style={{ fontSize: 22, margin: '6px 0 2px' }}>{state.profile.name || '心理探索者'}</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>{tier.tagline}</p>
          </div>
          {showUpgrade && state.tier !== 'ultimate' && (
            <Link className="btn-primary" href="/membership" style={{ fontSize: 14 }}>
              升级会员
            </Link>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
            marginTop: 18,
          }}
        >
          <Stat label="成长积分" value={String(state.points)} />
          <Stat label="连续签到" value={`${state.signStreak} 天`} />
          <Stat label="累计签到" value={`${state.totalSignDays} 天`} />
          <Stat
            label="会员状态"
            value={state.tier === 'free' ? '未开通' : isExpired ? '已过期' : '生效中'}
            danger={isExpired}
          />
        </div>

        {exp && !isExpired && (
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '14px 0 0' }}>
            会员有效期至 {exp}
          </p>
        )}
        {isExpired && (
          <p style={{ color: 'var(--alert-danger-ink)', fontSize: 13, margin: '14px 0 0' }}>
            会员已于 {exp} 过期，续费可继续享受专属权益。
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: danger ? 'var(--alert-danger-ink)' : 'var(--ink)',
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
