import { installProcessGuards } from '../src/common/process-guard';

// 验证进程级异常兜底：注册处理器、触发优雅关闭、且幂等（不会重复注册多个 handler）
// 注意：直接 process.emit('uncaughtException') 会惊动 jest 自身的全局监听，故这里 spy process.on
// 捕获回调函数后单独调用，避免与测试运行器冲突。
describe('installProcessGuards', () => {
  const shutdown = jest.fn();
  const handlers: Record<string, (arg: unknown) => void> = {};

  beforeAll(() => {
    const onSpy = jest.spyOn(process, 'on').mockImplementation((event: string, cb: any) => {
      handlers[event] = cb;
      return process;
    });
    installProcessGuards(shutdown);
    onSpy.mockRestore(); // 恢复 process.on，避免影响后续用例
  });

  it('为 uncaughtException 与 unhandledRejection 注册了处理器', () => {
    expect(typeof handlers['uncaughtException']).toBe('function');
    expect(typeof handlers['unhandledRejection']).toBe('function');
  });

  it('uncaughtException 处理器触发优雅关闭', () => {
    handlers['uncaughtException'](new Error('boom'));
    expect(shutdown).toHaveBeenCalledWith('uncaughtException');
  });

  it('unhandledRejection 处理器触发优雅关闭', () => {
    handlers['unhandledRejection'](new Error('rejected'));
    expect(shutdown).toHaveBeenCalledWith('unhandledRejection');
  });

  it('幂等：重复安装不再调用 process.on 注册额外处理器', () => {
    const onSpy = jest.spyOn(process, 'on');
    installProcessGuards(shutdown); // 已安装过，应为 no-op
    expect(onSpy).not.toHaveBeenCalled();
    onSpy.mockRestore();
  });
});
