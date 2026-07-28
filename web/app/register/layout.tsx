import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '注册 | 心理资源聚合',
  description: '注册心理资源聚合账号，保存你的测评与收藏。',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
