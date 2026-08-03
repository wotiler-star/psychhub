// 会员档位静态定义（与前端 web/lib/membership.ts 的 TIERS 对齐 id/monthly/yearly/name）。
// 后端骨架阶段以代码常量提供公开档位接口；接真实订阅后可由数据库/配置驱动。
export interface MembershipTierDef {
  id: 'free' | 'basic' | 'pro' | 'ultimate';
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  popular?: boolean;
  benefits: string[];
}

export const MEMBERSHIP_TIERS: MembershipTierDef[] = [
  {
    id: 'free',
    name: '免费会员',
    tagline: '开启心理探索的第一步',
    monthly: 0,
    yearly: 0,
    benefits: ['完整资源导航与公开心理测评', '社区浏览', '每日签到领积分', '收藏上限 50 条'],
  },
  {
    id: 'basic',
    name: '基础会员',
    tagline: '更顺手的日常使用体验',
    monthly: 19,
    yearly: 190,
    benefits: ['无广告清爽浏览', '收藏无限', '测评历史云端保存', '免费会员全部权益'],
  },
  {
    id: 'pro',
    name: '高级会员',
    tagline: '认真关照自己的你来这里',
    monthly: 49,
    yearly: 490,
    popular: true,
    benefits: ['会员专属深度测评', '资源深度对比与推荐', '会员专属内容精选', '基础会员全部权益'],
  },
  {
    id: 'ultimate',
    name: '尊享会员',
    tagline: '一对一的长期陪伴',
    monthly: 99,
    yearly: 990,
    benefits: ['每月 1 次 1v1 顾问咨询券', '定制测评报告', '线下活动优先', '高级会员全部权益'],
  },
];

export const TIER_ORDER: MembershipTierDef['id'][] = ['free', 'basic', 'pro', 'ultimate'];
