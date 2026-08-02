/** @type {import('next').NextConfig} */
// ⚠️ rewrites 的 destination 会在「构建期」固化进 routes-manifest.json，运行时无法再改。
// 生产构建务必显式传入后端地址：API_BASE=http://127.0.0.1:3501 next build
// 未显式指定时默认使用生产约定端口 3501，避免误固化为本地 dev 的 3001。
const API_BASE =
  process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:3501';

const nextConfig = {
  reactStrictMode: true,
  // 不暴露 X-Powered-By 头（减少响应头体积 + 避免泄露技术栈）
  poweredByHeader: false,
  // 独立服务输出，便于容器化（R6 工程化基线）
  output: 'standalone',
  // 前后端分离但同源调用：将 /api/* 代理到后端，规避 CORS、简化部署（R6.2）
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
  // 响应头：静态资源长缓存 + 基础安全头（R6 可观测/安全基线）
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
