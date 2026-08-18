import type { Metadata } from 'next';
import { faqJsonLd, JsonLdScript } from '@/lib/jsonld';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.about.title },
    description: t.meta.about.desc,
    ...localeAlternates(locale, '/about'),
  };
}

export default async function AboutPage() {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  const FAQ = t.pages.aboutFaq;

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 820 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>{t.sections.about}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
        {t.pages.aboutUpdated}
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20 }}>{t.pages.aboutWho}</h2>
        <p style={{ lineHeight: 1.8 }}>
          {t.pages.aboutWhoText}
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20 }}>{t.pages.aboutGoal}</h2>
        <ul style={{ lineHeight: 1.9 }}>
          <li>{t.pages.aboutGoal1}</li>
          <li>{t.pages.aboutGoal2}</li>
          <li>{t.pages.aboutGoal3}</li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20 }}>{t.pages.aboutEeat}</h2>
        <p style={{ lineHeight: 1.8 }}>
          {t.pages.aboutEeatText}
        </p>
      </section>

      <section className="card" style={{ background: 'var(--surface-3)' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>{t.pages.aboutDisclaimerTitle}</h2>
        <p style={{ color: 'var(--ink)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
          {t.pages.aboutDisclaimerText}{' '}
          <a href={lp('/helplines')} style={{ color: 'var(--danger)' }}>{t.sections.helplines}</a>
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20 }}>{t.pages.aboutFaqTitle}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQ.map((f) => (
            <div key={f.q}>
              <strong style={{ fontSize: 16 }}>{f.q}</strong>
              <p style={{ color: 'var(--muted)', fontSize: 15, margin: '6px 0 0', lineHeight: 1.8 }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <JsonLdScript data={faqJsonLd(FAQ)} />
    </div>
  );
}
