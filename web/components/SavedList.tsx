'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useBookmarks, type BookmarkType } from '@/lib/bookmarks';
import { useCompare } from '@/lib/compare';

const TYPE_LABEL: Record<BookmarkType, string> = {
  resource: '资源',
  article: '文章',
  counselor: '咨询师',
};

const TABS: { key: 'all' | BookmarkType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'resource', label: '资源' },
  { key: 'article', label: '文章' },
  { key: 'counselor', label: '咨询师' },
];

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SavedList() {
  const { items, ready, remove } = useBookmarks();
  const { toggle: toggleCompare, has: inCompare } = useCompare();
  const [tab, setTab] = useState<'all' | BookmarkType>('all');
  const [note, setNote] = useState('');

  if (!ready) {
    return (
      <div className="container-page" style={{ padding: '48px 20px', color: 'var(--muted)' }}>
        加载中…
      </div>
    );
  }

  const filtered = tab === 'all' ? items : items.filter((i) => i.type === tab);

  function handleExport() {
    downloadFile('psych-hub-bookmarks.json', JSON.stringify(items, null, 2));
  }

  function handleCompare(id: string) {
    const r = toggleCompare(id);
    if (r === 'full') setNote('对比栏最多放 4 个，先移除一个再添加。');
    else setNote('');
  }

  return (
    <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 900 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>我的收藏</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>
            收藏仅保存在你的浏览器本地，不会上传服务器；换设备或清缓存会丢失。
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className="btn-primary"
            style={{ fontSize: 14 }}
          >
            导出清单
          </button>
        )}
      </div>

      {note && (
        <div
          role="status"
          style={{
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--chip-amber-bg)',
            color: '#a16207',
            fontSize: 13,
          }}
        >
          {note}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 36, marginTop: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>☆</div>
          <h2 style={{ fontSize: 18, margin: '0 0 8px', color: 'var(--ink)' }}>还没有收藏任何内容</h2>
          <p style={{ margin: '0 0 18px', fontSize: 14 }}>
            在资源、文章或咨询师页面点击 ☆ 即可收藏，方便日后回看与对比。
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/resources" className="btn-primary" style={{ fontSize: 14 }}>
              浏览心理资源
            </Link>
            <Link
              href="/counselors"
              className="chip"
              style={{ background: 'var(--chip-bg)', color: 'var(--brand)', textDecoration: 'none', padding: '10px 16px' }}
            >
              找心理咨询师
            </Link>
            <Link
              href="/articles"
              className="chip"
              style={{ background: 'var(--chip-bg)', color: 'var(--brand)', textDecoration: 'none', padding: '10px 16px' }}
            >
              看心理资讯
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 分类切换 Tab */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '20px 0 16px' }}>
            {TABS.map((t) => {
              const count = t.key === 'all' ? items.length : items.filter((i) => i.type === t.key).length;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className="chip"
                  aria-pressed={active}
                  style={{
                    background: active ? 'var(--brand)' : 'var(--surface-2)',
                    color: active ? 'var(--btn-text)' : 'var(--muted)',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                    fontFamily: 'inherit',
                    fontSize: 13,
                  }}
                >
                  {t.label} ({count})
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 28 }}>
              该分类下暂无收藏。
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {filtered.map((i) => (
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="chip" style={{ fontSize: 11, background: 'var(--chip-bg)', color: 'var(--brand)' }}>
                      {TYPE_LABEL[i.type]}
                    </span>
                    {i.type === 'resource' && (
                      <button
                        type="button"
                        onClick={() => handleCompare(i.id)}
                        className="chip"
                        style={{
                          fontSize: 12,
                          cursor: 'pointer',
                          border: '1px solid var(--line)',
                          background: inCompare(i.id) ? 'var(--brand)' : 'var(--card)',
                          color: inCompare(i.id) ? 'var(--btn-text)' : 'var(--ink)',
                          fontFamily: 'inherit',
                        }}
                      >
                        {inCompare(i.id) ? '已加入对比' : '加入对比'}
                      </button>
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
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
