// 在每个测试模块加载【之前】运行：务必在 import AppModule 之前把环境就绪，
// 否则 JwtModule.register({ secret: process.env.JWT_SECRET }) 在模块求值时读到 undefined，
// 会出现「签发用默认密钥、验签用自定义密钥」的 401（详见 .workbuddy/memory 的 JWT_SECRET 坑）。
import 'reflect-metadata';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-jest-0123';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://u:p@127.0.0.1:1/psychhub_test'; // 仅占位，测试用内存 Mock 替换 PrismaService
process.env.NODE_ENV = 'test';
