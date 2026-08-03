'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  TIERS,
  TIER_ORDER,
  PERK_KEYS,
  useMembership,
  type MembershipTier,
  type TierDef,
} from '@/lib/membership';
import MockCheckout from '@/components/MockCheckout';

export default function MembershipExplorer() {
  const { state, upgradeTo } = useMembership();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [checkout, setCheckout] = useState<TierDef | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function openCheckout(tier: TierDef) {
    if (tier.id === 'free' || tier.id === state.tier) return;
    setCheckout(tier);
  }

  function onPaid() {
    if (checkout) {
      upgradeTo(checkout.id, billing);
      flash(`已开通 ${checkout.name}（${billing === 'yearly' ? '年付' : '月付'}），欢迎体验专属权益！`);
    }
    setCheckout(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* 计费周期切换 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: 4,
            background: 'var(--surface-2)',
          }}
        >
          {(['monthly', 'yearly'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className="chip"
              style={{
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                padding: '8px 18px',
                background: billing === b ? 'var(--brand)' : 'transparent',
                color: billing === b ? 'var(--btn-text)' : 'var(--muted)',
              }}
            >
              {b === 'yearly' ? '年付（省更多）' : '月付'}
            </button>
          ))}
        </div>
      </div>

      {/* 套餐卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {TIER_ORDER.map((id) => {
          const t = TIERS[id];
          const isCurrent = state.tier === id;
          const isFree = id === 'free';
          return (
            <div
              key={id}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: isCurrent ? `2px solid ${t.color}` : '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {t.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: t.color,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                  }}
                >
                  最受欢迎
                </div>
              )}
              <div style={{ height: 6, background: t.color }} />
              <div style={{ padding: '20px 20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 19 }}>{t.name}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 14px', minHeight: 36 }}>{t.tagline}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  {isFree ? (
                    <span style={{ fontSize: 28, fontWeight: 800 }}>免费</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 28, fontWeight: 800, color: t.color }}>¥{billing === 'yearly' ? t.yearly : t.monthly}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>/ {billing === 'yearly' ? '年' : '月'}</span>
                    </>
                  )}
                </div>
                {!isFree && billing === 'yearly' && (
                  <div style={{ fontSize: 12, color: 'var(--safe)', marginBottom: 10 }}>
                    年付立省 ¥{t.monthly * 12 - t.yearly}
                  </div>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {t.benefits.map((b, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--ink)', display: 'flex', gap: 8 }}>
                      <span style={{ color: t.color, fontWeight: 700 }}>✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => openCheckout(t)}
                  disabled={isFree || isCurrent}
                  className={isCurrent ? 'chip' : 'btn-primary'}
                  style={
                    isCurrent
                      ? { background: `${t.color}1a`, color: t.color, fontSize: 14, minHeight: 42, width: '100%', border: 'none', fontFamily: 'inherit', cursor: 'default' }
                      : { fontSize: 14, minHeight: 42, width: '100%' }
                  }
                >
                  {isFree ? '免费默认' : isCurrent ? '当前套餐' : '立即开通'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 权益对比表 */}
      <div>
        <h2 style={{ fontSize: 20, margin: '0 0 14px' }}>权益对比一览</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640, fontSize: 14 }}>
            <thead>
              <tr>
                <th style={thStyle}>权益</th>
                {TIER_ORDER.map((id) => (
                  <th key={id} style={{ ...thStyle, color: TIERS[id].color }}>
                    {TIERS[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERK_KEYS.map((p) => (
                <tr key={p.key} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={tdStyle}>{p.label}</td>
                  {TIER_ORDER.map((id) => {
                    const v = TIERS[id].perks[p.key];
                    return (
                      <td key={id} style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>
                        {v === '✓' ? (
                          <span style={{ color: 'var(--safe)' }}>✓</span>
                        ) : v === '✗' ? (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        ) : (
                          v
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: 'var(--muted)',
          background: 'var(--surface-2)',
          borderRadius: 10,
          padding: '12px 16px',
        }}
      >
        会员权益为平台对用户的增值服务示例，仅用于产品演示。本站不提供在线诊疗，会员亦不包含医疗诊断；如有心理困扰请优先使用
        <Link href="/helplines"> 公益求助热线</Link>。
      </div>

      {toast && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'var(--chip-green-bg)',
            color: 'var(--alert-success-ink)',
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}

      {checkout && (
        <MockCheckout
          open={!!checkout}
          tier={checkout}
          billing={billing}
          onClose={() => setCheckout(null)}
          onSuccess={onPaid}
        />
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 13,
  fontWeight: 700,
  background: 'var(--surface-2)',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  color: 'var(--ink)',
};
