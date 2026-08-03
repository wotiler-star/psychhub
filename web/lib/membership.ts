// 会员系统数据层（前端持久化版）
// 说明：当前线上为 mock API，会员状态存于浏览器 localStorage，按登录用户隔离；
// 后端 MembershipModule 骨架仅供将来真后端对接（见 backend/src/membership）。
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

// ===== 会员等级定义 =====
export type MembershipTier = 'free' | 'basic' | 'pro' | 'ultimate';

export interface TierDef {
  id: MembershipTier;
  name: string;
  tagline: string;
  monthly: number; // 月价（元），0 = 免费
  yearly: number; // 年价（元）
  color: string; // 徽章/强调色
  popular?: boolean;
  benefits: string[]; // 权益要点（卡片展示）
  // 权益对比矩阵：key -> 展示值（'✓' 拥有 / '✗' 无 / 文本）
  perks: Record<string, string>;
}

// 权益维度（用于对比表列顺序）
export const PERK_KEYS: { key: string; label: string }[] = [
  { key: 'nav', label: '资源导航与公开测评' },
  { key: 'community', label: '社区互动' },
  { key: 'adfree', label: '无广告清爽浏览' },
  { key: 'favLimit', label: '收藏上限' },
  { key: 'cloudHistory', label: '测评历史云端保存' },
  { key: 'vipAssess', label: '会员专属深度测评' },
  { key: 'consult', label: '1v1 顾问/咨询权益' },
];

export const TIERS: Record<MembershipTier, TierDef> = {
  free: {
    id: 'free',
    name: '免费会员',
    tagline: '开启心理探索的第一步',
    monthly: 0,
    yearly: 0,
    color: '#5b6b80',
    benefits: [
      '完整资源导航与公开心理测评',
      '社区浏览与公开内容阅读',
      '每日签到领取成长积分',
      '收藏上限 50 条',
    ],
    perks: {
      nav: '✓',
      community: '✓',
      adfree: '✗',
      favLimit: '50',
      cloudHistory: '✗',
      vipAssess: '✗',
      consult: '✗',
    },
  },
  basic: {
    id: 'basic',
    name: '基础会员',
    tagline: '更顺手的日常使用体验',
    monthly: 19,
    yearly: 190,
    color: '#0ea5e9',
    benefits: [
      '免费会员全部权益',
      '无广告清爽浏览',
      '收藏无限，随心沉淀',
      '测评历史云端长期保存',
    ],
    perks: {
      nav: '✓',
      community: '✓',
      adfree: '✓',
      favLimit: '无限',
      cloudHistory: '✓',
      vipAssess: '✗',
      consult: '✗',
    },
  },
  pro: {
    id: 'pro',
    name: '高级会员',
    tagline: '认真关照自己的你来这里',
    monthly: 49,
    yearly: 490,
    color: '#4f46e5',
    popular: true,
    benefits: [
      '基础会员全部权益',
      '会员专属深度测评（人格/依恋/情绪等）',
      '资源深度对比与个性化推荐',
      '会员专属内容精选',
    ],
    perks: {
      nav: '✓',
      community: '✓',
      adfree: '✓',
      favLimit: '无限',
      cloudHistory: '✓',
      vipAssess: '✓',
      consult: '✗',
    },
  },
  ultimate: {
    id: 'ultimate',
    name: '尊享会员',
    tagline: '一对一的长期陪伴',
    monthly: 99,
    yearly: 990,
    color: '#d97706',
    benefits: [
      '高级会员全部权益',
      '每月 1 次 1v1 心理顾问咨询券',
      '定制版测评报告与解读',
      '线下沙龙与活动优先名额',
    ],
    perks: {
      nav: '✓',
      community: '✓',
      adfree: '✓',
      favLimit: '无限',
      cloudHistory: '✓',
      vipAssess: '✓',
      consult: '✓',
    },
  },
};

export const TIER_ORDER: MembershipTier[] = ['free', 'basic', 'pro', 'ultimate'];

export function tierRank(t: MembershipTier): number {
  return TIER_ORDER.indexOf(t);
}
export function hasPerk(tier: MembershipTier, perkKey: string): boolean {
  const v = TIERS[tier].perks[perkKey];
  return v === '✓' || (v != null && v !== '✗' && v !== '50');
}

// ===== 会员状态 =====
export interface PointRecord {
  date: string; // YYYY-MM-DD
  points: number;
  reason: string;
}

export interface MembershipState {
  tier: MembershipTier;
  points: number;
  signStreak: number; // 连续签到天数
  lastSignDate: string | null; // YYYY-MM-DD
  totalSignDays: number;
  subscribedAt: string | null;
  expiresAt: string | null; // 订阅到期日 ISO
  profile: { name: string; bio: string };
  history: PointRecord[]; // 近期积分流水（最多 30 条）
  createdAt: string;
}

const DEFAULT_STATE = (): MembershipState => ({
  tier: 'free',
  points: 0,
  signStreak: 0,
  lastSignDate: null,
  totalSignDays: 0,
  subscribedAt: null,
  expiresAt: null,
  profile: { name: '', bio: '' },
  history: [],
  createdAt: new Date().toISOString(),
});

