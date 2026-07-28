'use client';

import { useBookmarks, type BookmarkItem } from '@/lib/bookmarks';

export default function BookmarkButton({
  type,
  id,
  title,
  url,
  subtitle,
}: {
  type: BookmarkItem['type'];
  id: string;
  title: string;
  url: string;
  subtitle?: string;
}) {
  const { isBookmarked, toggle, ready } = useBookmarks();
  const active = ready && isBookmarked(type, id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? '取消收藏' : '收藏'}
      title={active ? '取消收藏' : '收藏'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ type, id, title, url, subtitle });
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
        minWidth: 36,
        padding: '0 8px',
        borderRadius: 8,
        border: '1px solid var(--line)',
        background: 'var(--card)',
        color: active ? 'var(--warn)' : 'var(--muted)',
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {active ? '★' : '☆'}
    </button>
  );
}
