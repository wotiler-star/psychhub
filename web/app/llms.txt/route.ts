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
  L.push(`# 心理资源聚合 (PsychHub)`);
  L.push('');
  L.push(
    `> 中文心理学资源导航与科普平台。聚合全球优质心理网站、公益求助热线与公开版权测评，帮助用户在 3 次点击内找到可靠的心理资源。我们不提供在线诊疗，仅做信息聚合与转介。`,
  );
  L.push('');
  L.push(`站点地址: ${base}`);
  L.push(`语言: 简体中文 (zh-CN)`);
  L.push('');
  L.push(`## 关于本站`);
  L.push('');
  L.push(
    '- 定位：心理学资源导航 / 科普 / 转介（非诊疗平台）。',
  );
  L.push(
    '- 核心原则：降低寻找成本、守住安全底线（全站常驻危机干预入口）、尊重隐私（测评匿名且免费）。',
  );
  L.push(
    '- 内容基于公开可核查来源（全球心理学网站调研、公共领域量表 PHQ-9 / GAD-7、各国官方危机干预热线）。',
  );
  L.push('');
  L.push(`## 主要栏目`);
  L.push('');
  L.push(`- [资源导航](${base}/resources)：按类型 / 国家 / 语言筛选全球心理学网站。`);
  L.push(`- [心理测评](${base}/assessments)：PHQ-9、GAD-7 等公共领域权威量表，免费匿名自测、即时出分。`);
  L.push(`- [找咨询师](${base}/counselors)：按议题 / 地区 / 价格筛选咨询师与执业者（仅做信息聚合与转介）。`);
  L.push(`- [心理资讯](${base}/articles)：科普、研究解读与求助资源。`);
  L.push(`- [求助资源](${base}/helplines)：危机与公益心理热线（紧急时使用）。`);
  L.push(`- [关于我们](${base}/about)：平台介绍与常见问题解答。`);
  L.push('');

  try {
    const [resources, articles, counselors, assessments, helplines] = await Promise.all([
      getResources().catch(() => []),
      getArticles().catch(() => []),
      getCounselors().catch(() => []),
      getAssessments().catch(() => []),
      getHelplines().catch(() => []),
    ]);

    L.push(`## 精选心理资源 (${resources.length})`);
    L.push('');
    resources
      .slice(0, 50)
      .forEach((r) =>
        L.push(
          `- [${md(r.name)}](${r.url}) — ${[r.type, r.country].filter(Boolean).join(' · ')}${
            r.description ? '：' + md(r.description) : ''
          }`,
        ),
      );
    L.push('');

    L.push(`## 公开版权心理测评 (${assessments.length})`);
    L.push('');
    assessments.forEach((a) =>
      L.push(`- [${md(a.title)}](${base}/assessments/${a.slug}) — ${md(a.description ?? a.type ?? '心理测评')}`),
    );
    L.push('');

    L.push(`## 咨询师与执业者 (${counselors.length})`);
    L.push('');
    counselors
      .slice(0, 40)
      .forEach((c) =>
        L.push(
          `- [${md(c.name)}](${base}/counselors/${c.id}) — ${[c.title, ...c.specialties].filter(Boolean).join(' · ')}`,
        ),
      );
    L.push('');

    L.push(`## 心理资讯文章 (${articles.length})`);
    L.push('');
    articles
      .slice(0, 40)
      .forEach((a) => L.push(`- [${md(a.title)}](${base}/articles/${a.slug}) — ${md(a.excerpt ?? '')}`));
    L.push('');

    if (helplines.length) {
      L.push(`## 求助与危机干预热线 (${helplines.length})`);
      L.push('');
      helplines.forEach((h) => {
        const contact = h.phone ? `电话 ${h.phone}` : h.url ? `[访问](${h.url})` : '';
        L.push(`- ${md(h.name)}（${md(h.country)}·${md(h.language)}）${contact ? ' — ' + contact : ''}：${md(h.description ?? '')}`);
      });
      L.push('');
    }
    L.push(`---`);
    L.push(
      `本文件为面向 AI 与大型语言模型的站点摘要（llms.txt）。更多细节见 ${base}/llms-full.txt。`,
    );
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
