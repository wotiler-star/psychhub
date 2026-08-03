// 支付通道骨架（占位 / 待接入）
// 说明：当前生产环境运行于 mock API，没有真实支付后端与 Webhook。
// 本文件定义「可配置支付模式」：默认 mock（模拟），并预留 Stripe / 微信支付 的凭证接入点。
// 真实接入时：注入对应环境变量 + 在后端 subscribe 增加 Webhook 校验即可，前端流程无需改动。
// 注意：任何密钥（Stripe Secret / 微信 API Key / Webhook Secret）只应存于服务端环境变量，绝不进入前端包体。

export type PaymentMode = 'mock' | 'stripe' | 'wechat';

// 默认模拟支付；真实环境改用 'stripe' / 'wechat'（需配置下方凭证）
export const PAYMENT_MODE: PaymentMode =
  (process.env.NEXT_PUBLIC_PAYMENT_MODE as PaymentMode) || 'mock';

// —— 凭证占位（仅公钥 / 商户号等可前端持有的字段；密钥一律服务端保管）——
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PK ?? '',
  // 服务端：STRIPE_SECRET_KEY、STRIPE_WEBHOOK_SECRET（仅环境变量）
};

export const WECHAT_CONFIG = {
  mchId: process.env.NEXT_PUBLIC_WECHAT_MCH_ID ?? '',
  // 服务端：WECHAT_APP_ID、WECHAT_API_KEY、WECHAT_WEBHOOK_SECRET（仅环境变量）
};

// 各通道在当前构建下是否「已接入可用」
export function isPaymentLive(mode: PaymentMode): boolean {
  switch (mode) {
    case 'mock':
      return true; // 演示模拟支付始终可用
    case 'stripe':
      return !!STRIPE_CONFIG.publishableKey;
    case 'wechat':
      return !!WECHAT_CONFIG.mchId;
  }
}

export const PAYMENT_METHODS: {
  id: PaymentMode;
  label: string;
  hint: string;
}[] = [
  { id: 'mock', label: '模拟支付（演示）', hint: '不产生任何真实扣费，仅用于体验开通流程' },
  { id: 'wechat', label: '微信支付', hint: '配置商户号后启用，Native 扫码支付' },
  { id: 'stripe', label: 'Stripe', hint: '配置公钥后启用，国际卡 / 海外支付' },
];
