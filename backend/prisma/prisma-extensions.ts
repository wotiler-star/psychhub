/**
 * 兼容入口：真实实现已下沉到 src/common/（见 prisma-sqlite.ts 与 db-array.util.ts）。
 *
 * 为什么要下沉：nest build 要求被 src 引用的源文件都位于 rootDir(=src) 内，
 * 若 src/prisma/prisma.service.ts 直接 import 本目录下的实现，rootDir 会被上提到项目根，
 * 编译产物从 dist/main.js 变成 dist/src/main.js，导致 `node dist/main.js` 生产启动失败。
 *
 * 本文件仅供 ts-node 直接执行的脚本（prisma/seed.ts）继续按原路径引用。
 */
export {
  serializeForDb,
  deserializeFromDb,
  createPrismaClient,
} from '../src/common/prisma-sqlite';
export { asArray, DB_ARRAY_DELIM } from '../src/common/db-array.util';
