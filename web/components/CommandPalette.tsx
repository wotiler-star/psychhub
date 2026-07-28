'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getResources, getCounselors, getArticles } from '@/lib/api';
import type { Resource, Counselor, Article } from '@/lib/types';

const COMMANDS = [
  { id: '/resources', label: '浏览资源', hint: 'AI / 心理工具' },
  { id: '/counselors', label: '找咨询师', hint: '按议题筛选' },
  { id: '/articles', label: '心理资讯', hint: '科普文章' },
  { id: '/search', label: '全站搜索', hint: '聚合检索' },
  { id: '/submit', label: '提交收录', hint: '推荐好站' },
  { id: '/account', label: '我的账号', hint: '个人中心' },
  { id: '/helplines', label: '心理援助热线', hint: '危机干预' },
  { id: '/assessments', label: '心理测评', hint: '自评量表' },
  { id: '/about', label: '关于本站', hint: '' },
];

type Item = {
  key: string;
  title: string;
  subtitle?: string;
  href: string;
  kind: 'resource' | 'counselor' | 'article' | 'command';
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 打开：⌘K / Ctrl+K 快捷键 + 自定义事件（供 Header 按钮触发）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen as EventListener);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen as EventListener);
    };
  }, []);

  // 打开时重置并聚焦输入框
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // 查询 -> 结果（命令模式 / 搜索模式）
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const q = query.trim();
    if (!q) {
      setItems(
        COMMANDS.map((c) => ({
          key: c.id,
          title: c.label,
          subtitle: c.hint,
          href: c.id,
          kind: 'command' as const,
        })),
      );
      setActive(0);
      return;
    }
    // 命令模式：以 / 开头，按路径/标签过滤快捷跳转
    if (q.startsWith('/')) {
      const needle = q.slice(1).toLowerCase();
      const matches = COMMANDS.filter((c) =>
        (c.id + ' ' + c.label).toLowerCase().includes(needle),
      ).map((c) => ({
        key: c.id,
        title: c.label,
        subtitle: c.hint,
        href: c.id,
        kind: 'command' as const,
      }));
      setItems(matches);
      setActive(0);
      return;
    }
    // 搜索模式：聚合资源 / 咨询师 / 资讯，并始终提供「查看全部结果」入口
    const lc = q.toLowerCase();
    Promise.all([
      getResources({ q }).catch(() => [] as Resource[]),
      getCounselors({}).catch(() => [] as Counselor[]),
      getArticles().catch(() => [] as Article[]),
    ]).then(([resources, counselors, articles]) => {
      if (!alive) return;
      const res: Item[] = [];
      resources.slice(0, 5).forEach((r) =>
        res.push({
          key: 'r-' + r.name,
          title: r.name,
          subtitle: r.description ?? undefined,
          href: `/resources?q=${encodeURIComponent(r.name)}`,
          kind: 'resource',
        }),
      );
      counselors
        .filter((c) => c.name.toLowerCase().includes(lc))
        .slice(0, 4)
        .forEach((c) =>
          res.push({
            key: 'c-' + c.id,
            title: c.name,
            subtitle: (c.specialties || []).join(' / '),
            href: `/counselors/${c.id}`,
            kind: 'counselor',
          }),
        );
      articles
        .filter((a) => (a.title + (a.tags || []).join('')).toLowerCase().includes(lc))
        .slice(0, 4)
        .forEach((a) =>
          res.push({
            key: 'a-' + a.slug,
            title: a.title,
            subtitle: (a.tags || []).join(' / '),
            href: `/articles/${a.slug}`,
            kind: 'article',
          }),
        );
      res.push({
        key: 'all',
        title: `查看「${q}」的全部结果`,
        href: `/search?q=${encodeURIComponent(q)}`,
        kind: 'command',
      });
      setItems(res);
      setActive(0);
    });
    return () => {
      alive = false;
    };
  }, [query, open]);

  // active 项滚动进入视野
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[active];
      if (it) go(it.href);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '12vh',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          id="command-palette-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDownInput}
          placeholder="搜索资源、咨询师、资讯，或输入 / 跳转…"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls="command-palette-list"
          aria-autocomplete="list"
          aria-activedescendant={items[active] ? items[active].key : undefined}
          aria-label="搜索或输入命令跳转"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '16px 18px',
            fontSize: 16,
            border: 'none',
            borderBottom: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          aria-label="搜索结果"
          style={{ maxHeight: 360, overflowY: 'auto', padding: 6 }}
        >
          {items.length === 0 && (
            <div role="presentation" style={{ padding: 16, color: 'var(--muted)' }}>无匹配结果</div>
          )}
          {items.map((it, i) => (
            <div
              key={it.key}
              id={it.key}
              data-idx={i}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(it.href)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: i === active ? 'var(--surface-2)' : 'transparent',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {it.title}
                </div>
                {it.subtitle && (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {it.subtitle}
                  </div>
                )}
              </div>
              <span
                className="chip"
                style={{ background: 'var(--chip-bg)', color: 'var(--brand)', flexShrink: 0 }}
              >
                {it.kind === 'command'
                  ? '跳转'
                  : it.kind === 'resource'
                  ? '资源'
                  : it.kind === 'counselor'
                  ? '咨询师'
                  : '资讯'}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            padding: '8px 14px',
            borderTop: '1px solid var(--line)',
            fontSize: 12,
            color: 'var(--muted)',
          }}
        >
          <span>↑↓ 选择</span>
          <span>↵ 打开</span>
          <span>Esc 关闭</span>
          <span style={{ marginLeft: 'auto' }}>⌘K / Ctrl+K 唤起</span>
        </div>
      </div>
    </div>
  );
}
