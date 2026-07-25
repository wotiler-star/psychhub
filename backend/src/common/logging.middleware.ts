import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

// 请求日志中间件：注入请求关联 ID（X-Request-Id）+ 结构化 JSON 访问日志，补齐可观测性基线
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 关联 ID：优先沿用上游透传的 X-Request-Id，否则新生成
    const requestId =
      (req.headers['x-request-id'] as string | undefined)?.trim() || randomUUID();
    (req as Request & { requestId?: string }).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      // 健康检查不计入业务日志，减少噪音
      if (originalUrl.startsWith('/api/health')) return;
      const ms = Date.now() - start;
      // 结构化日志，便于集中采集（Loki / ELK 等）
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'access',
          requestId,
          method,
          path: originalUrl,
          status: res.statusCode,
          durationMs: ms,
          ip: req.ip,
        }),
      );
    });
    next();
  }
}
