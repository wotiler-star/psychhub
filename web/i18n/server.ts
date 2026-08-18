// 服务端专用：从 middleware 注入的 x-locale 请求头读取当前语言。
// 单独成文件，避免 next/headers 被客户端组件（如 LocaleLink 经由 helpers）误打包。
import { headers } from 'next/headers';
import { Locale, defaultLocale, isLocale } from './config';

/** 服务端从 middleware 注入的 x-locale 头读取当前语言（Next 15 headers() 为异步） */
export async function getLocaleFromHeader(): Promise<Locale> {
  const h = (await headers()).get('x-locale');
  return h && isLocale(h) ? h : defaultLocale;
}
