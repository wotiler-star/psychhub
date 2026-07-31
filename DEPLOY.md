# 生产部署指南（DEPLOY.md）

> 本文档适用于将「心理学资源聚合平台」部署到生产环境。面向运维/后端工程师，覆盖架构、环境变量、一键部署、TLS、CDN、数据库运维、回滚、监控与安全清单。
>
> 项目为**前后端分离** monorepo，两个独立工程（`backend/` NestJS + `web/` Next.js），仅通过 REST API 通信，分别容器化、独立伸缩。

---

## 0. 架构总览

```
互联网用户
   │  HTTPS (443)
   ▼
[ CDN ]──── 静态资源缓存（_next/static、图片）
   │  回源 HTTP/HTTPS
   ▼
[ Nginx ]──── TLS 终止 + 反向代理（容器 psych-hub-nginx）
   │  /        → web:3000   (Next.js SSR/SSG)
   │  /api/    → backend:3001 (NestJS API)
   ▼
[ web 容器 ]   [ backend 容器 ]
   │                │ rewrites /api → backend（同源，规避浏览器 CORS）
   │                ▼
   └─────────► [ PostgreSQL 16 ]（容器 psych-hub-db，持久卷 pgdata）
```

### 组件职责
| 组件 | 镜像/技术 | 端口 | 职责 |
|---|---|---|---|
| **nginx** | `nginx:1.27-alpine` | 80（宿主） | TLS 终止、反代 `/`→web、`/api/`→backend、设置 `X-Forwarded-*` |
| **web** | Next.js 15 standalone（多阶段构建） | 3000（容器内） | SSR/SSG 页面渲染；`/api/*` 经 rewrites 同源代理到 backend |
| **backend** | NestJS 10 + Prisma 5（node:20-alpine） | 3001（容器内） | 业务逻辑、鉴权（JWT httpOnly Cookie）、限流、OpenAPI（非生产） |
| **db** | `postgres:16-alpine` | 5432（容器内） | 关系数据持久化；启动时 `prisma migrate deploy` 自动建表 |

### 启动顺序与依赖
`db`（healthcheck `pg_isready`）→ `backend`（`depends_on: db service_healthy`，启动即 `migrate deploy` + `db seed`）→ `web`（`depends_on: backend`）→ `nginx`（`depends_on: web, backend`）。任一前置不健康，后续不启动。

### 网络与同源策略
- 浏览器只与 nginx 通信（单源），`/api/*` 由 nginx 转发到 backend，**或** 由 web 的 Next.js rewrites 服务端代理到 backend（容器网络内 `http://backend:3001`）。
- backend 的 CORS 白名单（`ALLOWED_ORIGINS`）仅对**跨源直连**生效；经 nginx/web 同源代理的请求不走 CORS。生产推荐同源代理，CORS 作为额外兜底。

---

## 1. 先决条件

### 服务器
- **OS**：Linux x86_64（Ubuntu 22.04 / Debian 12 / CentOS Stream 推荐）
- **配置**：≥ 2 vCPU / 4 GB RAM / 40 GB SSD（含 PostgreSQL 与镜像）
- **软件**：
  - Docker Engine ≥ 24.0
  - Docker Compose v2（`docker compose` 子命令，非旧版 `docker-compose`）
  - `git`、`openssl`（生成密钥）
- **域名**：已备案的顶级域名（如 `psychhub.example.com`），A 记录指向服务器公网 IP
- **TLS 证书**：Let's Encrypt（免费）或 CDN 回源证书

### 本地准备
```bash
git clone <repo-url> psychhub && cd psychhub
```

---

## 2. 环境变量清单（生产必填）

在**项目根**创建 `.env`（与 `docker-compose.yml` 同级，供 Compose 读取）。**严禁提交真实密钥到仓库**。

