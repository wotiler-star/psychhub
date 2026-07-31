import { NextResponse } from 'next/server';

// 轻量存活探针：仅用于容器/负载均衡健康检查，不做任何后端取数，
// 因此即使 backend 暂时不可用，web 进程本身仍返回 200（liveness 与 readiness 分离）。
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'web',
    time: new Date().toISOString(),
  });
}
