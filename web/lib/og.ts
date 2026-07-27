// SEO 分享卡工具：统一构造 /api/og 动态分享卡地址
// 说明：og:image 需要绝对地址，Next 会用 metadataBase 解析相对路径，
// 这里只负责拼相对 URL + 参数编码与长度裁剪。

export interface OgCardParams {
  /** 卡片主标题（必填），过长会被裁剪 */
  title: string;
  /** 副标题 / 摘要，一行左右 */
  subtitle?: string | null;
  /** 左上角栏目标签，如「心理资讯」「免费测评」 */
  tag?: string;
}

function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** 生成动态分享卡的相对 URL（1200x630 PNG） */
export function ogImageUrl({ title, subtitle, tag }: OgCardParams): string {
  const sp = new URLSearchParams();
  sp.set('title', clip(title, 40));
  if (subtitle) sp.set('subtitle', clip(subtitle, 60));
  if (tag) sp.set('tag', clip(tag, 10));
  return `/api/og?${sp.toString()}`;
}

/** 站点默认分享卡（首页 / 列表页兜底） */
export const DEFAULT_OG_IMAGE = ogImageUrl({
  title: '心理资源聚合',
  subtitle: '3 次点击内，找到你需要的心理资源',
  tag: '资源导航',
});