```bash
# ─── 数据库凭据（生产务必改强密码）───
POSTGRES_USER=psych
POSTGRES_PASSWORD=<强密码，openssl rand -hex 24>
POSTGRES_DB=psychhub

# ─── 后端 ───
# JWT 签发密钥：强随机 32+ 位（openssl rand -hex 32）
JWT_SECRET=<openssl rand -hex 32 生成的值>
# 放行的前端源（逗号分隔）。同源代理下可填 nginx 对外域名
ALLOWED_ORIGINS=https://psychhub.example.com
# NODE_ENV 已在 docker-compose.yml 固定为 production，无需在此重复
```

### 变量对照表
| 变量 | 作用 | 生产取值 | 必填 | 在哪用 |
|---|---|---|---|---|
| `NODE_ENV` | 运行模式；`production` 触发 Swagger 关闭 + 严格 CSP + HSTS | `production`（compose 已固定） | 是 | `backend/src/main.ts` |
| `DATABASE_URL` | Prisma 连接串 | `postgresql://psych:<pw>@db:5432/psychhub?schema=public` | 是 | Prisma、由 compose 拼接 |
| `JWT_SECRET` | 用户 JWT 签发/验签密钥 | 强随机 32+ 位 | 是 | `AuthModule` |
| `ALLOWED_ORIGINS` | CORS 白名单（逗号分隔） | `https://你的域名` | 是 | `main.ts` CORS |
| `POSTGRES_USER/PASSWORD/DB` | PG 容器初始化凭据 | 强密码 | 是 | `db` 服务 + `DATABASE_URL` 拼接 |
| `PORT` | backend 监听端口 | `3001`（compose 固定） | 是 | `main.ts` |
| `NEXT_PUBLIC_API_BASE` | web 构建时 rewrites 目标 | `http://backend:3001`（compose 固定，容器网络） | 是 | `web/next.config.mjs` |

> ⚠️ `NEXT_PUBLIC_API_BASE` 用容器网络地址 `http://backend:3001` 是**服务端 rewrites 代理**用的，不会暴露给浏览器（前端代码用相对 `/api`）。无需改为公网域名。

---

## 3. 一键部署（docker compose）

### 3.1 准备环境变量
```bash
cp backend/.env.example .env   # 仅作模板，必须编辑
vim .env                        # 按 §2 填入生产值
```

### 3.2 构建并启动
```bash
docker compose up -d --build
```
首次会构建 `backend`、`web` 镜像并拉取 `postgres`、`nginx`。backend 容器启动命令为：
```
npx prisma migrate deploy && npx prisma db seed && node dist/main.js
```
即：**按 `prisma/migrations/` 应用迁移建表 → 写入种子数据 → 启动 NestJS**。

### 3.3 验证启动
```bash
# 1. 容器状态（全部 Up + healthy）
docker compose ps

# 2. 后端健康检查
curl -s http://localhost/api/health
# 期望: {"status":"ok","db":"up",...}

# 3. 前端首页
curl -sI http://localhost/ | head -1
# 期望: HTTP/1.1 200

# 4. 生产安全收敛验证
curl -sI http://localhost/api/health | grep -iE 'content-security-policy|strict-transport|x-frame'
# 期望: 含 CSP / HSTS / X-Frame-Options
curl -sI http://localhost/api/docs | head -1
# 期望: HTTP/1.1 404（Swagger 生产已关闭）
```

### 3.4 查看日志
```bash
docker compose logs -f backend   # 后端
docker compose logs -f web       # 前端
docker compose logs -f nginx     # 反代
docker compose logs -f db        # 数据库
```
后端日志为**结构化 JSON**（含 `type/requestId/method/path/status/durationMs/ip`），便于接入 Loki/ELK。

---

## 4. TLS / HTTPS

生产**必须**全站 HTTPS。两种方式任选：

