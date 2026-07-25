import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// 前端组件 / 单元测试配置（Vitest + React Testing Library + jsdom）
// 与 tsconfig 的 paths 对齐：@/* -> 仓库根（web/）
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': root },
  },
  test: {
    // 组件测试需要 DOM 环境
    environment: 'jsdom',
    // 启用全局 describe/it/expect，测试文件更简洁
    globals: true,
    // 统一引入 jest-dom 断言扩展（toBeInTheDocument 等）
    setupFiles: ['./test/setup.ts'],
    // 仅收集 test/ 下的用例，避免误扫业务源码
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    // 组件挂载/卸载较慢，放宽单测超时
    testTimeout: 15000,
  },
});
