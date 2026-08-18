// 多语言 SEO 基础设施 —— 语言配置
// 采用「子目录」策略：每个语言一个独立可抓取 URL（/en、/ja …），
// 由 middleware 重写去前缀并注入 x-locale 请求头，页面据此渲染对应译文。

export const locales = ['zh', 'en', 'ja', 'ko', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export interface LocaleMeta {
  code: Locale;
  htmlLang: string; // <html lang> 用，如 zh-CN / en / ja
  hreflang: string; // hreflang 属性用，如 zh-CN / en / ja
  ogLocale: string; // OpenGraph locale 用，如 zh_CN / en_US（下划线格式）
  name: string; // 本地语言自称呼
  englishName: string;
  dir: 'ltr' | 'rtl';
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  zh: { code: 'zh', htmlLang: 'zh-CN', hreflang: 'zh-CN', ogLocale: 'zh_CN', name: '中文', englishName: 'Chinese', dir: 'ltr' },
  en: { code: 'en', htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US', name: 'English', englishName: 'English', dir: 'ltr' },
  ja: { code: 'ja', htmlLang: 'ja', hreflang: 'ja', ogLocale: 'ja_JP', name: '日本語', englishName: 'Japanese', dir: 'ltr' },
  ko: { code: 'ko', htmlLang: 'ko', hreflang: 'ko', ogLocale: 'ko_KR', name: '한국어', englishName: 'Korean', dir: 'ltr' },
  es: { code: 'es', htmlLang: 'es', hreflang: 'es', ogLocale: 'es_ES', name: 'Español', englishName: 'Spanish', dir: 'ltr' },
  fr: { code: 'fr', htmlLang: 'fr', hreflang: 'fr', ogLocale: 'fr_FR', name: 'Français', englishName: 'French', dir: 'ltr' },
};

// hreflang 值映射（用于 alternates.languages 的 key）
export const hreflangMap: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  es: 'es',
  fr: 'fr',
};

export function isLocale(s: string): s is Locale {
  return (locales as readonly string[]).includes(s);
}

// 站点根域名：部署时通过 NEXT_PUBLIC_SITE_URL 覆盖（sitemap / canonical / hreflang 统一跟随）
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';
