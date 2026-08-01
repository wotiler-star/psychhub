'use client';

import { useState, useEffect, useCallback } from 'react';

export type BookmarkType = 'resource' | 'article' | 'counselor' | 'helpline';

export interface BookmarkItem {
  type: BookmarkType;
  id: string;
  title: string;
  url: string;
  subtitle?: string;
}

const KEY = 'psych_bookmarks';

function read(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as BookmarkItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: BookmarkItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* 隐私模式 / 配额超限时静默忽略 */
  }
}

/**
 * 收藏（书签）状态 hook：基于 localStorage，跨组件通过
 * `psych-bookmarks-changed` 事件保持同步。SSR 安全（首屏为空，挂载后读取）。
 */
export function useBookmarks() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const handler = () => setItems(read());
    window.addEventListener('psych-bookmarks-changed', handler);
    return () => window.removeEventListener('psych-bookmarks-changed', handler);
  }, []);

  const isBookmarked = useCallback(
    (type: BookmarkType, id: string) => items.some((i) => i.type === type && i.id === id),
    [items],
  );

  const toggle = useCallback((item: BookmarkItem) => {
    const cur = read();
    const idx = cur.findIndex((i) => i.type === item.type && i.id === item.id);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.unshift(item);
    write(cur);
    window.dispatchEvent(new CustomEvent('psych-bookmarks-changed'));
  }, []);

  const remove = useCallback((type: BookmarkType, id: string) => {
    const cur = read().filter((i) => !(i.type === type && i.id === id));
    write(cur);
    window.dispatchEvent(new CustomEvent('psych-bookmarks-changed'));
  }, []);

  return { items, ready, isBookmarked, toggle, remove };
}
