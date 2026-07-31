'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';

interface Props {
  countries: string[];
  languages: string[];
  typeCounts?: Record<string, number>;
}

export default function ResourceFilters({ countries, languages, typeCounts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleType(t: string) {
    update('type', sp.get('type') === t ? '' : t);
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

  const type = sp.get('type') ?? '';
  const q = sp.get('q') ?? '';
  const country = sp.get('country') ?? '';
  const language = sp.get('language') ?? '';
  const tag = sp.get('tag') ?? '';
  const sort = sp.get('sort') ?? '';

  // 当前已激活的筛选条件（导航站常见「已选条件」区，可单独移除）
  const activeChips = [
    type ? { key: 'type', label: `类型：${RESOURCE_TYPE_META[type as keyof typeof RESOURCE_TYPE_META]?.label ?? type}` } : null,
    country ? { key: 'country', label: `国家：${country}` } : null,
    language ? { key: 'language', label: `语言：${language}` } : null,
    tag ? { key: 'tag', label: `标签：${tag}` } : null,
    q ? { key: 'q', label: `搜索：${q}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div style={{ marginBottom: 20 }}>
      {/* 类型快捷标签栏（导航站核心范式：点击即筛选，当前高亮） */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => update('type', '')}
          style={{
            ...chipBase,
            background: type ? 'var(--chip-bg)' : 'var(--brand)',
            color: type ? 'var(--brand)' : 'var(--btn-text)',
            fontWeight: 700,
          }}
        >
          全部
        </button>
        {RESOURCE_TYPES.map((t) => {
          const active = type === t;
          const count = typeCounts?.[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              style={{
                ...chipBase,
                background: active ? 'var(--brand)' : 'var(--chip-bg)',
                color: active ? 'var(--btn-text)' : 'var(--brand)',
                fontWeight: active ? 700 : 500,
              }}
            >
              {RESOURCE_TYPE_META[t].label}
              {count != null && <span style={{ opacity: 0.7, marginLeft: 4, fontSize: 12 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* 搜索 + 精确筛选 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="搜索名称 / 描述 / 标签"
          defaultValue={q}
          onChange={(e) => update('q', e.target.value)}
          style={{ ...base, minWidth: 240 }}
          aria-label="搜索心理资源"
        />
        <select
          aria-label="按国家筛选"
          defaultValue={country}
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
          defaultValue={language}
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
        <select
          aria-label="排序方式"
          defaultValue={sort}
          onChange={(e) => update('sort', e.target.value)}
          style={base}
        >
          <option value="">综合排序</option>
          <option value="featured">精选优先</option>
          <option value="traffic">流量优先</option>
          <option value="name">名称 A-Z</option>
          <option value="newest">最新收录</option>
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
