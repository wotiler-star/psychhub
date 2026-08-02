/**
 * SQLite 数组字段兼容工具。
 *
 * schema.prisma 中 tags / specialties / approach / languages 声明为 String
 * （Prisma 的 SQLite 连接器不支持标量数组），实际以 "|a|b|" 形式存储，
 * 由 prisma/prisma-extensions.ts 的查询扩展在读写时自动转换。
 *
 * 本文件放在 src/ 下而非 prisma/ 下，是为了让 nest build 的 rootDir 稳定为 src——
 * 若 src 代码 import 了 src 外的模块，TS 会把 rootDir 上提到项目根，
 * 产物路径将从 dist/main.js 变成 dist/src/main.js，导致 `node dist/main.js` 启动失败。
 */
export const DB_ARRAY_DELIM = '|';

/**
 * 把数组字段安全地规范化为 string[]。
 * - 已是数组：过滤出字符串项后返回
 * - 是 "|a|b|" 字符串（扩展未生效时的原始值）：按分隔符还原
 * - 其它（null / undefined / 非法值）：返回空数组
 *
 * 业务层统一用它替代 `x.tags as string[]` 这类强制断言：既满足类型检查，
 * 也避免扩展层失效时 `.includes is not a function` 之类的运行时崩溃。
 */
export function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string') return v.split(DB_ARRAY_DELIM).filter(Boolean);
  return [];
}
