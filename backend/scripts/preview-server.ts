// 本地预览数据服务（无需数据库）
// 用途：在当前环境无法运行 Docker / PostgreSQL 时，向前端提供 /api/* 契约数据，
//       让「带数据的完整站点」可被直接预览。生产环境仍由 NestJS + PostgreSQL 提供（见 docker-compose）。
// 运行：npx ts-node scripts/preview-server.ts   （默认端口 3001）

import http from 'node:http';
import { URL } from 'node:url';
import {
  resources,
  helplines,
  assessments,
  articles,
  counselors,
  reviews,
} from '../prisma/seed-data';

const PORT = Number(process.env.PORT || 3001);

// 内存态存储（预览用；生产由 PostgreSQL 持久化）
// 评价：以种子评价初始化，POST 提交的评价会追加进内存（重启后重置）
let reviewStore: any[] = reviews.map((r) => ({ ...r }));
// 登录会话：内存态（重启后重置），仅用于演示认证契约
let sessionUser: { id: string; name: string; email: string } | null = null;

function send(res: http.ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function filterResources(params: URLSearchParams) {
  const q = (params.get('q') || '').toLowerCase();
  const type = params.get('type') || '';
  const country = params.get('country') || '';
  const language = params.get('language') || '';
  const tag = params.get('tag') || '';
  return resources
    .filter((r) => (type ? r.type === type : true))
    .filter((r) => (country ? r.country === country : true))
    .filter((r) => (language ? r.language === language : true))
    .filter((r) => (tag ? r.tags.includes(tag) : true))
    .filter((r) => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
}

function filterHelplines(params: URLSearchParams) {
  const country = params.get('country') || '';
  const language = params.get('language') || '';
  const category = params.get('category') || '';
  return helplines
    .filter((h) => (country ? h.country === country : true))
    .filter((h) => (language ? h.language === language : true))
    .filter((h) => (category ? h.category === category : true));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const p = url.pathname;
  const params = url.searchParams;
  const method = req.method || 'GET';

  try {
    if (p === '/api/resources' || p === '/api/resources/') {
      return send(res, 200, filterResources(params));
    }
    if (p === '/api/resources/featured') {
      return send(res, 200, resources.filter((r) => r.featured));
    }
    const resMatch = p.match(/^\/api\/resources\/([^/]+)$/);
    if (resMatch) {
      const item = resources.find((r) => r.name === decodeURIComponent(resMatch[1]));
      return item ? send(res, 200, item) : send(res, 404, { error: 'not found' });
    }
    if (p === '/api/helplines' || p === '/api/helplines/') {
      return send(res, 200, filterHelplines(params));
    }
    if (p === '/api/assessments' || p === '/api/assessments/') {
      // 列表不返回题目细节
      return send(
        res,
        200,
        assessments.map(({ questions, interpretation, ...rest }) => rest),
      );
    }
    const assMatch = p.match(/^\/api\/assessments\/([^/]+)$/);
    if (assMatch) {
      const item = assessments.find((a) => a.slug === assMatch[1]);
      return item ? send(res, 200, item) : send(res, 404, { error: 'not found' });
    }
    if (p === '/api/articles' || p === '/api/articles/') {
      return send(res, 200, articles);
    }
    const artMatch = p.match(/^\/api\/articles\/([^/]+)$/);
    if (artMatch) {
      const item = articles.find((a) => a.slug === artMatch[1]);
      return item ? send(res, 200, item) : send(res, 404, { error: 'not found' });
    }
    if (p === '/api/counselors' || p === '/api/counselors/') {
      const specialty = params.get('specialty') || '';
      const region = params.get('region') || '';
      const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : null;
      const remoteOnly = params.get('remote') === '1';
      const list = counselors
        .filter((c) => (specialty ? c.specialties.includes(specialty) : true))
        .filter((c) => (region ? c.region === region : true))
        .filter((c) => (maxPrice != null ? (c.pricePerSession ?? Infinity) <= maxPrice : true))
        .filter((c) => (remoteOnly ? c.remote : true))
        .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
      return send(res, 200, list);
    }
    const couMatch = p.match(/^\/api\/counselors\/([^/]+)$/);
    if (couMatch) {
      const item = counselors.find((c) => c.id === couMatch[1]);
      return item ? send(res, 200, item) : send(res, 404, { error: 'not found' });
    }

    // === 咨询师评价 / 社区 ===
    const revListMatch = p.match(/^\/api\/counselors\/([^/]+)\/reviews$/);
    if (revListMatch) {
      const cid = revListMatch[1];
      const list = reviewStore
        .filter((r) => r.counselorId === cid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return send(res, 200, list);
    }
    if (p === '/api/reviews' || p === '/api/reviews/') {
      if (method === 'POST') {
        if (!sessionUser) return send(res, 401, { error: '请先登录后再发表评价' });
        const body = await readBody(req);
        const counselorId = (body.counselorId || '').toString();
        const rating = Number(body.rating);
        const content = (body.content || '').toString().trim();
        if (!counselors.find((c) => c.id === counselorId)) {
          return send(res, 404, { error: '咨询师不存在' });
        }
        if (!(rating >= 1 && rating <= 5)) return send(res, 400, { error: '评分需为 1-5 的整数' });
        if (content.length < 5) return send(res, 400, { error: '评价内容至少 5 个字' });
        const review = {
          id: 'r-' + Date.now(),
          counselorId,
          authorName: sessionUser.name,
          authorId: sessionUser.id,
          rating,
          content,
          createdAt: new Date().toISOString(),
        };
        reviewStore.unshift(review);
        return send(res, 200, { review });
      }
      // GET 社区评价流（可带 authorId 过滤「我的评价」）
      const authorId = params.get('authorId') || '';
      let list = authorId ? reviewStore.filter((r) => r.authorId === authorId) : reviewStore.slice();
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const withName = list.map((r) => ({
        ...r,
        counselorName: counselors.find((c) => c.id === r.counselorId)?.name ?? '未知咨询师',
      }));
      return send(res, 200, withName);
    }

    // === 认证（演示用内存会话；生产由 NestJS + Auth 提供）===
    if (p === '/api/auth/me') {
      if (method === 'POST') {
        sessionUser = null;
        return send(res, 200, { user: null });
      }
      return send(res, 200, { user: sessionUser });
    }
    if (p === '/api/auth/login') {
      const body = await readBody(req);
      const email = (body.email || '').toString();
      if (!email) return send(res, 400, { error: '邮箱必填' });
      const name = (body.name || sessionUser?.name || email.split('@')[0]).toString();
      sessionUser = { id: sessionUser?.id || 'u-' + Date.now(), name, email };
      return send(res, 200, { user: sessionUser });
    }
    if (p === '/api/auth/register') {
      const body = await readBody(req);
      const email = (body.email || '').toString();
      const name = (body.name || email.split('@')[0]).toString();
      if (!email) return send(res, 400, { error: '邮箱必填' });
      sessionUser = { id: 'u-' + Date.now(), name, email };
      return send(res, 200, { user: sessionUser });
    }

    if (p === '/api/health') {
      return send(res, 200, { ok: true, source: 'preview-data-server' });
    }
    return send(res, 404, { error: 'route not found' });
  } catch (e) {
    return send(res, 500, { error: String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`本地预览数据服务已启动: http://localhost:${PORT}`);
  console.log(
    `  资源 ${resources.length} 条 / 求助 ${helplines.length} 条 / 测评 ${assessments.length} 个 / 咨询师 ${counselors.length} 位 / 评价 ${reviewStore.length} 条`,
  );
});
