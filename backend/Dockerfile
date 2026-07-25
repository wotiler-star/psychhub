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
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
