'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';

interface Props {
  countries: string[];
}

export default function ResourceFilters({ countries }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // 重置到第一页（此处列表不分页，重置查询即可）
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
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <input
        type="search"
        placeholder="搜索名称 / 描述 / 标签"
        defaultValue={sp.get('q') ?? ''}
        onChange={(e) => update('q', e.target.value)}
        style={{ ...base, minWidth: 240 }}
        aria-label="搜索心理资源"
      />
      <select
        aria-label="按类型筛选"
        defaultValue={sp.get('type') ?? ''}
        onChange={(e) => update('type', e.target.value)}
        style={base}
      >
        <option value="">全部类型</option>
        {RESOURCE_TYPES.map((t) => (
          <option key={t} value={t}>
            {RESOURCE_TYPE_META[t].label}
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
