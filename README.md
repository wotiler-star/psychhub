# 心理学资源聚合平台（Psychology Hub）

> 全球心理学专业领域资源的**中文聚合导航平台**：聚合资讯、知识、测评、工具与服务转介，不做自营在线诊疗。

本仓库为**前后端分离** monorepo（两个独立工程，独立部署，仅通过 REST/OpenAPI 通信）：

```
.
├── backend/   # 后端 API 服务（NestJS + Prisma + PostgreSQL）
├── web/       # 前端站点（Next.js + React + TypeScript + Tailwind）
└── docker-compose.yml
```

## 建设原则（强制约束）
- **前后端分离**：前端（界面/交互）与后端（业务/数据）独立工程、独立部署，仅通过 API 通信（R6.2）。
- **技术栈四原则**：先进 · 合理 · 科学 · 实用。本栈采用 TypeScript 全栈（方案 A）。
- **工程化基线**：类型安全（TS）、容器化（Docker）、CI/CD、可观测性。
- 遵循《网站建设原则规则规律总结 v1.1》与《心理学聚合平台网站建设说明书 v1.0》。

## 技术栈
| 工程 | 技术 | 职责边界 |
|---|---|---|
| 前端 | Next.js 15 + React 19 + TS + Tailwind v4 | 页面渲染（SSR/SSG）、交互、调用 API；不直连数据库 |
| 后端 | NestJS 10 + TS + Prisma | 业务逻辑、持久化、鉴权、API；不渲染页面 |
| 数据 | PostgreSQL 16 + Redis | 关系数据 + 缓存 |
| 检索 | PostgreSQL 全文 / Meilisearch（P2） | 多维检索 |
| 部署 | Docker + CDN | 前后端分别镜像、独立伸缩 |

## 快速开始

### 方式一：一键容器编排（推荐，含 Nginx 反代 → 访问 http://localhost）
```bash
docker compose up -d        # db + backend + web + nginx 全部拉起
# 访问 http://localhost （/api 由 Nginx 转发到后端）
# 后端 Swagger 文档：http://localhost/api/docs
```
> 后端容器启动会自动 `prisma migrate deploy`（按 `prisma/migrations` 迁移建表）+ `prisma db seed` 写入种子数据（来自 TOP50 调研报告）。已生成 `0001_init` 迁移，生产环境改表请新增迁移而非改 `db push`。

### 方式二：本地分离开发
```bash
# 1. 数据库（任选其一：本机 Postgres / 容器仅起 db）
docker compose up -d db

# 2. 后端
cd backend
cp .env.example .env      # DATABASE_URL 指向你的 Postgres
npm install
npx prisma db push        # 按 schema 同步表结构（MVP 免迁移历史）
npm run seed              # 写入种子数据
npm run start:dev        # http://localhost:3001  Swagger: /api/docs

# 3. 前端（另开终端）
cd web
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```
前端通过 `next.config` 的 rewrites 将 `/api/*` 代理到后端，同源调用，无需 CORS。

## MVP 范围与路线

### 一期（已完成）
- ✅ 资源导航目录（导入 TOP50 调研数据，按类型/国家/语言筛选）
- ✅ 心理测评中心（PHQ-9 / GAD-7 公开量表，客户端计分分级）
- ✅ 求助资源库（危机/支持/低价热线，含国内免费热线 + 全站危机干预组件）
- ✅ 关于 / 隐私政策合规页、sitemap、robots

### 二期（已完成 · 内容/资讯聚合 + 测评扩量）
- ✅ 心理资讯聚合页 `/articles`：科普 / 研究 / 资讯三类，列表 + 详情（SSR 真实 HTML + JSON-LD Article）
- ✅ 测评扩量至 8 套公共领域量表：PHQ-9、GAD-7、SDS（抑郁）、SAS（焦虑）、PSS-10（压力）、RSES（自尊）、ISI（睡眠）、WHO-5（幸福感）
- ✅ 首页新增「心理资讯」入口与最新资讯引流
- ✅ 导航新增「心理资讯」（一级栏目 ≤7，符合 R2.1）；sitemap 动态收录资讯路由

### 三期（已完成 · 咨询师目录 + 账号体系 + 社区/评价 + 生产化后端）
- ✅ 咨询师目录 `/counselors`：12 位执业者样本，按议题/地区/远程/价格筛选，详情页含口碑评价
- ✅ 账号体系：`/register` `/login` `/auth/me` —— 注册/登录/退出（JWT 存 httpOnly Cookie，密码 bcrypt 哈希，绝不落明文）
- ✅ 社区与咨询师评价 `/community` + 详情页评价区：登录用户可发表 1-5 星评价，UGC 经 `Review` 模型持久化（含 `counselor` 关联）
- ✅ 生产化后端（NestJS 10 + Prisma 5 + PostgreSQL）：`AuthModule` / `CounselorsModule` / `ReviewsModule` 已全部接入 `AppModule`，`nest build` 通过，运行时 DI 装配自检通过
- ✅ 迁移脚本：`prisma/migrations/0001_init/migration.sql`（一键 `prisma migrate deploy` 或 `db push` 建表）

