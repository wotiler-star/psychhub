'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * 通用搜索框：受控输入 + 400ms 防抖写入 URL（?q=），保留其它筛选参数并重置分页。
 * 复用于测评 / 资讯 / 咨询师 等列表页，统一搜索体验、避免每键一次触发 SSR。
 */
export default function SearchBox({
  paramName = 'q',
  placeholder = '搜索…',
  width = 200,
}: {
  paramName?: string;
  placeholder?: string;
  width?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [val, setVal] = useState(sp.get(paramName) ?? '');

  useEffect(() => {
    setVal(sp.get(paramName) ?? '');
  }, [sp, paramName]);

  useEffect(() => {
    const cur = sp.get(paramName) ?? '';
    if (val === cur) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (val) params.set(paramName, val);
      else params.delete(paramName);
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val]);

  return (
    <input
      type="search"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      style={{
        minHeight: 36,
        width,
        maxWidth: '100%',
        padding: '0 12px',
        borderRadius: 8,
        border: '1px solid var(--line)',
        fontSize: 14,
        background: 'var(--card)',
        color: 'var(--ink)',
        outline: 'none',
      }}
    />
  );
}