### 方式 A：CDN 回源（推荐）
- 域名解析到 CDN，CDN 侧配置 HTTPS 证书（免费 DV 证书即可）。
- CDN 回源到服务器 80 端口（HTTP）或 443（需 nginx 配证书）。
- nginx 已 `set('trust proxy', 1)`，正确解析 `X-Forwarded-For` / `X-Forwarded-Proto`，HSTS 与 secure cookie 在经代理后仍生效。

### 方式 B：nginx + Let's Encrypt（无 CDN 直连）
1. 修改 `nginx/default.conf`，`listen 80` 改为 `listen 443 ssl`，并加证书路径；保留 80→443 跳转。
2. 用 certbot 签发：
```bash
certbot certonly --standalone -d psychhub.example.com
# 证书在 /etc/letsencrypt/live/psychhub.example.com/
```
3. 在 `docker-compose.yml` 的 `nginx` 服务挂载证书目录与 443 端口：
```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
  command: nginx -g 'daemon off;'
```
4. `docker compose up -d nginx` 重载。

> HSTS（`Strict-Transport-Security`）仅在 `NODE_ENV=production` 由 helmet 注入；确保 backend 收到的请求经 HTTPS，否则浏览器会因 HSTS 锁死。方式 A/B 均满足。

---

## 5. CDN 配置

静态资源由 Next.js 输出在 `/_next/static/`（带内容哈希，可长期缓存）。

### 缓存规则
| 路径 | 缓存策略 | 说明 |
|---|---|---|
| `/_next/static/*` | `Cache-Control: public, max-age=31536000, immutable` | 文件名含 hash，可永久缓存 |
| `/favicon.ico`、`/robots.txt`、`/sitemap.xml` | `max-age=3600` | 短缓存 |
| `/api/*` | **不缓存**（`Cache-Control: no-store`） | 动态接口 |
| 其他页面 `/`、`/resources` 等 | `max-age=60` 或按 SSR 策略 | 平衡新鲜度与性能 |

### 回源
- 回源协议：HTTP（到 nginx 80）或 HTTPS（到 nginx 443）。
- 回源 Host：透传 `psychhub.example.com`，nginx `server_name _` 兜底接收。
- 健康检查：CDN 探测 `GET /api/health` 期望 200。

---

## 6. 数据库运维

### 6.1 迁移流程（schema 变更）
**原则：永远新增迁移，不改历史迁移文件。**

开发期（本地或 CI）：
```bash
cd backend
# 改 prisma/schema.prisma 后
npx prisma migrate dev --name <描述性名字>
# 生成 prisma/migrations/<时间戳>_<name>/migration.sql 并提交到仓库
```

生产部署期（容器自动执行）：
```bash
# backend 容器启动时自动跑（Dockerfile CMD 已含）
npx prisma migrate deploy
# 仅应用 migrations/ 下未执行的迁移，不交互、不重置数据
```

也可手动对运行中的库执行：
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed   # 重新写入种子数据（幂等 upsert）
```

> ⚠️ `prisma db push` 会跳过迁移历史、可能丢数据，**仅用于本地 dev**，生产禁用。

### 6.2 种子数据
种子脚本 `backend/prisma/seed.ts` 使用 upsert，可安全重复执行。首次部署自动写入；如需重置内容数据：
```bash
docker compose exec backend npx prisma db seed
```

### 6.3 备份
```bash
# 逻辑备份（推荐，跨版本兼容）
docker compose exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > backup_$(date +%F).sql.gz

# 恢复
gunzip -c backup_2026-07-25.sql.gz | docker compose exec -T db psql -U $POSTGRES_USER $POSTGRES_DB

# 物理卷备份（停机快照）
docker run --rm -v psychhub_pgdata:/data -v $PWD:/backup alpine \
  tar czf /backup/pgdata_$(date +%F).tar.gz -C /data .