## 本地预览（无 Docker 环境）
当前开发机无 Docker / 无 PostgreSQL，可用「本地预览数据服务」替代 `docker compose`，
直接喂 `/api/*` 契约数据，前端零改动即可看到带数据的完整站点：
```bash
# 终端1：本地数据服务（端口 3001，无需数据库）
cd backend && npx ts-node scripts/preview-server.ts

# 终端2：前端生产构建并启动（端口 3400）
cd web && npm run build && npm run start -- -p 3400
# 访问 http://localhost:3400  （数据来自 http://localhost:3001）
```
> 生产部署仍是 NestJS + PostgreSQL（`docker compose up`），代码一字未改。

### 本地真 NestJS 端到端联调（无 PG）
上面的「本地预览」用的是 `preview-server.ts`（手写 mock 数据服务）。若要对**真实的 NestJS 后端**（控制器 / ValidationPipe / JWT 守卫 / bcrypt / 序列化全链路）做前端联调，而又没有 PostgreSQL，可用内置的「内存 Mock Prisma」E2E  harness——它启动的是**货真价实的 AppModule**，仅把 `PrismaService` 替换为内存实现（由 `prisma/seed-data.ts` 支撑），无需任何数据库进程：

```bash
# 终1：真 NestJS（内存 Mock Prisma，端口 3001）
cd backend && npx ts-node --transpile-only scripts/e2e-server.ts
#   演示账号：demo@psychhub.cn / demo1234

# 终2：前端生产构建并启动（端口 3400，rewrites 代理 /api → 3001）
cd web && NEXT_PUBLIC_API_BASE=http://localhost:3001 npm run build \
  && npx next start -p 3400
# 访问 http://localhost:3400 —— 前端经 Next 同源代理打到真 NestJS
```

> 说明：沙箱内 PostgreSQL 的 `initdb` 会死锁（见下方「已知限制」），故此 harness 用内存 Mock 替代 DB 层；NestJS 的 HTTP/鉴权/校验/序列化逻辑均为生产代码，可真实验证前端生产路径的契约与认证链路。生产环境仍用真实 PostgreSQL（见「方式一」）。

### 自动化测试
工程基线要求「自动化测试」为必备项。前后端各自维护测试套件，均可在沙箱离线跑通：

**后端**（jest + supertest + @nestjs/testing，复用「内存 Mock Prisma」）——启动**真实的 AppModule**（全部生产代码），仅把 `PrismaService` 替换为内存实现，**无需 PostgreSQL**：

```bash
cd backend
npm test          # 运行全部用例（test/*.spec.ts）
npm run test:watch
```

覆盖用例（4 套件 / 16 用例，全绿）：
- **auth**：注册(201)、错误密码(401)、正确登录(201 + HttpOnly cookie)、未带 cookie 访问 `/auth/me`(401)、带 cookie 访问 `/auth/me`(200)、缺字段注册(400)。
- **counselors**：目录列表(12)、详情、不存在(404)、子路由评价、关键词筛选。
- **reviews**：列表、未登录发表(401)、已登录发表(201 且真实入库)、评分越界(400)。
- **health**：`/api/health` 返回 `db:up`。

测试装配入口见 `test/test-app.ts`；环境准备（含 `JWT_SECRET` 顺序坑）见 `test/setup.ts`。

**前端**（Vitest + React Testing Library + jsdom，React 19 兼容）——覆盖工具函数与展示组件，**无需后端**（数据页均为 `force-dynamic`）：

```bash
cd web
npm test          # vitest run，运行 test/** 下用例
npm run test:watch
```

覆盖用例（3 文件 / 13 用例，全绿）：
- `lib/format.test.ts`：资源/热线分类的中文标签与色板映射、类型列表顺序。
- `components/ResourceCard.test.tsx`：名称/描述渲染、外链 `href` 与 `target=_blank`/`rel=noopener noreferrer`、类型 chip、国家/流量徽标、标签最多 3 个、未知 type 回退、缺失字段不渲染徽标。
- `components/CrisisBanner.test.tsx`：危机提示文案与跳转 `/helplines` 入口（mock `next/link` 以适配非 Next 运行时）。

配置见 `web/vitest.config.ts`（react 插件 + jsdom + `@` 路径别名 + 全局 `describe/it/expect`）；`tsconfig.json` 已 `exclude: ["test"]` 避免 `next build` 类型检查误伤测试全局类型。

