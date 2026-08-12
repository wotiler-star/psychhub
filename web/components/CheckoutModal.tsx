'use client';
import { useState } from 'react';
import type { TierDef } from '@/lib/membership';
import { PAYMENT_METHODS, isPaymentLive, type PaymentMode } from '@/lib/payment';

export default function CheckoutModal({
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
  const [method, setMethod] = useState<PaymentMode>('mock');
  const amount = billing === 'yearly' ? tier.yearly : tier.monthly;
  const live = isPaymentLive(method);

  if (!open) return null;

  function pay() {
    if (!live) return; // 非模拟通道为占位，不触发真实扣费
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
        style={{ maxWidth: 440, width: '100%', padding: 24 }}
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

        {/* 支付方式选择 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>支付方式</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PAYMENT_METHODS.map((m) => {
              const selected = method === m.id;
              const mLive = isPaymentLive(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${selected ? 'var(--brand)' : 'var(--line)'}`,
                    background: selected ? 'var(--chip-bg)' : 'var(--bg)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      border: `2px solid ${selected ? 'var(--brand)' : 'var(--line)'}`,
                      background: selected ? 'var(--brand)' : 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{m.label}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {m.hint}
                      {!mLive && '（演示环境未接入，配置凭证后启用）'}
                    </span>
                  </span>
                  {m.id === 'mock' && (
                    <span className="chip chip-green" style={{ fontSize: 11 }}>可用</span>
                  )}
                </button>
              );
            })}
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
          ⚠️ 演示环境：默认「模拟支付」为演示流程，<strong>不会产生任何真实扣费</strong>，仅用于展示会员开通体验。微信 / Stripe 为预留接入通道，配置真实密钥与后端 Webhook 后方可实收。
        </div>

        <button
          type="button"
          onClick={pay}
          disabled={paying || !live}
          className="btn-primary"
          style={{ width: '100%', marginTop: 16, fontSize: 15, opacity: paying || !live ? 0.6 : 1, cursor: paying || !live ? 'not-allowed' : 'pointer' }}
        >
          {paying
            ? '支付处理中…'
            : !live
              ? '该支付方式待接入'
              : `确认支付 ¥${amount}.00`}
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
