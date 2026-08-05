import type { ResourceType, HelplineCategory } from './types';

// 资源类型 → 中文标签 + 设计系统色板（与 globals.css chip 类对应）+ 子版块图标/简介
export const RESOURCE_TYPE_META: Record<
  ResourceType,
  { label: string; chip: string; emoji: string; desc: string }
> = {
  MEDIA: {
    label: '内容媒体',
    chip: 'chip-purple',
    emoji: '📰',
    desc: '聚合心理学新闻、科普文章、播客与自媒体，帮你持续获取靠谱的心理健康资讯。',
  },
  SAAS: {
    label: '执业 SaaS',
    chip: 'chip-sky',
    emoji: '🧰',
    desc: '面向心理咨询师与机构的执业工具：预约排班、个案笔记、测评与诊所管理系统。',
  },
  THERAPY: {
    label: '在线咨询',
    chip: 'chip-green',
    emoji: '💬',
    desc: '提供文字 / 语音 / 视频心理咨询的平台，可按议题、地区与价格筛选合适的咨询师。',
  },
  ORG: {
    label: '公益组织',
    chip: '',
    emoji: '🤝',
    desc: '非营利心理援助机构、公益热线与互助社群，提供低价或免费的支持服务。',
  },
  TOOL: {
    label: '测评工具',
    chip: 'chip-orange',
    emoji: '📊',
    desc: '在线心理测评、量表与自测工具，覆盖情绪、人格、睡眠等维度（结果仅供参考）。',
  },
  MEDITATION: {
    label: '冥想自助',
    chip: 'chip-amber',
    emoji: '🧘',
    desc: '正念冥想、呼吸训练与放松音频，帮助缓解焦虑、改善睡眠与提升专注。',
  },
  EDU: {
    label: '学术教育',
    chip: 'chip-rose',
    emoji: '🎓',
    desc: '心理学课程、公开课、研究机构与学术资源，适合学习者与从业者深造。',
  },
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
