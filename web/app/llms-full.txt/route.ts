import { getResources, getArticles, getCounselors, getAssessments, getHelplines } from '@/lib/api';
import { SITE_URL } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

function md(str: unknown): string {
  return String(str ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '/')
    .replace(/\[|\]/g, '')
    .trim();
}

export async function GET() {
  const base = SITE_URL;
  const L: string[] = [];
  L.push(`# 心理资源聚合 — 全量站点内容 (llms-full.txt)`);
  L.push('');
  L.push(
    `> 本文件面向 AI / 大型语言模型，提供本站的完整结构化内容，便于准确回答与心理资源、心理测评、求助渠道相关的提问。`,
  );
  L.push('');

  try {
    const [resources, articles, counselors, assessments, helplines] = await Promise.all([
      getResources().catch(() => []),
      getArticles().catch(() => []),
      getCounselors().catch(() => []),
      getAssessments().catch(() => []),
      getHelplines().catch(() => []),
    ]);

    L.push(`# 一、心理资源导航（${resources.length}）`);
    L.push('');
    resources.forEach((r) => {
      L.push(`## ${md(r.name)}`);
      L.push('');
      L.push(`- 网址：${r.url}`);
      L.push(`- 类型：${r.type ?? '未分类'}${r.country ? ' / ' + r.country : ''}${r.language ? ' / ' + r.language : ''}`);
      if (r.description) L.push(`- 简介：${md(r.description)}`);
      if (r.suitableFor) L.push(`- 适合：${md(r.suitableFor)}`);
      if (r.tags.length) L.push(`- 标签：${r.tags.map(md).join('、')}`);
      L.push('');
    });

    L.push(`# 二、心理测评（${assessments.length}）`);
    L.push('');
    assessments.forEach((a) => {
      L.push(`## ${md(a.title)}`);
      L.push('');
      L.push(`- 链接：${base}/assessments/${a.slug}`);
      if (a.description) L.push(`- 简介：${md(a.description)}`);
      if (a.source) L.push(`- 量表来源：${md(a.source)}`);
      if (a.interpretation?.bands?.length) {
        L.push(`- 分级解读：`);
        a.interpretation.bands.forEach((b) => L.push(`  - ${md(b.level)}（≤${b.max} 分）：${md(b.advice)}`));
      }
      L.push(`- 声明：结果仅供参考，不构成医学诊断。`);
      L.push('');
    });

    L.push(`# 三、咨询师与执业者（${counselors.length}）`);
    L.push('');
    counselors.forEach((c) => {
      L.push(`## ${md(c.name)}`);
      L.push('');
      L.push(`- 链接：${base}/counselors/${c.id}`);
      L.push(`- 头衔：${md(c.title ?? '心理咨询师')}`);
      L.push(`- 擅长：${c.specialties.map(md).join('、') || '—'}`);
      if (c.region) L.push(`- 地区：${md(c.region)}${c.remote ? '（支持远程）' : ''}`);
      if (c.pricePerSession != null) L.push(`- 参考价格：${c.pricePerSession} ${c.currency}/次`);
      if (c.bio) L.push(`- 简介：${md(c.bio)}`);
      L.push(`- 说明：本平台仅做信息聚合与转介，不构成诊疗建议。`);
      L.push('');
    });

    L.push(`# 四、心理资讯文章（${articles.length}）`);
    L.push('');
    articles.forEach((a) => {
      L.push(`## ${md(a.title)}`);
      L.push('');
      L.push(`- 链接：${base}/articles/${a.slug}`);
      L.push(`- 分类：${a.category ?? '资讯'}`);
      if (a.excerpt) L.push(`- 摘要：${md(a.excerpt)}`);
      if (a.tags.length) L.push(`- 标签：${a.tags.map(md).join('、')}`);
      if (a.sourceName) L.push(`- 来源：${md(a.sourceName)}${a.sourceUrl ? '（' + a.sourceUrl + '）' : ''}`);
      L.push(`- 正文：`);
      L.push(md(a.content));
      L.push('');
    });

    L.push(`# 五、求助与危机干预热线（${helplines.length}）`);
    L.push('');
    helplines.forEach((h) => {
      const contact = h.phone ? `电话 ${h.phone}` : h.url ? '网址 ' + h.url : '';
      L.push(`- ${md(h.name)}（${md(h.country)}·${md(h.language)}）${contact ? ' — ' + contact : ''}：${md(h.description ?? '')}`);
    });
    L.push('');
    L.push(`> 紧急提示：若你或他人正经历危机，请立即拨打当地危机干预热线或急救电话（中国：心理援助热线 12356；急救 120）。`);
  } catch {
    L.push(`（数据暂不可用，请稍后访问 ${base} 获取完整内容。）`);
  }

  return new Response(L.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
