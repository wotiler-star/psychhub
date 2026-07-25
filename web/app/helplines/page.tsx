import type { Metadata } from 'next';
import { getHelplines } from '@/lib/api';
import { HELPLINE_CATEGORY_META } from '@/lib/format';
import HelplineFilters from '@/components/HelplineFilters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '求助资源 | 危机与公益心理热线',
  description:
    '汇总中国与全球心理危机干预、情绪支持与低价求助渠道：含 988、Samaritans、Lifeline 及国内免费热线。关键时刻用得上。',
  alternates: { canonical: '/helplines' },
};

interface SP { country?: string; language?: string; category?: string; }

export default async function HelplinesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const helplines = await getHelplines({
    country: sp.country,
    language: sp.language,
    category: sp.category,
  }).catch(() => []);

  const countries = Array.from(new Set(helplines.map((h) => h.country))).sort();
  const languages = Array.from(new Set(helplines.map((h) => h.language))).sort();

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px' }}>
      <div className="crisis-bar" style={{ borderRadius: 12, marginBottom: 20 }}>
        <div className="container-page" style={{ padding: '10px 20px' }}>
          <strong>⚠ 紧急情况：</strong>若有立即伤害自己或他人的风险，请直接拨打当地急救电话（中国 120 / 110），或见下方危机热线。
        </div>
      </div>

      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>求助资源</h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px', maxWidth: 680 }}>
        当你或身边人需要支持时，这里汇总了可靠的求助渠道。按类别、国家与语言筛选。
      </p>

      <HelplineFilters countries={countries} languages={languages} />

      {helplines.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          暂无助你条件的热线。试试清除筛选。
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {helplines.map((h) => {
            const meta = h.category ? HELPLINE_CATEGORY_META[h.category] : null;
            return (
              <div key={h.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{h.name}</h3>
                  {meta && <span className={`chip ${meta.chip}`}>{meta.label}</span>}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0', lineHeight: 1.7 }}>{h.description}</p>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>🌍 {h.country} · {h.language}</span>
                  {h.phone && (
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)' }}>
                      📞 <a href={`tel:${h.phone.replace(/\s/g, '')}`} style={{ color: 'var(--danger)' }}>{h.phone}</a>
                    </span>
                  )}
                  {h.url && (
                    <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>
                      访问官网 →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
