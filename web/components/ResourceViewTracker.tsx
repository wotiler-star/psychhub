'use client';

import { useEffect } from 'react';

export interface ViewedResource {
  id: string;
  name: string;
  url: string;
  subtitle?: string;
  viewedAt: string;
}

const KEY = 'psychhub:recent-resources';
const MAX = 12;

// 记录最近浏览的资源（留存闭环）。渲染为空节点，仅副作用。
export default function ResourceViewTracker({
  id,
  name,
  url,
  subtitle,
}: {
  id: string;
  name: string;
  url: string;
  subtitle?: string;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(KEY);
      const list: ViewedResource[] = raw ? JSON.parse(raw) : [];
      const dedup = list.filter((x) => x.id !== id);
      dedup.unshift({ id, name, url, subtitle, viewedAt: new Date().toISOString() });
      window.localStorage.setItem(KEY, JSON.stringify(dedup.slice(0, MAX)));
    } catch {
      /* ignore */
    }
  }, [id, name, url, subtitle]);

  return null;
}
