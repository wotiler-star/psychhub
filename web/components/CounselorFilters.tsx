'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
  specialties: string[];
  regions: string[];
}

const PRICE_TIERS = [
  { label: '不限', value: '' },
  { label: '≤ 400 元', value: '400' },
  { label: '≤ 500 元', value: '500' },
  { label: '≤ 600 元', value: '600' },
  { label: '≤ 800 元', value: '800' },
];

const RATING_TIERS = [
  { label: '评分不限', value: '' },
  { label: '★ 4.5 以上', value: '4.5' },
  { label: '★ 4.8 以上', value: '4.8' },
  { label: '★ 4.9 以上', value: '4.9' },
];

export default function CounselorFilters({ specialties, regions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleSpecialty(s: string) {
    update('specialty', sp.get('specialty') === s ? '' : s);
  }

  function toggleRemote() {
    update('remote', sp.get('remote') === '1' ? '' : '1');
  }

  function clearAll() {
    router.push(pathname);
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

  const chipBase: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 13,
    cursor: 'pointer',
    border: '1px solid transparent',
    fontFamily: 'inherit',
  };

  const specialty = sp.get('specialty') ?? '';
  const region = sp.get('region') ?? '';
  const maxPrice = sp.get('maxPrice') ?? '';
  const minRating = sp.get('minRating') ?? '';
  const remote = sp.get('remote') === '1';
  const sort = sp.get('sort') ?? '';

  // 当前已激活的筛选条件（导航站常见「已选条件」区，可单独移除）
  const activeChips = [
    specialty ? { key: 'specialty', label: `议题：${specialty}` } : null,
    region ? { key: 'region', label: `地区：${region}` } : null,
    maxPrice ? { key: 'maxPrice', label: `价格：≤ ${maxPrice} 元` } : null,
    minRating ? { key: 'minRating', label: `评分：★ ${minRating} 以上` } : null,
    remote ? { key: 'remote', label: '支持远程' } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div style={{ marginBottom: 20 }}>
      {/* 擅长议题快捷标签栏（导航站核心范式：点击即筛选，当前高亮） */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => update('specialty', '')}
          style={{
            ...chipBase,
            background: specialty ? 'var(--chip-bg)' : 'var(--brand)',
            color: specialty ? 'var(--brand)' : 'var(--btn-text)',
            fontWeight: 700,
          }}
        >
          全部
        </button>
        {specialties.map((s) => {
          const active = specialty === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              style={{
                ...chipBase,
                background: active ? 'var(--brand)' : 'var(--chip-bg)',
                color: active ? 'var(--btn-text)' : 'var(--brand)',
                fontWeight: active ? 700 : 500,
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* 地区 + 价格 + 远程 + 排序 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          aria-label="按地区筛选"
          defaultValue={region}
          onChange={(e) => update('region', e.target.value)}
          style={base}
        >
          <option value="">全部地区</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          aria-label="按价格筛选"
          defaultValue={maxPrice}
          onChange={(e) => update('maxPrice', e.target.value)}
          style={base}
        >
          {PRICE_TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          aria-label="按最低评分筛选"
          defaultValue={minRating}
          onChange={(e) => update('minRating', e.target.value)}
          style={base}
        >
          {RATING_TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={toggleRemote}
          style={{
            ...base,
            cursor: 'pointer',
            background: remote ? 'var(--brand)' : 'var(--card)',
            color: remote ? 'var(--btn-text)' : 'var(--ink)',
            fontWeight: remote ? 700 : 500,
          }}
        >
          支持远程
        </button>
        <select
          aria-label="排序方式"
          defaultValue={sort}
          onChange={(e) => update('sort', e.target.value)}
          style={base}
        >
          <option value="">综合排序</option>
          <option value="rating">评分高 → 低</option>
          <option value="price">价格低 → 高</option>
          <option value="featured">精选优先</option>
        </select>
        {sp.toString() && (
          <button
            type="button"
            onClick={clearAll}
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

      {/* 当前已选条件（可单独移除） */}
      {activeChips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {activeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => update(c.key, '')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 13,
                cursor: 'pointer',
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                fontFamily: 'inherit',
              }}
            >
              {c.label}
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>✕</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
