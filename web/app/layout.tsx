import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CrisisBanner from '@/components/CrisisBanner';
import { AuthProvider } from '@/components/AuthProvider';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '心理资源聚合 | 中文心理学资源导航与科普平台',
    template: '%s | 心理资源聚合',
  },
  description:
    '中文心理学资源聚合平台：聚合全球优质心理网站、公益求助热线与公开版权测评，3 次点击内找到所需。不提供在线诊疗，仅做导航与转介。',
  keywords: ['心理学', '心理资源', '心理咨询', '心理测评', '求助热线', '心理健康', 'PHQ-9', 'GAD-7'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    title: '心理资源聚合 | 中文心理学资源导航与科普平台',
    description: '聚合全球优质心理资源、公益求助渠道与公开版权测评的一站式中文平台。',
    siteName: '心理资源聚合',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '心理资源聚合',
    url: SITE_URL,
    description:
      '中文心理学资源导航与科普平台，聚合全球优质心理资源、公益求助热线与公开版权测评。',
    slogan: '3 次点击内，找到你需要的心理资源',
  };
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AuthProvider>
          <CrisisBanner />
          <Header />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </AuthProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
