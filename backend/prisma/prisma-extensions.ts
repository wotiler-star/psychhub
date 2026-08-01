import { PrismaClient } from '@prisma/client';

/**
 * SQLite 兼容层（Prisma 5 的 SQLite 连接器不支持 enum / 标量数组 / Json）。
 * 为保持对外 API 契约（数组 / 对象），这里在读写时做转换：
 *   - 数组字段（tags/specialties/approach/languages）：存为 "|a|b|" 字符串，读出还原为数组
 *   - 对象字段（questions/interpretation）：存为 JSON 字符串，读出 JSON.parse 还原
 * 集中在此一处，业务代码与 API 契约无需改动。
 */
const ARRAY_FIELDS = new Set(['tags', 'specialties', 'approach', 'languages']);
const JSON_FIELDS = new Set(['questions', 'interpretation']);
const DELIM = '|';

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

export function createPrismaClient(): PrismaClient {
  return new PrismaClient().$extends({
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