// ===== 跨组件同步的轻量 store =====
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
const cache = new Map<string, MembershipState>();

function storageKey(userId?: string | null): string {
  return `psychhub_membership_${userId ?? 'guest'}`;
}

function readState(userId?: string | null): MembershipState {
  const key = storageKey(userId);
  const cached = cache.get(key);
  if (cached) return cached;
  let state = DEFAULT_STATE();
  try {
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MembershipState>;
      state = { ...state, ...parsed, profile: { ...state.profile, ...parsed.profile } };
    }
  } catch {
    /* 损坏数据回退默认 */
  }
  cache.set(key, state);
  return state;
}

function writeState(userId: string | null, next: MembershipState) {
  const key = storageKey(userId);
  cache.set(key, next);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(next));
    }
  } catch {
    /* 隐私模式忽略 */
  }
  emit();
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===== Hook =====
export interface MembershipApi {
  state: MembershipState;
  ready: boolean;
  tier: TierDef;
  isExpired: boolean;
  signInToday: () => { ok: boolean; already: boolean; gained: number; streak: number };
  addPoints: (points: number, reason: string) => void;
  upgradeTo: (tier: MembershipTier, billing: 'monthly' | 'yearly') => void;
  redeem: (cost: number, reason: string, effect?: (s: MembershipState) => MembershipState) => boolean;
  updateProfile: (patch: Partial<{ name: string; bio: string }>) => void;
  reset: () => void;
}

export function useMembership(): MembershipApi {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<MembershipState>(() => DEFAULT_STATE());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setState(readState(userId));
    sync();
    setReady(true);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, [userId]);

  const signInToday = useCallback(() => {
    const cur = readState(userId);
    const t = todayStr();
    if (cur.lastSignDate === t) {
      return { ok: false, already: true, gained: 0, streak: cur.signStreak };
    }
    const streak = cur.lastSignDate === yesterdayStr() ? cur.signStreak + 1 : 1;
    const base = 10;
    const bonus = Math.min(streak, 7) * 2; // 连续签到加成，封顶 +14
    const gained = base + bonus;
    const next: MembershipState = {
      ...cur,
      signStreak: streak,
      lastSignDate: t,
      totalSignDays: cur.totalSignDays + 1,
      points: cur.points + gained,
      history: [
        { date: t, points: gained, reason: `每日签到（连续 ${streak} 天）` },
        ...cur.history,
      ].slice(0, 30),
    };
    writeState(userId, next);
    return { ok: true, already: false, gained, streak };
  }, [userId]);

  const addPoints = useCallback(
    (points: number, reason: string) => {
      const cur = readState(userId);
      const next: MembershipState = {
        ...cur,
        points: cur.points + points,
        history: [{ date: todayStr(), points, reason }, ...cur.history].slice(0, 30),
      };
      writeState(userId, next);
    },
    [userId],
  );

  const upgradeTo = useCallback(
    (tier: MembershipTier, billing: 'monthly' | 'yearly') => {
      const cur = readState(userId);
      const now = new Date();
      const exp = new Date(now);
      if (billing === 'yearly') exp.setFullYear(exp.getFullYear() + 1);
      else exp.setMonth(exp.getMonth() + 1);
      const welcome = tier === 'pro' ? 100 : tier === 'ultimate' ? 300 : 30;
      const next: MembershipState = {
        ...cur,
        tier,
        subscribedAt: now.toISOString(),
        expiresAt: exp.toISOString(),
        points: cur.points + welcome,
        history: [
          { date: todayStr(), points: welcome, reason: `开通${TIERS[tier].name}奖励` },
          ...cur.history,
        ].slice(0, 30),
      };
      writeState(userId, next);
    },
    [userId],
  );

  const redeem = useCallback(
    (cost: number, reason: string, effect?: (s: MembershipState) => MembershipState) => {
      const cur = readState(userId);
      if (cur.points < cost) return false;
      let next: MembershipState = {
        ...cur,
        points: cur.points - cost,
        history: [{ date: todayStr(), points: -cost, reason }, ...cur.history].slice(0, 30),
      };
      if (effect) next = effect(next);
      writeState(userId, next);
      return true;
    },
    [userId],
  );

  const updateProfile = useCallback(
    (patch: Partial<{ name: string; bio: string }>) => {
      const cur = readState(userId);
      const next: MembershipState = { ...cur, profile: { ...cur.profile, ...patch } };
      writeState(userId, next);
    },
    [userId],
  );

  const reset = useCallback(() => {
    writeState(userId, DEFAULT_STATE());
  }, [userId]);

  const tier = TIERS[state.tier];
  const isExpired =
    !!state.expiresAt && new Date(state.expiresAt).getTime() < Date.now();

  return {
    state,
    ready,
    tier,
    isExpired,
    signInToday,
    addPoints,
    upgradeTo,
    redeem,
    updateProfile,
    reset,
  };
}