```
建议用 cron 每日逻辑备份 + 保留 7~30 天滚动。

### 6.4 连接数据库
```bash
docker compose exec db psql -U $POSTGRES_USER $POSTGRES_DB
# 查看表
\dt
# 退出
\q
```

---

## 7. 环境管理（dev / staging / prod）

| 维度 | dev（本地） | staging | prod |
|---|---|---|---|
| `NODE_ENV` | 空 / development | production | production |
| Swagger `/api/docs` | 开放 | 关闭 | 关闭 |
| CSP 严格头 | 关闭 | 开启 | 开启 |
| HSTS | 关闭 | 开启 | 开启 |
| `JWT_SECRET` | 占位值 | 独立强随机 | 独立强随机 |
| `ALLOWED_ORIGINS` | `http://localhost:3400` | staging 域名 | 生产域名 |
| 数据库 | 本地 PG 或 mock | 独立 PG 实例 | 独立 PG + 每日备份 |

**隔离原则**：每个环境用独立的 `.env`、独立的数据库实例、独立的 `JWT_SECRET`。staging 与 prod **绝不共享数据库**。

本地无 Docker/PG 时，可用 `backend/scripts/preview-server.ts`（mock 数据）或 `e2e-server.ts`（真 NestJS + 内存 Mock Prisma）做联调，代码与生产一字不差（见 README「本地预览」）。

---

## 8. 回滚

### 8.1 应用回滚（镜像回退）
```bash
# 1. 回到上一版本镜像（需保留旧镜像或重新 build 旧 commit）
git checkout <上一个稳定 commit>
docker compose up -d --build

# 2. 若迁移已向前执行且新版本有破坏性迁移，需先处理数据库（见 8.2）
```

### 8.2 数据库迁移回滚（谨慎）
Prisma 的 `migrate deploy` **不支持自动回滚**。策略：
1. **优先**：编写一个新的「反向迁移」`migration.sql`（如 `DROP COLUMN`、`CREATE TABLE` 恢复），走正常 deploy 流程，保证前向兼容。
2. **紧急**：从备份恢复（§6.3），接受该时间窗数据丢失。
3. 标记问题迁移为已回滚（不执行其 SQL）：
```bash
docker compose exec backend npx prisma migrate resolve --rolled-back <迁移名>
```
> 仅在确认 schema 与数据一致时使用，否则后续迁移会报 drift。

### 8.3 蓝绿/滚动（可选进阶）
- 用两个 backend 服务（`backend-blue`/`backend-green`），nginx upstream 切换。
- 数据库迁移需**前向兼容**（先加列、后删列分两次发布），避免新旧版本并行时 schema 冲突。

---

## 9. 监控与可观测性

### 9.1 健康端点
- **后端**：`GET /api/health` → `{"status":"ok","db":"up"}`（200）。compose healthcheck 每 15s 探测。
- **nginx**：`GET /` → 200。
- **db**：`pg_isready`。

### 9.2 结构化日志
后端每个请求输出一行 JSON（`LoggingMiddleware`）：
```json
{"type":"request","requestId":"<uuid>","method":"GET","path":"/api/counselors","status":200,"durationMs":12,"ip":"203.0.113.7"}
```
- `X-Request-Id`：上游传入则透传，否则自动生成；响应头回写，便于链路追踪。
- 采集：用 `docker compose logs` 或配置 logging driver 转 Loki/ELK。

### 9.3 优雅关闭
容器收到 `SIGTERM`/`SIGINT`（如 `docker compose down`、k8s 滚动）时，backend 先停接收新请求、完成在途请求、断开 Prisma 连接再退出，避免强杀丢连接。`uncaughtException`/`unhandledRejection` 由 `process-guard.ts` 兜底，记录后触发同一关闭流程。

### 9.4 建议接入
- **指标**：Prometheus（NestJS 可加 `@willsoto/nestjs-prometheus`）
- **告警**：healthcheck 连续失败、5xx 错误率、磁盘 > 85%、PG 连接数
- **追踪**：OpenTelemetry（可选，P2）

---

