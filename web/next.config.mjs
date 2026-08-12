/** @type {import('next').NextConfig} */
// ⚠️ 重要：/api/* 的代理已改为 web/app/api/[[...path]]/route.ts（运行时读取 API_BASE），
//    不再使用本文件的 rewrites() 外部重写。原因：
//    1) output:'standalone' 下 rewrites() 的 destination 会在「构建期」固化进
//       routes-manifest.json，运行时无法再改；一旦构建时 API_BASE 取错（如误用本地
//       dev 的 localhost:3001），线上 /api/* 会全部 500 且无法靠环境变量救回。
//    2) Route Handler 是普通 app 代码，dev/standalone 行为一致，且能正确透传
//       cookie/authorization（真实 NestJS 后端 JWT 鉴权依赖之）与 set-cookie。
//    生产部署如需覆盖后端地址，设运行时环境变量 API_BASE 即可（默认 127.0.0.1:3501）。
const nextConfig = {
  reactStrictMode: true,
  // 不暴露 X-Powered-By 头（减少响应头体积 + 避免泄露技术栈）
  poweredByHeader: false,
  // 独立服务输出，便于容器化（R6 工程化基线）
  output: 'standalone',
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
