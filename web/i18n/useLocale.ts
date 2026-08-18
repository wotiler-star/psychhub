'use client';
import { usePathname } from 'next/navigation';
import { defaultLocale, isLocale, Locale } from './config';

/** 客户端从浏览器 URL 路径（middleware 重写后仍保留 /{locale} 前缀）推断当前语言 */
export function useLocale(): Locale {
  const pathname = usePathname() || '/';
  const parts = pathname.split('/');
  if (parts[1] && isLocale(parts[1])) return parts[1];
  return defaultLocale;
}
