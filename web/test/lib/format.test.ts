import { describe, it, expect } from 'vitest';
import {
  RESOURCE_TYPE_META,
  RESOURCE_TYPES,
  HELPLINE_CATEGORY_META,
} from '@/lib/format';
import type { ResourceType, HelplineCategory } from '@/lib/types';

// 纯函数单测：资源 / 热线分类的中文标签与色板映射，是前端展示一致性的基础。
describe('lib/format 资源类型映射', () => {
  const expected: Record<ResourceType, string> = {
    MEDIA: '内容媒体',
    SAAS: '执业 SaaS',
    THERAPY: '在线咨询',
    ORG: '公益组织',
    TOOL: '测评工具',
    MEDITATION: '冥想自助',
    EDU: '学术教育',
  };

  it('RESOURCE_TYPE_META 覆盖全部 ResourceType 且标签正确', () => {
    (Object.keys(expected) as ResourceType[]).forEach((t) => {
      expect(RESOURCE_TYPE_META[t].label).toBe(expected[t]);
      // chip 字段存在（允许空字符串，ORG 即如此）
      expect('chip' in RESOURCE_TYPE_META[t]).toBe(true);
    });
  });

  it('RESOURCE_TYPES 顺序与 ResourceType 枚举一致', () => {
    expect(RESOURCE_TYPES).toEqual(Object.keys(expected));
    expect(RESOURCE_TYPES).toHaveLength(7);
  });

  it('RESOURCE_TYPES 元素均为合法 ResourceType 键', () => {
    RESOURCE_TYPES.forEach((t) => {
      expect(RESOURCE_TYPE_META[t].label).toBeDefined();
    });
  });
});

describe('lib/format 热线分类映射', () => {
  const expected: Record<HelplineCategory, string> = {
    CRISIS: '危机热线',
    SUPPORT: '支持资源',
    LOW_COST: '低价 / 免费',
  };

  it('HELPLINE_CATEGORY_META 覆盖全部 HelplineCategory 且标签正确', () => {
    (Object.keys(expected) as HelplineCategory[]).forEach((c) => {
      expect(HELPLINE_CATEGORY_META[c].label).toBe(expected[c]);
    });
  });
});
