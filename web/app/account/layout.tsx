import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '个人中心 | 心理资源聚合',
  description: '管理你的测评历史、收录提交与收藏。',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
