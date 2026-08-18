// 多语言 SEO 辅助函数（服务端 / 客户端通用，无 'use client'；不含 next/headers，可安全被客户端组件引用）
import { Locale, defaultLocale, isLocale, SITE_URL, hreflangMap } from './config';

/** 去掉路径中的语言前缀，返回干净的业务路径（如 /en/resources -> /resources，/en -> /） */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/');
  if (parts[1] && isLocale(parts[1])) {
    return '/' + parts.slice(2).join('/');
  }
  return pathname;
}

/** 从路径推断当前语言（客户端 usePathname 用） */
export function localeFromPath(pathname: string): Locale {
  const parts = pathname.split('/');
  if (parts[1] && isLocale(parts[1])) return parts[1];
  return defaultLocale;
}

/** 给一个路径加上语言前缀（幂等：已带前缀则保持） */
export function localizedPath(path: string, locale: Locale): string {
  const clean = stripLocale(path || '/');
  if (clean === '/' || clean === '') return `/${locale}`;
  return `/${locale}${clean.startsWith('/') ? clean : '/' + clean}`;
}

/** 由「干净业务路径 + 语言」拼出绝对 URL */
export function localeUrl(locale: Locale, cleanPath: string): string {
  const p = cleanPath === '/' || cleanPath === '' ? '' : cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
  return `${SITE_URL}/${locale}${p}`;
}

/**
 * 生成 Next.js Metadata alternates：canonical + 各语言 hreflang（含 x-default）。
 * 每条 URL 都会带全套 <link rel="alternate" hreflang>，满足 Google 多语言规范。
 */
export function buildAlternates(locale: Locale, path: string) {
  const clean = stripLocale(path || '/');
  const languages: Record<string, string> = {};
  (Object.keys(hreflangMap) as Locale[]).forEach((l) => {
    languages[hreflangMap[l]] = localeUrl(l, clean);
  });
  languages['x-default'] = localeUrl(defaultLocale, clean);
  return {
    canonical: localeUrl(locale, clean),
    languages,
  };
}

/** 一行给页面 metadata 挂上 hreflang 交替链接（canonical + 各语言 + x-default） */
export function localeAlternates(locale: Locale, path: string) {
  return { alternates: buildAlternates(locale, path) };
}
