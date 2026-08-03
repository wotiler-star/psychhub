// 会员专属（深度）测评定义
// 说明：当前线上为 mock API，会员状态与「专属测评」判定均在前端完成（localStorage 会员体系）。
// 这里以 slug 集合明确标记「会员专属深度测评」，与会员权益文案（pro/ultimate 含 vipAssess 权益）保持一致。
// 注意：本文件为纯函数模块，仅用 `import type` 引用 MembershipTier，避免把 membership.ts 的
// React Hooks 拖入「服务端组件」（如 /assessments 列表页）。等级顺序以 membership.ts 的 TIER_ORDER 为准。
import type { MembershipTier } from '@/lib/membership';

// 与 membership.ts 中 TIER_ORDER 保持一致（纯判定用，不引入 hooks）
const TIER_ORDER: MembershipTier[] = ['free', 'basic', 'pro', 'ultimate'];
function tierRank(t: MembershipTier): number {
  return TIER_ORDER.indexOf(t);
}

// 会员专属深度测评 slug 集合。
// 标准筛查类（phq-9/gad-7/sds/sas 等抑郁焦虑筛查）继续免费开放；
// 自我认知 / 幸福感 / 睡眠 / 压力感知等「深度测评」设为会员专属，体现 pro/ultimate 的 vipAssess 权益。
export const VIP_ASSESSMENT_SLUGS = new Set<string>([
  'rses', // 自尊水平（Rosenberg 自尊量表）
  'who-5', // 主观幸福感（WHO-5 幸福感指数）
  'isi', // 睡眠状况（失眠严重指数 ISI）
  'pss-10', // 压力感知（感知压力量表 PSS-10）
]);

// 解锁专属测评所需的最低会员等级
export const VIP_MIN_TIER: MembershipTier = 'pro';

export interface VipProbe {
  slug?: string | null;
  type?: string | null;
}

/** 该测评是否为会员专属深度测评 */
export function isVipAssessment(a: VipProbe): boolean {
  return !!a.slug && VIP_ASSESSMENT_SLUGS.has(a.slug);
}

/**
 * 给定会员等级与是否过期，判断是否可解锁专属测评。
 * - 等级需达到 VIP_MIN_TIER（pro/ultimate）
 * - 已过期则视为无权益
 */
export function canAccessVip(tier: MembershipTier, isExpired: boolean): boolean {
  if (isExpired) return false;
  return tierRank(tier) >= tierRank(VIP_MIN_TIER);
}
