/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
