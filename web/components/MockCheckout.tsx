'use client';
import { useState } from 'react';
import type { TierDef } from '@/lib/membership';

export default function MockCheckout({
  open,
  tier,
  billing,
  onClose,
  onSuccess,
}: {
  open: boolean;
  tier: TierDef;
  billing: 'monthly' | 'yearly';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const amount = billing === 'yearly' ? tier.yearly : tier.monthly;

  if (!open) return null;

  function pay() {
    setPaying(true);
    // 模拟支付网关往返；演示环境不连接真实支付
    window.setTimeout(() => {
      setPaying(false);
      onSuccess();
    }, 1200);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`开通${tier.name}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ maxWidth: 420, width: '100%', padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>开通 {tier.name}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 22,
              lineHeight: 1,
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            borderRadius: 10,
            background: `${tier.color}12`,
            border: `1px solid ${tier.color}44`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--muted)' }}>套餐</span>
            <span style={{ fontWeight: 600 }}>{tier.name}（{billing === 'yearly' ? '年付' : '月付'}）</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 22,
              fontWeight: 800,
              marginTop: 6,
              color: tier.color,
            }}
          >
            <span>应付</span>
            <span>¥{amount}.00</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: 'var(--muted)',
            background: 'var(--surface-2)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          ⚠️ 演示环境：本支付为模拟流程，<strong>不会产生任何真实扣费</strong>，仅用于展示会员开通体验。
        </div>

        <button
          type="button"
          onClick={pay}
          disabled={paying}
          className="btn-primary"
          style={{ width: '100%', marginTop: 16, fontSize: 15 }}
        >
          {paying ? '支付处理中…' : `确认支付 ¥${amount}.00`}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={paying}
          style={{
            width: '100%',
            marginTop: 8,
            minHeight: 40,
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--card)',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
