import request from 'supertest';
import { createTestApp, TestCtx } from './test-app';

describe('Counselors 模块 (e2e)', () => {
  let ctx: TestCtx;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const server = () => ctx.server;

  it('GET /api/counselors → 200 且返回 12 位咨询师', async () => {
    const res = await request(server()).get('/api/counselors').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(12);
    expect(res.body[0]).toHaveProperty('name');
  });

  it('GET /api/counselors/:id → 200 返回指定咨询师', async () => {
    const res = await request(server()).get('/api/counselors/c-lin-zhi').expect(200);
    expect(res.body.id).toBe('c-lin-zhi');
    expect(res.body.name).toBe('林知');
  });

  it('GET /api/counselors/不存在 → 404', async () => {
    await request(server()).get('/api/counselors/c-not-exist').expect(404);
  });

  it('GET /api/counselors/:id/reviews → 200 返回该咨询师评价（含 counselorName）', async () => {
    const res = await request(server())
      .get('/api/counselors/c-lin-zhi/reviews')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('counselorName');
    // 所有评价都绑定到该咨询师
    expect(res.body.every((r: any) => r.counselorId === 'c-lin-zhi')).toBe(true);
  });

  it('按关键词筛选 → 200 返回在 姓名/简介/专长 中命中关键词的咨询师', async () => {
    const res = await request(server())
      .get('/api/counselors?q=' + encodeURIComponent('林'))
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    // q 是 OR(name contains / bio contains / specialties has)，放宽断言到命中任一字段
    const hit = (c: any) =>
      (c.name ?? '').includes('林') ||
      (c.bio ?? '').includes('林') ||
      (c.specialties ?? []).includes('林');
    expect(res.body.every(hit)).toBe(true);
  });
});
