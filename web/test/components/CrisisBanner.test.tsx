import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// 在非 Next 运行时（Vitest）中，next/link 的真实实现依赖 Next 内部，
// 这里将其替换为一个简单的 <a>，只保留 href，便于断言跳转目标。
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import CrisisBanner from '@/components/CrisisBanner';

describe('组件 CrisisBanner（危机干预条 · P0 合规红线）', () => {
  it('常驻展示危机提示文案', () => {
    render(<CrisisBanner />);
    expect(screen.getByText(/处于危机中？/)).toBeInTheDocument();
    expect(
      screen.getByText(/如有自伤或伤害他人的念头/),
    ).toBeInTheDocument();
  });

  it('提供一键跳转全国 / 全球求助热线的入口', () => {
    render(<CrisisBanner />);
    const link = screen.getByRole('link', { name: /查看全国 \/ 全球求助热线/ });
    expect(link).toHaveAttribute('href', '/helplines');
  });
});
