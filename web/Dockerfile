# 前端 Next.js（standalone 输出，容器化友好）
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# SSR 服务端取数基地址（容器内用服务名 backend）
ARG NEXT_PUBLIC_API_BASE=http://backend:3001
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 关闭 Next 遥测，避免非 root 用户向 .next 写入遥测文件失败
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# 最小权限：以非 root 的 node 用户运行（降低容器逃逸风险）
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