### CI/CD
工程基线要求「CI/CD」为必备项。仓库根 `.github/workflows/ci.yml` 在 **push / PR** 到 `main|master|dev` 且改动涉及 `backend/**`、`web/**` 或 `.github/**` 时，于 `ubuntu-latest` 自动执行**两个独立 job**：

**backend job**（working-directory: `backend`）：
1. `npm ci` —— 基于 `backend/package-lock.json` 精确还原依赖。
2. `npx prisma generate` —— 从 `schema.prisma` 生成 `@prisma/client`。
3. `npm run build` —— `nest build` 类型门禁。
4. `npm test` —— `jest` 跑 16 用例（CI 内 `JWT_SECRET`/`NODE_ENV=test`，DB 仍由内存 Mock 替代，**不依赖外部 PostgreSQL**）。

**frontend job**（working-directory: `web`）：
1. `npm ci` —— 基于 `web/package-lock.json` 精确还原依赖。
2. `npm run build` —— `next build` 生产构建（数据页全为 `force-dynamic` + `no-store`，构建期**不请求后端**，可离线通过）。
3. `npm test` —— `vitest run` 跑 13 组件/单元用例。

同一分支并发推送会触发 `concurrency` 取消旧运行以节省资源。本地复刻 CI：

```bash
cd backend && npm ci && npx prisma generate && npm run build && npm test
cd web    && npm ci && npm run build && npm test
```

### 安全加固
后端已落地生产级安全与韧性措施（不依赖外部服务，沙箱可验证）：

- **Helmet 安全响应头**：`main.ts` 中 `app.use(helmet())` 注入 HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy 等。**生产环境启用严格 CSP**（`default-src`/`base-uri`/`frame-ancestors`/`object-src`/`script-src`/`style-src` 均收口 `'self'`，`img-src` 额外放行 `data:`）；**非生产关闭 CSP** 以兼容 Swagger UI 内联脚本。
- **Swagger 仅非生产开放**：`NODE_ENV=production` 时**不挂载** `/api/docs`，缩小生产攻击面（避免暴露接口契约）；开发/预览环境照常开放。
- **请求体限制与超时**：接管默认 bodyParser，json/urlencoded 各限 **1MB**；超限返回语义化 **413**、JSON 格式错返回 **400**（替代笼统 500）；生产环境 `requestTimeout=30s` / `headersTimeout=35s` 防慢连接长期占用 worker。
- **响应压缩**：`helmet` 之后启用 `compression`（gzip / brotli），减小传输体积。
- **优雅关闭**：`app.enableShutdownHooks()` + 监听 `SIGTERM`/`SIGINT`，关闭时触发 `PrismaService.onModuleDestroy` 断开数据库连接，再 `process.exit(0)`，避免强杀丢连接。
- **请求关联 ID + 结构化访问日志**：请求中间件注入/透传 `X-Request-Id`（上游传入则沿用，否则生成 UUID），访问日志输出结构化 JSON（`type/requestId/method/path/status/durationMs/ip`），便于 Loki/ELK 集中采集与链路追踪。
- **全局异常过滤器**（`src/common/all-exceptions.filter.ts`）：统一错误响应为 `{ statusCode, message, timestamp, path }`；`HttpException` 透传其 message（含 class-validator 字段级错误数组），未知异常返回 500 通用文案且**仅在服务端日志保留堆栈**，不向客户端泄露内部细节。
- **登录 / 注册限流**：`AppModule` 注册 `ThrottlerModule`（全局宽松 200/60s 兜底），并以 `APP_GUARD` 注册 `ThrottlerGuard`；`auth.controller.ts` 的 `login`/`register` 用 `@Throttle({ default: { limit: 5, ttl: 60000 } })` 收紧到 5 次/分钟，防密码爆破与批量注册。
- **CORS 白名单**：替换原先 `origin: true`（允许任意源）。`main.ts` 按 `ALLOWED_ORIGINS` 环境变量（逗号分隔，缺省 `http://localhost:3400`）校验来源，且仅白名单来源回写 `Access-Control-Allow-Origin` 并允许凭据；非白名单来源被拒。生产部署通过环境变量注入前端域名。

> 注：`@nestjs/throttler` v5 的 `ThrottlerModule.forRoot` **不会**自动注册全局守卫，必须显式 `providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]`，否则限流不生效（已踩坑）。

## 已知限制（沙箱）
- 本开发机**无法运行 PostgreSQL**：`initdb` 在沙箱进程模型下会卡死（引导目录阶段死锁）；`embedded-postgres` 也会崩溃（`0xC0000005`，缺原生运行时）。因此本地预览/联调用 `preview-server.ts`（mock）或 `e2e-server.ts`（真 NestJS + 内存 Mock Prisma）替代。
- 真 PG 仅在 `docker compose` 生产部署时可用（容器内有正常 PG 运行时）。
