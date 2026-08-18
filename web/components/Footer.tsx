'use client';
import LocaleLink from '@/components/LocaleLink';
import { getDict } from '@/i18n/dictionaries';
import { Locale } from '@/i18n/config';

const HEADINGS: Record<Locale, { nav: string; legal: string }> = {
  zh: { nav: '导航', legal: '法律' },
  en: { nav: 'Navigate', legal: 'Legal' },
  ja: { nav: 'ナビ', legal: '法定' },
  ko: { nav: '둘러보기', legal: '법적' },
  es: { nav: 'Navegar', legal: 'Legal' },
  fr: { nav: 'Naviguer', legal: 'Légal' },
};

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const h = HEADINGS[locale];
  return (
    <footer
      style={{
        marginTop: 48,
        borderTop: '1px solid var(--line)',
        background: 'var(--card)',
      }}
    >
      <div
        className="container-page"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'space-between',
          padding: '32px 20px',
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>{t.siteName}</div>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{t.tagline}</p>
        </div>
        <nav aria-label="页脚导航" style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{h.nav}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <LocaleLink href="/resources" locale={locale} style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t.sections.resources}
              </LocaleLink>
              <LocaleLink href="/assessments" locale={locale} style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t.sections.assessments}
              </LocaleLink>
              <LocaleLink href="/helplines" locale={locale} style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t.sections.helplines}
              </LocaleLink>
              <LocaleLink href="/about" locale={locale} style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t.sections.about}
              </LocaleLink>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{h.legal}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <LocaleLink href="/privacy" locale={locale} style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t.sections.privacy}
              </LocaleLink>
              <LocaleLink href="/helplines" locale={locale} style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t.sections.helplines}
              </LocaleLink>
            </div>
          </div>
        </nav>
      </div>
      <div
        className="container-page"
        style={{
          color: 'var(--muted)',
          fontSize: 13,
          padding: '16px 20px',
          borderTop: '1px solid var(--line)',
        }}
      >
        © {new Date().getFullYear()} {t.siteName} · {t.common.disclaimer}
      </div>
    </footer>
  );
}
