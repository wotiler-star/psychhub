import { getArticles } from '@/lib/api';
import { SITE_URL } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let items = '';
  try {
    const articles = await getArticles().catch(() => []);
    items = articles
      .map((a) => {
        const link = `${SITE_URL}/articles/${a.slug}`;
        const pub = a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date().toUTCString();
        return `    <item>
      <title>${esc(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${esc(a.excerpt ?? '')}</description>
      <pubDate>${pub}</pubDate>
      <category>心理资讯</category>
    </item>`;
      })
      .join('\n');
  } catch {
    items = '';
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>心理资源聚合 · 心理资讯</title>
    <link>${SITE_URL}/articles</link>
    <description>中文心理学资源导航与科普平台的心理资讯 RSS 订阅源，聚合科普、研究解读与求助资源。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
