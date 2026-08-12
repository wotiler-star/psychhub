// 后端 API 代理：把同源的 /api/* 请求转发到真实后端（API_BASE，默认 127.0.0.1:3501）。
//
// 为什么用 Route Handler 而不是 next.config 的 rewrites() 外部重写？
//   - output: 'standalone' 下，rewrites() 指向「外部 http URL」在部分 Next 版本无法正确代理
//     （线上表现为 /api/* 全部 500），且 next.config 中的 async 函数在 standalone server.js
//     被 JSON 序列化时会丢失。
//   - 本 Route Handler 是普通 app 代码，dev / standalone 行为一致，且能正确透传
//     cookie / authorization（真实 NestJS 后端的 JWT 鉴权依赖之）与 set-cookie（登录写回）。
//
// 浏览器侧用相对路径 /api/...（同源，无 CORS）；SSR 侧仍由 lib/api.ts 直接 fetch
// API_BASE 绝对地址，不经过此代理。
import { NextRequest } from 'next/server';

const API_BASE =
  process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:3501';

export const runtime = 'nodejs';
// 每次实时转发，禁止静态化 / 缓存
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  const sub = path && path.length ? path.join('/') : '';
  const target = new URL(`/api/${sub}${req.nextUrl.search}`, API_BASE);

  // 仅透传对上游有意义的请求头，避免 host / content-length / connection 冲突
  const forward = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lk = k.toLowerCase();
    if (
      lk === 'host' ||
      lk === 'connection' ||
      lk === 'content-length' ||
      lk === 'transfer-encoding' ||
      lk === 'upgrade-insecure-requests'
    ) {
      continue;
    }
    forward.set(k, v);
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method: req.method,
      headers: forward,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (e) {
    console.error('[api-proxy] upstream fetch failed:', target.toString(), e);
    return new Response(
      JSON.stringify({ error: 'proxy_failed', detail: String(e) }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  // fetch 已按 content-encoding 解码，exposed headers 不再含 content-encoding /
  // content-length；仅丢弃代理层无关头，其余原样回传（含 set-cookie）
  const respHeaders = new Headers();
  for (const [k, v] of upstream.headers.entries()) {
    const lk = k.toLowerCase();
    if (lk === 'transfer-encoding' || lk === 'connection') continue;
    respHeaders.set(k, v);
  }

  const buf = await upstream.arrayBuffer();
  return new Response(buf, { status: upstream.status, headers: respHeaders });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
