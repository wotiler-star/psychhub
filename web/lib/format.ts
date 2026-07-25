import type { ResourceType, HelplineCategory } from './types';

// 资源类型 → 中文标签 + 设计系统色板（与 globals.css chip 类对应）
export const RESOURCE_TYPE_META: Record<
  ResourceType,
  { label: string; chip: string }
> = {
  MEDIA: { label: '内容媒体', chip: 'chip-purple' },
  SAAS: { label: '执业 SaaS', chip: 'chip-sky' },
  THERAPY: { label: '在线咨询', chip: 'chip-green' },
  ORG: { label: '公益组织', chip: '' },
  TOOL: { label: '测评工具', chip: 'chip-orange' },
  MEDITATION: { label: '冥想自助', chip: 'chip-amber' },
  EDU: { label: '学术教育', chip: 'chip-rose' },
};

export const RESOURCE_TYPES = Object.keys(
  RESOURCE_TYPE_META,
) as ResourceType[];

export const HELPLINE_CATEGORY_META: Record<
  HelplineCategory,
  { label: string; chip: string }
> = {
  CRISIS: { label: '危机热线', chip: 'chip-rose' },
  SUPPORT: { label: '支持资源', chip: 'chip-sky' },
  LOW_COST: { label: '低价 / 免费', chip: 'chip-green' },
};
