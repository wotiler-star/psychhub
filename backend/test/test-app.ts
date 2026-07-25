// 测试用应用装配：启动【真实的 AppModule】（控制器 / 管道 / JWT 守卫 / bcrypt / 序列化
// 全部为生产代码），仅把 PrismaService 替换为内存 Mock，从而无需沙箱 PostgreSQL 即可跑通。
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MockPrismaService } from '../scripts/prisma.mock';

export interface TestCtx {
  app: INestApplication;
  server: any;
  mock: MockPrismaService;
}

export async function createTestApp(): Promise<TestCtx> {
  const mock = new MockPrismaService();
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mock)
    .compile();

  const app = moduleRef.createNestApplication();
  // 对齐 main.ts 的启动配置，使测试路由与生产一致：
  app.setGlobalPrefix('api'); // 生产路由在 /api 下
  app.enableCors({ origin: true, credentials: true });
  // 白名单 + 自动转换，让 DTO 校验行为可被测试覆盖
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  await app.init();
  return { app, server: app.getHttpServer(), mock };
}
