import { Logger } from '@nestjs/common';

// 进程级兜底：捕获 Node 全局未处理异常，记录后触发优雅关闭，避免进程静默崩溃或处于不一致状态。
// 注意：这些事件属于"致命、不可恢复"的范畴，最佳实践是先落日志再退出，由容器/进程管理器（k8s/docker/systemd）重启。
const logger = new Logger('ProcessGuard');

// 防止测试或热重载场景下重复注册导致多次退出
let installed = false;

function formatReason(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.stack || reason.message;
  }
  return String(reason);
}

/**
 * 安装进程级异常兜底。
 * @param shutdown 优雅关闭回调（通常由 Nest app.close() + process.exit 组成）
 */
export function installProcessGuards(shutdown: (signal: string) => void): void {
  if (installed) return;
  installed = true;

  process.on('uncaughtException', (error: Error) => {
    logger.error(
      `未捕获异常 (uncaughtException)，准备优雅关闭: ${error?.stack || error?.message || error}`,
    );
    try {
      shutdown('uncaughtException');
    } catch (e) {
      logger.error(`优雅关闭失败: ${(e as Error)?.message || e}`);
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error(
      `未处理的 Promise 拒绝 (unhandledRejection)，准备优雅关闭: ${formatReason(reason)}`,
    );
    try {
      shutdown('unhandledRejection');
    } catch (e) {
      logger.error(`优雅关闭失败: ${(e as Error)?.message || e}`);
      process.exit(1);
    }
  });
}
