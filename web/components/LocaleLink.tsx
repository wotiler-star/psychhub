'use client';
import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, CSSProperties } from 'react';
import { Locale } from '@/i18n/config';
import { localeFromPath, localizedPath } from '@/i18n/helpers';

interface Props extends Omit<LinkProps, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 服务端透传的语言（SSR 安全，避免依赖 usePathname 在 middleware 重写后丢失前缀） */
  locale?: Locale;
  'aria-label'?: string;
  title?: string;
}

/** 自动为内部链接加上当前语言前缀，保证跨语言内链不断裂（SEO 内部链接） */
export default function LocaleLink({ href, children, locale, ...rest }: Props) {
  const pathname = usePathname() || '/';
  const resolved = locale ?? localeFromPath(pathname);
  const target = localizedPath(typeof href === 'string' ? href : '/', resolved);
  return (
    <Link href={target} {...rest}>
      {children}
    </Link>
  );
}
