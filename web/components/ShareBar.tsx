'use client';

// 分享条：复制链接 / 系统分享 / 预览 SEO 分享卡
// 纯客户端小组件，配合 /api/og 动态分享卡使用。
import { useState } from 'react';

interface ShareBarProps {
  /** 分享标题（用于系统分享面板） */
  title: string;
  /** 动态分享卡相对地址，如 /api/og?title=... */
  ogImage?: string;
}

export default function ShareBar({ title, ogImage }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // 剪贴板 API 不可用时回退到 execCommand
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
        return;
      } catch {
        // 用户取消或不支持，回退复制
      }
    }
    copyLink();
  };

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 9999,
    border: '1px solid var(--border, #e2e8f0)',
    background: 'var(--card)',
    color: 'var(--ink)',
    fontSize: 13,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <button type="button" onClick={copyLink} style={btnStyle} aria-live="polite">
        {copied ? '✓ 链接已复制' : '🔗 复制链接'}
      </button>
      <button type="button" onClick={nativeShare} style={btnStyle}>
        📤 分享
      </button>
      {ogImage ? (
        <a
          href={ogImage}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnStyle, textDecoration: 'none' }}
          title="查看社交平台抓取到的分享卡预览图"
        >
          🖼 分享卡预览
        </a>
      ) : null}
    </div>
  );
}
