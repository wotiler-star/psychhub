import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResourceCard from '@/components/ResourceCard';
import type { Resource } from '@/lib/types';

// 构造一个最小可用的 Resource（其余字段用占位值）
function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'r1',
    name: '正念冥想引导',
    url: 'https://example.com/mindfulness',
    type: 'MEDITATION',
    country: '中国',
    language: 'zh',
    description: '每日 10 分钟，缓解焦虑。',
    trafficLevel: '中',
    suitableFor: null,
    tags: ['焦虑', '睡眠', '放松', '白领'],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('组件 ResourceCard', () => {
  it('渲染资源名称与描述', () => {
    render(<ResourceCard resource={makeResource()} />);
    expect(screen.getByText('正念冥想引导')).toBeInTheDocument();
    expect(screen.getByText('每日 10 分钟，缓解焦虑。')).toBeInTheDocument();
  });

  it('外链指向资源 url 且带安全 rel/target', () => {
    render(<ResourceCard resource={makeResource()} />);
    const link = screen.getByRole('link', { name: /正念冥想引导/ });
    expect(link).toHaveAttribute('href', 'https://example.com/mindfulness');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('根据 type 显示中文类型 chip', () => {
    render(<ResourceCard resource={makeResource({ type: 'THERAPY' })} />);
    expect(screen.getByText('在线咨询')).toBeInTheDocument();
  });

  it('展示国家与流量等级', () => {
    render(<ResourceCard resource={makeResource()} />);
    expect(screen.getByText(/🌍 中国/)).toBeInTheDocument();
    expect(screen.getByText(/📈 中/)).toBeInTheDocument();
  });

  it('标签最多显示 3 个', () => {
    render(<ResourceCard resource={makeResource()} />);
    // tags = ['焦虑','睡眠','放松','白领']，应只渲染前 3 个
    expect(screen.getByText('焦虑')).toBeInTheDocument();
    expect(screen.getByText('睡眠')).toBeInTheDocument();
    expect(screen.getByText('放松')).toBeInTheDocument();
    expect(screen.queryByText('白领')).not.toBeInTheDocument();
  });

  it('未知 type 时回退为原枚举值作为标签', () => {
    // 越界值：实际契约不会给，但组件需健壮
    render(
      <ResourceCard resource={makeResource({ type: 'UNKNOWN' as Resource['type'] })} />,
    );
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });

  it('无 country / trafficLevel 时不渲染对应徽标', () => {
    render(
      <ResourceCard
        resource={makeResource({ country: null, trafficLevel: null })}
      />,
    );
    expect(screen.queryByText(/🌍/)).not.toBeInTheDocument();
    expect(screen.queryByText(/📈/)).not.toBeInTheDocument();
  });
});
