// Vitest 全局 setup：将 jest-dom 的 DOM 断言（toBeInTheDocument 等）
// 挂到 Vitest 的 expect 上，组件测试里可直接使用。
import '@testing-library/jest-dom/vitest';
