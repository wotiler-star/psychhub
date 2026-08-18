import type { Metadata } from 'next';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.privacy.title },
    description: t.meta.privacy.desc,
    robots: { index: false, follow: true },
    ...localeAlternates(locale, '/privacy'),
  };
}

export default async function PrivacyPage() {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  const p = t.pages;

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 820 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>{t.sections.privacy}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>{p.privacyEffective}</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>{p.p1}</h2>
        <p style={{ lineHeight: 1.8 }}>{p.p1t}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>{p.p2}</h2>
        <p style={{ lineHeight: 1.8 }}>{p.p2t}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>{p.p3}</h2>
        <p style={{ lineHeight: 1.8 }}>{p.p3t}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>{p.p4}</h2>
        <p style={{ lineHeight: 1.8 }}>{p.p4t}</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20 }}>{p.p5}</h2>
        <p style={{ lineHeight: 1.8 }}>{p.p5t}</p>
      </section>

      <section className="card" style={{ background: 'var(--surface-2)' }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>
          {p.privacyNote}
        </p>
      </section>
    </div>
  );
}
