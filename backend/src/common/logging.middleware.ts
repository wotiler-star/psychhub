import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

// 请求日志中间件：记录 method / url / 状态码 / 耗时，补齐可观测性基线
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      // 健康检查与静态资源不计入业务日志，减少噪音
      if (originalUrl.startsWith('/api/health')) return;
      const ms = Date.now() - start;
      console.log(`[HTTP] ${method} ${originalUrl} -> ${res.statusCode} (${ms}ms)`);
    });
    next();
  }
}
