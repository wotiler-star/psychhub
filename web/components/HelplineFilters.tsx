'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HELPLINE_CATEGORY_META } from '@/lib/format';

interface Props {
  countries: string[];
  languages: string[];
}

export default function HelplineFilters({ countries, languages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');

  // URL -> 本地（浏览器前进/后退时同步）
  useEffect(() => {
    setQ(sp.get('q') ?? '');
  }, [sp]);

  // 搜索防抖：停止输入 400ms 后才写入 URL，避免每键一次触发 SSR
  useEffect(() => {
    const cur = sp.get('q') ?? '';
    if (q === cur) return;
    const t = setTimeout(() => update('q', q), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

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
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索热线名称或关键词…"
        aria-label="搜索热线"
        style={{ ...base, minWidth: 220, flex: 1 }}
      />
      <select
        aria-label="按类别筛选"
        defaultValue={sp.get('category') ?? ''}
        onChange={(e) => update('category', e.target.value)}
        style={base}
      >
        <option value="">全部类别</option>
        {Object.entries(HELPLINE_CATEGORY_META).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </select>
      <select
        aria-label="按国家筛选"
        defaultValue={sp.get('country') ?? ''}
        onChange={(e) => update('country', e.target.value)}
        style={base}
      >
        <option value="">全部国家</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        aria-label="按语言筛选"
        defaultValue={sp.get('language') ?? ''}
        onChange={(e) => update('language', e.target.value)}
        style={base}
      >
        <option value="">全部语言</option>
        {languages.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      {sp.toString() && (
        <button
          onClick={() => router.push(pathname)}
          style={{
            ...base,
            cursor: 'pointer',
            color: 'var(--brand)',
            borderColor: 'var(--brand)',
          }}
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
