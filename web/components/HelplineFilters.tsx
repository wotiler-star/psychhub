'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { HELPLINE_CATEGORY_META } from '@/lib/format';

interface Props {
  countries: string[];
  languages: string[];
}

export default function HelplineFilters({ countries, languages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const base: React.CSSProperties = {
    height: 44,
    padding: '0 12px',
    border: '1px solid var(--line)',
    borderRadius: 10,
    background: 'var(--card)',
    color: 'var(--ink)',
    fontSize: 14,
  };

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
      <select aria-label="按类别筛选" defaultValue={sp.get('category') ?? ''} onChange={(e) => update('category', e.target.value)} style={base}>
        <option value="">全部类别</option>
        {Object.entries(HELPLINE_CATEGORY_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <select aria-label="按国家筛选" defaultValue={sp.get('country') ?? ''} onChange={(e) => update('country', e.target.value)} style={base}>
        <option value="">全部国家</option>
        {countries.map((c) => (<option key={c} value={c}>{c}</option>))}
      </select>
      <select aria-label="按语言筛选" defaultValue={sp.get('language') ?? ''} onChange={(e) => update('language', e.target.value)} style={base}>
        <option value="">全部语言</option>
        {languages.map((l) => (<option key={l} value={l}>{l}</option>))}
      </select>
      {sp.toString() && (
        <button onClick={() => router.push(pathname)} style={{ ...base, cursor: 'pointer', color: 'var(--brand)', borderColor: 'var(--brand)' }}>
          清除筛选
        </button>
      )}
    </div>
  );
}
