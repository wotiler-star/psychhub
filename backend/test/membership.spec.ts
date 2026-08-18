import request from 'supertest';
import { createTestApp, TestCtx } from './test-app';

describe('Membership 模块 (e2e)', () => {
  let ctx: TestCtx;
  const email = `vip.${Date.now()}@psychhub.cn`;
  const password = 'vip-pass-123';
  const name = 'VIP测试用户';

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const server = () => ctx.server;

  it('未登录访问 /api/membership/me → 401', async () => {
    await request(server()).get('/api/membership/me').expect(401);
  });

  it('未登录 POST /api/membership/subscribe → 401', async () => {
    await request(server())
      .post('/api/membership/subscribe')
      .send({ userId: 'x', tier: 'pro', billing: 'yearly' })
      .expect(401);
  });

  it('注册并登录后，初始会员态为 free', async () => {
    const agent = request.agent(server());
    await agent
      .post('/api/auth/register')
      .send({ email, password, name })
      .expect(201);
    const res = await agent.get('/api/membership/me').expect(200);
    expect(res.body.tier).toBe('free');
    expect(res.body.expiresAt).toBeNull();
    expect(Array.isArray(res.body.subscriptions)).toBe(true);
    expect(res.body.subscriptions.length).toBe(0);
  });

  it('升级到 pro（年付）→ 写入 User 会员态 + 落库 Subscription', async () => {
    const agent = request.agent(server());
    await agent
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    const res = await agent
      .post('/api/membership/subscribe')
      .send({ userId: 'ignored-client-value', tier: 'pro', billing: 'yearly', provider: 'mock' });
    expect([200, 201]).toContain(res.status);

    expect(res.body.tier).toBe('pro');
    expect(typeof res.body.expiresAt).toBe('string');
    expect(res.body.expiresAt).not.toBeNull();
    expect(res.body.subscriptionId).toBeDefined();

    // 服务端落库校验：User.membershipTier 已被更新
    const me = await agent.get('/api/membership/me').expect(200);
    expect(me.body.tier).toBe('pro');
    expect(me.body.subscriptions.length).toBeGreaterThanOrEqual(1);
    expect(me.body.subscriptions[0].tier).toBe('pro');
    expect(me.body.subscriptions[0].billing).toBe('yearly');
    expect(me.body.subscriptions[0].status).toBe('active');

    // 直接查 mock 存储，确认 Subscription 记录真实写入
    const subs = ctx.mock.subscription.rows.filter(
      (r: any) => r.tier === 'pro' && r.status === 'active',
    );
    expect(subs.length).toBeGreaterThanOrEqual(1);

    // 确认 userId 以令牌为准（忽略客户端传入的伪造值）
    const userRow = ctx.mock.user.rows.find((r: any) => r.email === email);
    expect(userRow.membershipTier).toBe('pro');
    expect(subs[0].userId).toBe(userRow.id);
  });

  it('非法档位 → 400（ValidationPipe 生效）', async () => {
    const agent = request.agent(server());
    await agent
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);
    await agent
      .post('/api/membership/subscribe')
      .send({ userId: 'x', tier: 'diamond', billing: 'yearly' })
      .expect(400);
  });
});