## 10. 安全清单（上线前逐项确认）

- [ ] `JWT_SECRET` 为 32+ 位强随机（`openssl rand -hex 32`），非占位值
- [ ] `POSTGRES_PASSWORD` 为强密码，非 `psych_pass`
- [ ] `ALLOWED_ORIGINS` 已改为生产前端域名
- [ ] `NODE_ENV=production`（compose 已固定）→ Swagger 关、CSP/HSTS 开
- [ ] HTTPS 全站，HSTS 生效（`curl -sI https://域名/api/health | grep strict-transport`）
- [ ] `/api/docs` 返回 404（Swagger 生产不可达）
- [ ] `.env` 不在 git 仓库（`.gitignore` 已含）
- [ ] 数据库端口 5432 **不**对公网暴露（compose 仅 `expose`，未 `ports` 映射到宿主）
- [ ] 定期备份已配置（§6.3）
- [ ] 限流已生效（登录/注册 5 次/分钟，全局 200/60s，`ThrottlerGuard` 已注册）
- [ ] 服务器防火墙仅放行 80/443，SSH 用密钥

---

## 11. 故障排查

| 现象 | 排查 |
|---|---|
| `docker compose up` 后 backend 反复重启 | `docker compose logs backend`；常见为 `DATABASE_URL` 错误或 db 未就绪（检查 db healthcheck） |
| 前端 `/api/*` 502 | nginx→backend 不通：`docker compose exec nginx wget -qO- http://backend:3001/api/health`；或 backend 未起 |
| 登录 201 但 `/auth/me` 401 | `JWT_SECRET` 签发与验签不一致（多实例间不同，或启动时序导致模块求值时 env 未就绪）；确保所有 backend 实例同一 `JWT_SECRET` |
| 浏览器跨域报错 | `ALLOWED_ORIGINS` 未包含前端域名；或经 web rewrites 同源代理可规避 |
| `prisma migrate deploy` 报 drift | 生产库被手动改过 schema；用 `prisma migrate diff` 对齐或从备份恢复 |
| CSP 导致前端样式/脚本不生效 | 生产 CSP 仅放行 `'self'`；若引入第三方 CDN 资源需在 `main.ts` 的 `directives` 补源 |
| 构建慢 / 镜像大 | backend 用 `npm ci` 全量装；可加 `--target=production` 多阶段剥离 devDeps（当前 Dockerfile 已较精简） |
| 端口被占 | `docker compose down` 清理；或改 `docker-compose.yml` 的 `ports` 映射 |

---

## 附：常用命令速查

```bash
# 启动全部
docker compose up -d --build

# 查看状态/日志
docker compose ps
docker compose logs -f backend

# 重启单个服务
docker compose restart backend

# 进入容器
docker compose exec backend sh
docker compose exec db psql -U psych psychhub

# 执行迁移/种子
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# 停止并清理（保留数据卷）
docker compose down

# 停止并删数据卷（⚠️ 清空数据库，仅全新重置用）
docker compose down -v

# 备份
docker compose exec db pg_dump -U psych psychhub | gzip > backup_$(date +%F).sql.gz
```

---

## 附：本地无 Docker 环境的预览

当前开发机若无可用的 Docker / PostgreSQL，可用以下两种方式离线预览（代码与生产一致，仅数据层替换）：

```bash
# 方式一：mock 数据服务（手写契约，端口 3001）
cd backend && npx ts-node scripts/preview-server.ts

# 方式二：真 NestJS + 内存 Mock Prisma（端口 3001，演示账号 demo@psychhub.cn/demo1234）
cd backend && npx ts-node --transpile-only scripts/e2e-server.ts

# 前端（另开终端，端口 3400）
cd web && NEXT_PUBLIC_API_BASE=http://localhost:3001 npm run build && npx next start -p 3400
```

详见 README「本地预览」与「本地真 NestJS 端到端联调」小节。生产部署仍走本指南的 `docker compose`。

