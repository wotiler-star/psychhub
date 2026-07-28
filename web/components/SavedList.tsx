'use client';

import Link from 'next/link';
import { useBookmarks, type BookmarkType } from '@/lib/bookmarks';

const TYPE_LABEL: Record<BookmarkType, string> = {
  resource: '资源',
  article: '文章',
  counselor: '咨询师',
};

export default function SavedList() {
  const { items, ready, remove } = useBookmarks();

  if (!ready) {
    return (
      <div className="container-page" style={{ padding: '48px 20px', color: 'var(--muted)' }}>
        加载中…
      </div>
    );
  }

  const groups = (['resource', 'article', 'counselor'] as const).map((t) => ({
    type: t,
    list: items.filter((i) => i.type === t),
  }));

  return (
    <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>我的收藏</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 24px', fontSize: 14 }}>
        收藏仅保存在你的浏览器本地，不会上传服务器；换设备或清缓存会丢失。
      </p>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
          还没有收藏任何内容。在资源、文章或咨询师页面点击 ☆ 即可收藏。
        </div>
      ) : (
        groups.map(({ type, list }) =>
          list.length ? (
            <section key={type} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>
                {TYPE_LABEL[type]}（{list.length}）
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 12,
                }}
              >
                {list.map((i) => (
                  <div key={i.type + i.id} className="card" style={{ padding: 16, position: 'relative' }}>
                    <Link
                      href={i.url}
                      style={{
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        display: 'block',
                        paddingRight: 28,
                      }}
                    >
                      {i.title}
                    </Link>
                    {i.subtitle && (
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                          marginTop: 6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {i.subtitle}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(i.type, i.id)}
                      aria-label="移除收藏"
                      title="移除"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null,
        )
      )}
    </div>
  );
}
