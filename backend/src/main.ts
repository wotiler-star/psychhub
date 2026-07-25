import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  // 生产环境：关闭 Swagger（缩小攻击面）+ 启用严格 CSP + 收紧 body 限制
  const isProd = process.env.NODE_ENV === 'production';

  // bodyParser:false 以接管默认解析器，显式设置 1MB 上限（防超大 payload 耗尽内存）
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // 启用生命周期钩子，支持优雅关闭（SIGTERM / SIGINT 时关闭 Nest 并断开 Prisma）
  app.enableShutdownHooks();

  // 安全响应头。生产启用严格 CSP；非生产关闭 CSP 以兼容 Swagger UI 的内联脚本
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

  // 响应压缩（gzip / brotli），减小传输体积；放在 helmet 之后、业务中间件之前
  app.use(compression());

  // 请求体大小限制（json / urlencoded 各 1MB）
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // 捕获 body 解析错误（超限 / 格式错），返回规范状态码（而非 500）
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

  // 全局异常过滤器：统一错误结构，不泄露内部细节 / 堆栈
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局校验管道（R8.2 输入校验）
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  // CORS 白名单（生产通过 ALLOWED_ORIGINS 配置，逗号分隔；缺省仅放行本地前端）
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3400')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      // 允许同源请求（无 Origin，如 curl / 服务端调用）与白名单来源；凭据随请求透传
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS 拒绝来源: ${origin}`), false);
      }
    },
    credentials: true,
  });

  // API 前缀（契约先行：/api 风格，便于演进）
  app.setGlobalPrefix('api');

  // OpenAPI / Swagger：仅非生产环境开放（生产关闭，避免暴露接口契约与 UI）
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('心理学聚合平台 API')
      .setDescription(
        '资源导航 / 求助资源 / 测评 / 心理资讯 / 咨询师目录 / 咨询师评价 / 账号认证 的开放接口（NestJS + Prisma + PostgreSQL）',
      )
      .setVersion('1.0')
      .addBearerAuth() // JWT 亦以 httpOnly Cookie 透传，此处标注令牌形态
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  // 请求超时：防止慢请求/挂起连接长期占用 worker（30s 超时，header 宽限 35s）
  const server = app.getHttpServer();
  server.requestTimeout = 30000;
  server.headersTimeout = 35000;

  // 优雅关闭：收到进程终止信号时先停接收新请求，再关闭 Nest（触发 Prisma onModuleDestroy 断连）
  const shutdown = (signal: string) => {
    console.log(`收到 ${signal}，开始优雅关闭...`);
    app.close().then(() => process.exit(0));
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  console.log(
    `🚀 Backend ready at http://localhost:${port}/api` +
      (isProd ? '  (Swagger 生产已关闭)' : '  (Swagger: /api/docs)'),
  );
}

bootstrap();
