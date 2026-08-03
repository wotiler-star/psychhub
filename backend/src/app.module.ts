import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ResourcesModule } from './resources/resources.module';
import { HelplinesModule } from './helplines/helplines.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ArticlesModule } from './articles/articles.module';
import { CounselorsModule } from './counselors/counselors.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MembershipModule } from './membership/membership.module';
import { LoggingMiddleware } from './common/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 全局限流（宽松，仅兜底异常流量）；登录/注册由 @Throttle 收紧到 5/60s 防爆破
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 200 }],
    }),
    PrismaModule,
    ResourcesModule,
    HelplinesModule,
    AssessmentsModule,
    ArticlesModule,
    CounselorsModule,
    ReviewsModule,
    AuthModule,
    HealthModule,
    MembershipModule,
  ],
  // v5 的 ThrottlerModule.forRoot 不会自动注册全局守卫，需显式以 APP_GUARD 注册
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
