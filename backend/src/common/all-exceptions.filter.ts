import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * 全局异常过滤器：统一 API 错误响应结构，且不向客户端泄露内部细节 / 堆栈。
 * - HttpException：透传其状态码与 message（含 class-validator 的字段级错误数组）。
 * - 其他（含 Prisma / 运行时错误）：返回 500 + 通用文案，仅服务端日志保留堆栈。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = '服务器内部错误';

    if (isHttp) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const maybe = (response as Record<string, unknown>).message;
        if (Array.isArray(maybe)) {
          message = maybe.map((m) => String(m));
        } else if (typeof maybe === 'string') {
          message = maybe;
        }
      }
    } else {
      // 未知异常：仅服务端记录细节，绝不下发
      this.logger.error(
        `未处理异常 @ ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
