import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '登录 | 心理资源聚合',
  description: '登录心理资源聚合，管理你的测评历史、收录提交与收藏。',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
