import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '收录提交 | 心理资源聚合',
  description:
    '提交一个优质心理学网站或资源，经审核后收录进心理资源聚合导航。共建可信赖的中文心理资源目录。',
  alternates: { canonical: '/submit' },
  robots: { index: true, follow: true },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
