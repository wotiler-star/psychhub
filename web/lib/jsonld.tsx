// 结构化数据（JSON-LD）构造工具——统一供各页面注入 <script type="application/ld+json">
// 同时服务传统 SEO（富媒体摘要）与 GEO（生成式引擎优化，让 LLM 更易懂站点结构）。

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com';

/** WebSite + 站内搜索动作（Sitelinks 搜索框），建议放在根布局 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '心理资源聚合',
    url: SITE_URL,
    inLanguage: 'zh-CN',
    description:
      '中文心理学资源导航与科普平台，聚合全球优质心理网站、公益求助热线与公开版权测评，3 次点击内找到所需。',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** 面包屑导航 */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

/** 列表/集合（ItemList），帮助搜索引擎与 LLM 理解本站聚合了哪些实体 */
export function itemListJsonLd(
  items: { name: string; url: string; description?: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
      ...(it.description ? { description: it.description } : {}),
    })),
  };
}

/** 常见问题（FAQPage），GEO 高价值：AI 回答“心理资源/测评”类提问时可直接引用 */
export function faqJsonLd(qa: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map((x) => ({
      '@type': 'Question',
      name: x.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: x.a,
      },
    })),
  };
}

/** 渲染 JSON-LD 的 <script> 片段（用于服务端组件 JSX 内直接插入） */
export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
