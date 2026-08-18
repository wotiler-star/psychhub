import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import CommandPalette from '@/components/CommandPalette';
import Footer from '@/components/Footer';
import CrisisBanner from '@/components/CrisisBanner';
import { AuthProvider } from '@/components/AuthProvider';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { websiteJsonLd, JsonLdScript } from '@/lib/jsonld';
import { getLocaleFromHeader } from '@/i18n/server';
import { locales, localeMeta } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const ogLocale = localeMeta[locale].ogLocale;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: '心理资源聚合 | 中文心理学资源导航与科普平台',
      template: '%s | 心理资源聚合',
    },
    applicationName: '心理资源聚合',
    description:
      '中文心理学资源聚合平台：聚合全球优质心理网站、公益求助热线与公开版权测评，3 次点击内找到所需。不提供在线诊疗，仅做导航与转介。',
    keywords: ['心理学', '心理资源', '心理咨询', '心理测评', '求助热线', '心理健康', 'PHQ-9', 'GAD-7', '焦虑', '抑郁', '失眠', '危机干预'],
    openGraph: {
      type: 'website',
      locale: ogLocale,
      title: '心理资源聚合 | 中文心理学资源导航与科普平台',
      description: '聚合全球优质心理资源、公益求助渠道与公开版权测评的一站式中文平台。',
      siteName: '心理资源聚合',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: '心理资源聚合' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '心理资源聚合 | 中文心理学资源导航与科普平台',
      description: '聚合全球优质心理资源、公益求助渠道与公开版权测评的一站式中文平台。',
      images: [DEFAULT_OG_IMAGE],
    },
    robots: { index: true, follow: true },
    category: 'health',
  };
}

// 视口与浏览器 UI 主题色（明暗两态），避免移动端地址栏闪烁/突兀
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleFromHeader();
  const htmlLang = localeMeta[locale].htmlLang;
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
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        {/* 防闪烁：水合前根据 localStorage / 系统偏好定主题，避免暗色闪白 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var e=document.documentElement;e.setAttribute('data-theme',t);e.style.colorScheme=t;}catch(_){}})();",
          }}
        />
        {/* GEO 发现：供 AI / LLM 爬虫定位站点摘要 */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
        {/* RSS 订阅源发现 */}
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" title="RSS Feed" />
        {/* OpenGraph 备用语言 locale（社交分享卡片多语言提示） */}
        {locales
          .filter((l) => l !== locale)
          .map((l) => (
            <meta key={l} property="og:locale:alternate" content={localeMeta[l].ogLocale} />
          ))}
      </head>
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <a className="skip-link" href="#main-content">跳到主内容</a>
        <AuthProvider>
          <CrisisBanner locale={locale} />
          <Header locale={locale} />
          <CommandPalette />
          <main id="main-content" tabIndex={-1} style={{ flex: 1, outline: 'none' }}>
            {children}
          </main>
          <Footer locale={locale} />
        </AuthProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <JsonLdScript data={websiteJsonLd()} />
      </body>
    </html>
  );
}
