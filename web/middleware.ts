import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isLocale, Locale } from '@/i18n/config';

// 无需语言前缀、直接放行的路径（API / 静态 / 非公开应用路由 / 发现类文件）
const PASSTHROUGH = [
  '/api',
  '/_next',
  '/healthz',
  '/robots.txt',
  '/sitemap.xml',
  '/rss.xml',
  '/llms.txt',
  '/llms-full.txt',
];
const NO_LOCALE_APP = ['/account', '/login', '/register', '/saved', '/membership'];

function hasLocalePrefix(pathname: string): boolean {
  return locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
}

function isPassthrough(pathname: string): boolean {
  if (PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
  if (NO_LOCALE_APP.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
  // 带扩展名的静态资源（图标、manifest、图片等）
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

function detectLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && isLocale(cookie)) return cookie;
  const accept = req.headers.get('accept-language')?.toLowerCase() || '';
  // 依次匹配，优先完整语言码
  for (const l of locales) {
    if (accept.includes(l)) return l;
  }
  return defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  // 已带语言前缀：重写去前缀，注入 x-locale 头供页面/metadata 读取，并写 cookie 供客户端用
  if (hasLocalePrefix(pathname)) {
    const locale = pathname.split('/')[1] as Locale;
    const rest = pathname.slice(locale.length + 1) || '/';
    const headers = new Headers(req.headers);
    headers.set('x-locale', locale);
    const url = req.nextUrl.clone();
    url.pathname = rest === '/' ? '/' : rest;
    const res = NextResponse.rewrite(url, { request: { headers } });
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // 未带前缀的公共路径：按 cookie / Accept-Language 重定向到对应语言版本（301  consolidates 规范 URL）
  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 排除 API / 静态 / 发现文件，其余路径均经 middleware
  matcher: ['/((?!_next|api|healthz|robots\\.txt|sitemap\\.xml|rss\\.xml|llms\\.txt|llms-full\\.txt).*)'],
};
