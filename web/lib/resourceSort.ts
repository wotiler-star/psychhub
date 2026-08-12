import type { Resource } from './types';

/**
 * 将资源 trafficLevel（混合「高/中/低」与「X万/月」文案）归一为可比较的热度分，用于排序。
 * 例：'300万/月' → 300；'100-200万/月' → 150；'高' → 3000；'中' → 1000；'低' → 300。
 */
export function trafficScore(level: string | null | undefined): number {
  if (!level) return 0;
  const m = level.match(/(\d+)(?:-(\d+))?万\/月/);
  if (m) {
    const lo = Number(m[1]);
    const hi = m[2] ? Number(m[2]) : lo;
    return (lo + hi) / 2;
  }
  if (level.includes('高')) return 3000;
  if (level.includes('中')) return 1000;
  if (level.includes('低')) return 300;
  return 0;
}

/**
 * 导航站通用资源排序：精选优先 / 流量优先 / 名称 A-Z / 最新收录。
 * 未指定 sort 时保持原顺序（API 默认即精选优先）。
 */
export function sortResources(resources: Resource[], sort?: string): Resource[] {
  switch (sort) {
    case 'traffic':
      return [...resources].sort(
        (a, b) => trafficScore(b.trafficLevel) - trafficScore(a.trafficLevel),
      );
    case 'name':
      return [...resources].sort((a, b) => a.name.localeCompare(b.name));
    case 'featured':
      return [...resources].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    case 'newest':
      return [...resources].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || ''),
      );
    default:
      return resources;
  }
}