---

## 附二：腾讯云轻量服务器（Windows）无 Docker 部署实录

适用场景：目标机为 **Windows Server + 无 Docker + 内存紧张（2C2G）**，无法运行 `docker compose`（PostgreSQL 起不来）。
采用「本地构建 → COS 中转 → TAT 远程执行」链路，全程无需 SSH / RDP。

### 拓扑

| 进程 | 端口 | 说明 |
| --- | --- | --- |
| `psychhub-web` | 3500 | Next.js standalone（`server.js`），SSR + `/api/*` 反代 |
| `psychhub-api` | 3501 | 数据服务单文件（由 `backend/scripts/preview-server.ts` esbuild 打包，零依赖） |

前端 `next.config.js` 的 `rewrites` 把 `/api/*` 代理到 `NEXT_PUBLIC_API_BASE`，**该值在构建期固化**，因此必须在 build 时指定服务器侧地址。

### 步骤

```bash
# 1. 构建前端（构建期固化 API 地址）
cd web && rm -rf .next
NEXT_PUBLIC_API_BASE=http://127.0.0.1:3501 npx next build

# 2. 打包数据服务为零依赖单文件（约 80KB）
npx esbuild backend/scripts/preview-server.ts \
  --bundle --platform=node --target=node18 --format=cjs \
  --outfile=_dist/api/server.js

# 3. 组装部署目录
mkdir -p _dist/web && cp -r web/.next/standalone/. _dist/web/
mkdir -p _dist/web/.next && cp -r web/.next/static _dist/web/.next/static
cp -r web/public _dist/web/public

# 4. 压缩（约 18MB）后上传 COS，生成预签名 URL（同地域下载秒级），
#    再用 TAT RunCommand（POWERSHELL 类型，Content 需 base64 编码）在服务器上执行：
#    下载 → Expand-Archive → 写 ecosystem.config.js → pm2 start
```

### 服务器侧 `ecosystem.config.js`

```js
module.exports = {
  apps: [
    { name: 'psychhub-api', script: 'C:\\www\\psychhub\\api\\server.js',
      cwd: 'C:\\www\\psychhub\\api', node_args: '--max-old-space-size=128',
      env: { PORT: '3501', NODE_ENV: 'production' } },
    { name: 'psychhub-web', script: 'C:\\www\\psychhub\\web\\server.js',
      cwd: 'C:\\www\\psychhub\\web', node_args: '--max-old-space-size=384',
      env: { PORT: '3500', HOSTNAME: '0.0.0.0', NODE_ENV: 'production',
             NEXT_PUBLIC_API_BASE: 'http://127.0.0.1:3501' } },
  ],
};
```

### 踩坑记录

1. **TAT 轮询字段是 `TaskStatus`，不是 `TaskState`** —— 读错字段会一直轮询到超时，而实际任务早已 SUCCESS。
2. **远程脚本头不要写 `$ErrorActionPreference = "Stop"`** —— pm2 等原生命令往 stderr 打印（如 `Process not found`）会被判为终止性错误，导致整脚本 EXIT 1。应改用 `"Continue"` + 显式校验各步产物。
3. **`NEXT_PUBLIC_*` 在 build 时内联**，运行时改环境变量无效；`rewrites.destination` 同理是构建期固化。
4. **2G 内存机需限制堆**：`--max-old-space-size` 分别给 384 / 128 MB，否则与既有站点争抢内存。
5. 端口 80 / 3000 常已被宝塔面板或其他站点占用，先 `netstat` 探测再选端口；并且要同时放通 **系统防火墙**（`New-NetFirewallRule`）和 **轻量云防火墙**（`CreateFirewallRules`），两者缺一不可。
6. 开机自启：`pm2 save` + 注册 `AtStartup` 计划任务执行 `pm2 resurrect`（Windows 上 pm2 无 `startup` 子命令）。
