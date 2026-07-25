import request from 'supertest';
import { createTestApp, TestCtx } from './test-app';

describe('Auth 模块 (e2e)', () => {
  let ctx: TestCtx;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const server = () => ctx.server;

  it('注册新用户 → 201 且返回脱敏 user', async () => {
    const res = await request(server())
      .post('/api/auth/register')
      .send({ email: 'new.tester@psychhub.cn', password: 'pw12345', name: '新测试用户' })
      .expect(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('new.tester@psychhub.cn');
    // 绝不回传密码哈希
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('错误密码登录 → 401', async () => {
    await request(server())
      .post('/api/auth/login')
      .send({ email: 'demo@psychhub.cn', password: 'wrong-password' })
      .expect(401);
  });

  it('正确密码登录 → 201 并下发 httpOnly cookie', async () => {
    const res = await request(server())
      .post('/api/auth/login')
      .send({ email: 'demo@psychhub.cn', password: 'demo1234' })
      .expect(201);
    expect(res.body.user.email).toBe('demo@psychhub.cn');
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie.join(';')).toContain('access_token=');
    expect(setCookie.join(';')).toContain('HttpOnly');
  });

  it('未带 cookie 访问 /auth/me → 401', async () => {
    await request(server()).get('/api/auth/me').expect(401);
  });

  it('带 cookie 访问 /auth/me → 200 返回当前用户', async () => {
    const agent = request.agent(server());
    await agent
      .post('/api/auth/login')
      .send({ email: 'demo@psychhub.cn', password: 'demo1234' })
      .expect(201);
    const res = await agent.get('/api/auth/me').expect(200);
    expect(res.body.user.email).toBe('demo@psychhub.cn');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('注册缺少密码 → 400（ValidationPipe 生效）', async () => {
    await request(server())
      .post('/api/auth/register')
      .send({ email: 'bad@psychhub.cn' })
      .expect(400);
  });
});
