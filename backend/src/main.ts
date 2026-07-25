import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全响应头（HSTS / X-Frame-Options / X-Content-Type-Options / referrer-policy 等）。
  // 关闭 CSP 以兼容 Swagger UI(/api/docs) 的内联脚本；生产若关闭 Swagger 可改为严格 CSP。
  app.use(helmet({ contentSecurityPolicy: false }));

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

  // API 前缀（契约先行：/api/v1 风格，便于演进）
  app.setGlobalPrefix('api');

  // OpenAPI / Swagger（R6.2 接口契约可视化）
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

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`🚀 Backend ready at http://localhost:${port}/api  (Swagger: /api/docs)`);
}
bootstrap();
