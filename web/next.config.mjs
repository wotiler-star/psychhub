/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

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
