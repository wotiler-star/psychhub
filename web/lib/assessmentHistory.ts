// 测评历史：浏览器本地存储（localStorage），无需登录即可保存与回看。
// 生产环境若要跨设备同步，可改为按需上传到后端 /api/assessment-records（当前为纯前端演示）。

export interface AssessmentRecord {
  id: string;
  slug: string;
  title: string;
  total: number;
  level: string;
  advice: string;
  completedAt: string; // ISO 时间
}

const KEY = 'psychhub:assessment-history';
const MAX = 50;

export function getAssessmentHistory(): AssessmentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x === 'object')
      .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
  } catch {
    return [];
  }
}

function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function saveAssessmentRecord(
  rec: Pick<AssessmentRecord, 'slug' | 'title' | 'total' | 'level' | 'advice'>,
): AssessmentRecord {
  const full: AssessmentRecord = {
    ...rec,
    id: genId(),
    completedAt: new Date().toISOString(),
  };
  if (typeof window === 'undefined') return full;
  const list = getAssessmentHistory();
  list.unshift(full);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* 忽略配额超限 */
  }
  return full;
}

export function clearAssessmentHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
