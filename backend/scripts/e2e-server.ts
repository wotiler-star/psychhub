// 本地 E2E 启动器：运行真实 AppModule（NestJS 控制器 / 校验管道 / JWT 守卫 / 序列化），
// 仅把 PrismaService 替换为内存 Mock（scripts/prisma.mock.ts），从而无需 PostgreSQL 即可
// 对前端生产路径做"真 NestJS"端到端联调。
//
// 启动：PORT=3001 npx ts-node --transpile-only scripts/e2e-server.ts
// 注意：必须在 import AppModule 之前设置 JWT_SECRET，因为 AppModule 在 import 阶段
// 就会执行 JwtModule.register({ secret: process.env.JWT_SECRET })，晚设会导致签发/验签密钥不一致。
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-dev-secret-change-me';

import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { PrismaService } from '../src/prisma/prisma.service';
import { MockPrismaService } from './prisma.mock';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';

async function bootstrap() {
  // AppModule 延迟 require，确保上面的 JWT_SECRET 在其模块求值前已就绪
  const { AppModule } = require('../src/app.module');

  const mock = new MockPrismaService();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(mock)
    .compile();

  // 镜像 main.ts：生产关闭 Swagger + 启用严格 CSP；非生产保留 Swagger 且 CSP 关
  const isProd = process.env.NODE_ENV === 'production';

  const app = moduleRef.createNestApplication();
  app.enableShutdownHooks(); // 与 main.ts 一致的优雅关闭支持
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              frameAncestors: ["'none'"],
              objectSrc: ["'none'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'"],
              imgSrc: ["'self'", 'data:'],
            },
          }
        : false,
    }),
  );
  app.use(compression()); // 与 main.ts 一致的响应压缩
  app.use(json({ limit: '1mb' })); // 与生产方式一致的 body 限制
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  app.use(
    (err: any, _req: any, res: any, next: (e?: any) => void) => {
      if (err && (err.type === 'entity.too.large' || err.status === 413)) {
        return res.status(413).json({
          statusCode: 413,
          message: '请求体过大（上限 1MB）',
          timestamp: new Date().toISOString(),
        });
      }
      if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({
          statusCode: 400,
          message: '请求体 JSON 格式错误',
          timestamp: new Date().toISOString(),
        });
      }
      next(err);
    },
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3400')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error(`CORS 拒绝来源: ${origin}`), false);
    },
    credentials: true,
  });
  app.setGlobalPrefix('api');

  // 仅非生产环境开放 Swagger（与 main.ts 一致）
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('心理学聚合平台 API (E2E)')
      .setDescription('本地真 NestJS + 内存 Mock Prisma 预览')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.init();

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  const server = app.getHttpServer();
  server.requestTimeout = 30000;
  server.headersTimeout = 35000;
  const shutdown = (signal: string) => {
    console.log(`收到 ${signal}，开始优雅关闭...`);
    app.close().then(() => process.exit(0));
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  console.log(
    `🚀 E2E 后端就绪（真 NestJS + 内存 Mock Prisma，无 PG）: http://localhost:${port}/api`,
  );
  console.log('   演示账号: demo@psychhub.cn / demo1234');
}

bootstrap().catch((e) => {
  console.error('E2E 启动失败:', e);
  process.exit(1);
});
