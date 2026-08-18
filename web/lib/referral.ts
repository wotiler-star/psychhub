// 转介记录：浏览器本地存储（localStorage），用于闭环「咨询师 → 转介」链路。
// 本平台仅做转介层（不自营诊疗），这里记录用户的转介动作以便回顾与归因，
// 真实分成/归因以 bookingUrl 上的 UTM 参数为准（见 ReferralButton）。

export interface ReferralRecord {
  counselorId: string;
  counselorName: string;
  bookingUrl: string;
  referredAt: string; // ISO 时间
}

const KEY = 'psychhub:referrals';
const MAX = 50;

export function getReferrals(): ReferralRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x === 'object')
      .sort((a, b) => String(b.referredAt).localeCompare(String(a.referredAt)));
  } catch {
    return [];
  }
}

export function saveReferral(
  rec: Pick<ReferralRecord, 'counselorId' | 'counselorName' | 'bookingUrl'>,
): ReferralRecord {
  const full: ReferralRecord = { ...rec, referredAt: new Date().toISOString() };
  if (typeof window === 'undefined') return full;
  const list = getReferrals();
  // 同一咨询师去重，保留最新一次
  const dedup = list.filter((r) => r.counselorId !== rec.counselorId);
  dedup.unshift(full);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(dedup.slice(0, MAX)));
  } catch {
    /* 忽略配额超限 */
  }
  return full;
}

export function clearReferrals(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
