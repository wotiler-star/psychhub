import type { Metadata } from 'next';
import SavedList from '@/components/SavedList';
import { breadcrumbJsonLd, JsonLdScript } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: '我的收藏 | 心理资源聚合',
  description: '查看你在本站收藏的资源、文章与咨询师。',
  robots: { index: false, follow: false },
  alternates: { canonical: '/saved' },
};

export default function SavedPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: '首页', url: '/' },
          { name: '我的收藏', url: '/saved' },
        ])}
      />
      <SavedList />
    </>
  );
}
