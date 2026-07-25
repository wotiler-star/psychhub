import request from 'supertest';
import { createTestApp, TestCtx } from './test-app';

describe('Health 健康检查 (e2e)', () => {
  let ctx: TestCtx;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/health → 200 且 db=up（内存探活）', async () => {
    const res = await request(ctx.server).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
    expect(res.body).toHaveProperty('uptime');
  });
});
