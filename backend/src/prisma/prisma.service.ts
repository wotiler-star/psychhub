import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient } from '../common/prisma-sqlite';

/**
 * PrismaService：注入式数据库客户端。
 * 运行时用「带数组/JSON 兼容扩展的 PrismaClient」替换默认实例（见 prisma-extensions.ts），
 * 该扩展对 SQLite 与 MySQL/MariaDB 均适用。
 * 通过 Proxy 把资源/方法调用转发到扩展客户端，同时保留 Nest 生命周期钩子。
 * 继承 PrismaClient 仅为让注入了本服务的地方在 TS 上能直接访问 .resource / .counselor 等。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;
  private readonly _onInit = async () => {
    await this.client.$connect();
  };
  private readonly _onDestroy = async () => {
    await this.client.$disconnect();
  };

  constructor() {
    super();
    this.client = createPrismaClient();
    // 返回 Proxy：生命周期方法走本实例，其余一律转发到扩展客户端（含 $connect/$disconnect）
    return new Proxy(this, {
      get(target, prop, _receiver) {
        if (prop === 'client') return (target as any).client;
        if (prop === 'onModuleInit') return (target as any)._onInit;
        if (prop === 'onModuleDestroy') return (target as any)._onDestroy;
        const v = (target as any).client[prop];
        return typeof v === 'function' ? v.bind((target as any).client) : v;
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
