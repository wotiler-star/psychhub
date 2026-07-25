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
import helmet from 'helmet';
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

  const app = moduleRef.createNestApplication();
  app.use(helmet({ contentSecurityPolicy: false }));
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
  await app.init();

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(
    `🚀 E2E 后端就绪（真 NestJS + 内存 Mock Prisma，无 PG）: http://localhost:${port}/api`,
  );
  console.log('   演示账号: demo@psychhub.cn / demo1234');
}

bootstrap().catch((e) => {
  console.error('E2E 启动失败:', e);
  process.exit(1);
});
