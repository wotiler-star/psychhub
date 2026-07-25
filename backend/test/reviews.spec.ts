import request from 'supertest';
import { createTestApp, TestCtx } from './test-app';

describe('Reviews 模块 (e2e)', () => {
  let ctx: TestCtx;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const server = () => ctx.server;

  const login = async () => {
    const agent = request.agent(server());
    await agent
      .post('/api/auth/login')
      .send({ email: 'demo@psychhub.cn', password: 'demo1234' })
      .expect(201);
    return agent;
  };

  it('GET /api/reviews → 200 返回种子评价（含 counselorName）', async () => {
    const res = await request(server()).get('/api/reviews').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(14);
    expect(res.body[0]).toHaveProperty('counselorName');
  });

  it('未登录 POST /api/reviews → 401（JWT 守卫生效）', async () => {
    await request(server())
      .post('/api/reviews')
      .send({ counselorId: 'c-lin-zhi', rating: 5, content: '匿名评价' })
      .expect(401);
  });

  it('已登录 POST /api/reviews → 201 且评价真实入库（数量 +1）', async () => {
    const agent = await login();
    const before = (await request(server()).get('/api/reviews')).body.length;
    const res = await agent
      .post('/api/reviews')
      .send({ counselorId: 'c-lin-zhi', rating: 5, content: '自动化测试提交的评价' })
      .expect(201);
    expect(res.body.review.id).toBeDefined();
    expect(res.body.review.content).toBe('自动化测试提交的评价');
    const after = (await request(server()).get('/api/reviews')).body.length;
    expect(after).toBe(before + 1);
  });

  it('评价 rating 越界 → 400（DTO 校验生效）', async () => {
    const agent = await login();
    await agent
      .post('/api/reviews')
      .send({ counselorId: 'c-lin-zhi', rating: 9, content: '越界评分' })
      .expect(400);
  });
});
