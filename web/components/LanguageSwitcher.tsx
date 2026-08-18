'use client';
import { usePathname } from 'next/navigation';
import { locales, localeMeta, Locale } from '@/i18n/config';
import { localizedPath, stripLocale } from '@/i18n/helpers';

/** 语言切换器：列出 6 语言，互链同页（保留当前路径），带 hreflang/lang 属性，并高亮当前语言 */
export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '/';
  const clean = stripLocale(pathname);
  return (
    <div
      className="lang-switcher"
      aria-label="Language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        marginLeft: 6,
      }}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <a
            key={l}
            href={localizedPath(clean === '/' ? '/' : clean, l)}
            hrefLang={localeMeta[l].hreflang}
            lang={localeMeta[l].htmlLang}
            title={localeMeta[l].englishName}
            aria-current={active ? 'true' : undefined}
            style={{
              fontSize: 13,
              padding: '4px 7px',
              borderRadius: 6,
              color: active ? 'var(--brand)' : 'var(--muted)',
              fontWeight: active ? 700 : 400,
              textDecoration: 'none',
              border: '1px solid',
              borderColor: active ? 'var(--brand)' : 'transparent',
              background: active ? 'var(--surface-2)' : 'transparent',
            }}
          >
            {localeMeta[l].name}
          </a>
        );
      })}
    </div>
  );
}
