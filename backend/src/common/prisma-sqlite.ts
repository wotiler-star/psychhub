import { PrismaClient } from '@prisma/client';
import { DB_ARRAY_DELIM } from './db-array.util';

/**
 * 数组 / JSON 兼容层（对 SQLite 开发库与 MySQL/MariaDB 生产库均适用）。
 * SQLite 连接器不支持标量数组 / Json；MySQL 虽原生支持 Json，但本项目为
 * 「本地 SQLite / 生产 MySQL」双库共用同一套代码，统一以 "|a|b|" 字符串与
 * JSON 字符串存储，避免为两套 provider 维护两份序列化逻辑。
 * 为保持对外 API 契约（数组 / 对象），这里在读写时做转换：
 *   - 数组字段（tags/specialties/approach/languages）：存为 "|a|b|" 字符串，读出还原为数组
 *   - 对象字段（questions/interpretation）：存为 JSON 字符串，读出 JSON.parse 还原
 * 集中在此一处，业务代码与 API 契约无需改动。
 *
 * 实现放在 src/ 下（而非 prisma/）：nest build 要求所有被 src 引用的源文件都在 rootDir 内，
 * 否则 rootDir 会被上提到项目根，产物变成 dist/src/main.js，`node dist/main.js` 启动失败。
 * prisma/prisma-extensions.ts 保留为薄再导出，供 ts-node 执行的 seed 脚本使用。
 */
const ARRAY_FIELDS = new Set(['tags', 'specialties', 'approach', 'languages']);
const JSON_FIELDS = new Set(['questions', 'interpretation']);
const DELIM = DB_ARRAY_DELIM;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    v != null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    !(v instanceof Date)
  );
}

/** 写入：数组 -> "|a|b|"；对象 -> JSON 字符串 */
export function serializeForDb(node: any): any {
  if (Array.isArray(node)) return node.map(serializeForDb);
  if (isPlainObject(node)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (ARRAY_FIELDS.has(k) && Array.isArray(v)) {
        out[k] = DELIM + (v as any[]).join(DELIM) + DELIM;
      } else if (JSON_FIELDS.has(k) && isPlainObject(v)) {
        out[k] = JSON.stringify(v);
      } else if (v && typeof v === 'object' && !(v instanceof Date)) {
        out[k] = serializeForDb(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return node;
}

/** 读出： "|a|b|" -> 数组；JSON 字符串 -> 对象 */
export function deserializeFromDb(node: any): any {
  if (Array.isArray(node)) return node.map(deserializeFromDb);
  if (isPlainObject(node)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (ARRAY_FIELDS.has(k) && typeof v === 'string') {
        out[k] = v.split(DELIM).filter(Boolean);
      } else if (JSON_FIELDS.has(k) && typeof v === 'string') {
        try {
          out[k] = JSON.parse(v);
        } catch {
          out[k] = v;
        }
      } else if (v && typeof v === 'object' && !(v instanceof Date)) {
        out[k] = deserializeFromDb(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return node;
}

function transformArgs(args: any): any {
  if (!args || typeof args !== 'object') return args;
  const out = { ...args };
  for (const key of ['data', 'create', 'update']) {
    if (out[key] !== undefined) out[key] = serializeForDb(out[key]);
  }
  return out;
}

/**
 * 归一化 MySQL/MariaDB 连接串 —— 针对 Hostinger 共享云数据库做适配：
 *   - 仅对 mysql:// 生效，SQLite 等原样返回（本地开发不受影响）
 *   - 共享型 MySQL 连接数有限，缺省给保守上限并硬性封顶（避免耗尽 Hostinger 连接配额）
 *   - 补齐 pool / connect / socket 超时，缓解跨网（腾讯云 → Hostinger）偶发抖动
 *   - DATABASE_SSL=true 时追加 sslaccept=strict（Hostinger 远程 MySQL 要求加密连接）
 * 解析失败则回退原始串，不影响其它环境。
 */
function normalizeMysqlUrl(raw: string): string {
  if (!/^mysql:/i.test(raw)) return raw;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  const p = new URLSearchParams(u.search);
  const clamp = (k: string, def: number) => {
    const cur = Number(p.get(k));
    if (!p.has(k) || Number.isNaN(cur)) p.set(k, String(def));
    else p.set(k, String(Math.min(cur, 10))); // 共享主机硬性封顶 10
  };
  // 并发连接上限：缺省 DATABASE_CONNECTION_LIMIT(默认5)，最高 10
  clamp('connection_limit', Number(process.env.DATABASE_CONNECTION_LIMIT) || 5);
  if (!p.has('pool_timeout')) p.set('pool_timeout', '20');
  if (!p.has('connect_timeout')) p.set('connect_timeout', '20');
  if (!p.has('socket_timeout')) p.set('socket_timeout', '30');
  // Hostinger 远程 MySQL 默认要求 TLS；由环境变量显式开启，避免误连明文
  if (process.env.DATABASE_SSL === 'true' && !p.has('sslaccept')) {
    p.set('sslaccept', 'strict');
  }
  u.search = '';
  const base = u.toString();
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

export function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL;
  const url = rawUrl ? normalizeMysqlUrl(rawUrl) : undefined;
  const prisma = url
    ? new PrismaClient({ datasources: { db: { url } } })
    : new PrismaClient();
  return prisma.$extends({
    query: {
      $allOperations({ args, query }: any) {
        const newArgs = transformArgs(args);
        return Promise.resolve(query(newArgs)).then((res: any) =>
          deserializeFromDb(res),
        );
      },
    },
  }) as unknown as PrismaClient;
}
