# 后端 NestJS + Prisma + PostgreSQL
# 启动顺序：等待 DB 健康 → 执行迁移 → 写入种子数据 → 启动服务
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
# 最小权限：以非 root 的 node 用户运行（降低容器逃逸风险）
RUN chown -R node:node /app
USER node
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
