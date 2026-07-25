// 本地 E2E 用：内存版 PrismaService（由 seed-data 支撑）
// 仅替换数据库层；NestJS 控制器 / 管道 / JWT 守卫 / 序列化 全部为真实生产代码。
// 支持服务实际用到的查询算子：相等、contains(insensitive)、has(数组)、lte/gte、OR/AND、orderBy、take、include(relation)。
import * as bcrypt from 'bcryptjs';
import {
  resources,
  helplines,
  assessments,
  articles,
  counselors,
  reviews,
} from '../prisma/seed-data';

type Row = Record<string, any>;

function matchCondition(row: Row, key: string, cond: any): boolean {
  if (key === 'OR') return (cond as any[]).some((w) => matchWhere(row, w));
  if (key === 'AND') return (cond as any[]).every((w) => matchWhere(row, w));
  const val = row[key];
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    if ('contains' in cond) {
      const sub = String(cond.contains);
      const a = String(val ?? '');
      return cond.mode === 'insensitive'
        ? a.toLowerCase().includes(sub.toLowerCase())
        : a.includes(sub);
    }
    if ('has' in cond) {
      const arr = Array.isArray(val) ? val : [];
      return arr.includes(cond.has);
    }
    if ('hasSome' in cond) {
      const arr = Array.isArray(val) ? val : [];
      return (cond.hasSome as any[]).some((x) => arr.includes(x));
    }
    if ('in' in cond) return (cond.in as any[]).includes(val);
    if ('equals' in cond) return val === cond.equals;
    if ('gte' in cond) return val >= cond.gte;
    if ('lte' in cond) return val <= cond.lte;
    if ('gt' in cond) return val > cond.gt;
    if ('lt' in cond) return val < cond.lt;
    return true;
  }
  return val === cond;
}

function matchWhere(row: Row, where: any): boolean {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => matchCondition(row, k, v));
}

function cmp(a: any, b: any, dir: 'asc' | 'desc'): number {
  if (a == null && b == null) return 0;
  if (a == null) return dir === 'asc' ? -1 : 1;
  if (b == null) return dir === 'asc' ? 1 : -1;
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    const av = a ? 1 : 0;
    const bv = b ? 1 : 0;
    return dir === 'asc' ? av - bv : bv - av;
  }
  if (a instanceof Date || b instanceof Date) {
    const av = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const bv = b instanceof Date ? b.getTime() : new Date(b).getTime();
    return dir === 'asc' ? av - bv : bv - av;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
  }
  return dir === 'asc' ? (a < b ? -1 : a > b ? 1 : 0) : a > b ? -1 : a < b ? 1 : 0;
}

function sortRows(rows: Row[], orderBy: any): Row[] {
  if (!orderBy) return rows;
  const keys = Array.isArray(orderBy) ? orderBy : [orderBy];
  return rows
    .slice()
    .sort((a, b) => {
      for (const k of keys) {
        const key = Object.keys(k)[0];
        const dir = k[key] as 'asc' | 'desc';
        const r = cmp(a[key], b[key], dir);
        if (r !== 0) return r;
      }
      return 0;
    });
}

class Delegate {
  constructor(
    public rows: Row[],
    private svc?: any,
  ) {}

  async findMany(args: any = {}): Promise<Row[]> {
    let res = this.rows.filter((r) => matchWhere(r, args.where));
    res = sortRows(res, args.orderBy);
    if (args.include && this.svc) res = this.svc.applyInclude(res, args.include);
    if (args.take != null) res = res.slice(0, args.take);
    return res;
  }

  async findUnique(args: any): Promise<Row | null> {
    return this.rows.find((r) => matchWhere(r, args.where)) ?? null;
  }

  async findFirst(args: any = {}): Promise<Row | null> {
    const res = this.rows.filter((r) => matchWhere(r, args.where));
    const sorted = sortRows(res, args.orderBy);
    return sorted[0] ?? null;
  }

  async create(args: any): Promise<Row> {
    const row: Row = {
      ...args.data,
      id:
        args.data.id ??
        `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rows.push(row);
    return row;
  }

  async upsert(args: any): Promise<Row> {
    const existing = this.rows.find((r) => matchWhere(r, args.where));
    if (existing) {
      Object.assign(existing, args.update ?? args.create);
      return existing;
    }
    const row: Row = {
      ...args.create,
      id: args.create.id ?? `mock-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rows.push(row);
    return row;
  }

  async count(args: any = {}): Promise<number> {
    return this.rows.filter((r) => matchWhere(r, args.where)).length;
  }

  async deleteMany(): Promise<{ count: number }> {
    const n = this.rows.length;
    this.rows.length = 0;
    return { count: n };
  }
}

export class MockPrismaService {
  resource!: Delegate;
  helpline!: Delegate;
  assessment!: Delegate;
  article!: Delegate;
  counselor!: Delegate;
  review!: Delegate;
  user!: Delegate;

  constructor() {
    const resRows = resources.map((r) => ({ ...r, featured: !!r.featured }));
    const counselorRows = counselors.map((c) => ({ ...c }));
    const reviewRows = reviews.map((rv) => ({
      ...rv,
      status: rv.status || 'PUBLISHED', // 对应 schema @default("PUBLISHED")
      createdAt: new Date(rv.createdAt),
      updatedAt: new Date(rv.createdAt),
    }));
    const demoHash = bcrypt.hashSync('demo1234', 10);
    const userRows: Row[] = [
      {
        id: 'u-demo',
        email: 'demo@psychhub.cn',
        name: '演示用户',
        passwordHash: demoHash,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.resource = new Delegate(resRows, this);
    this.helpline = new Delegate(helplines.map((h) => ({ ...h })), this);
    this.assessment = new Delegate(assessments.map((a) => ({ ...a })), this);
    this.article = new Delegate(articles.map((a) => ({ ...a })), this);
    this.counselor = new Delegate(counselorRows, this);
    this.review = new Delegate(reviewRows, this);
    this.user = new Delegate(userRows, this);
  }

  // review include: { counselor: { select: { name: true } } }
  applyInclude(rows: Row[], include: any): Row[] {
    if (include?.counselor?.select?.name) {
      return rows.map((r) => {
        const c = this.counselor.rows.find((x) => x.id === r.counselorId);
        return { ...r, counselor: c ? { name: c.name } : null };
      });
    }
    return rows;
  }

  // 健康检查探活：直接返回成功行（内存模式无真实 DB）
  async $queryRaw(): Promise<any[]> {
    return [{ '?column?': 1 }];
  }
  async $queryRawUnsafe(): Promise<any[]> {
    return [{ '?column?': 1 }];
  }
  async $executeRaw(): Promise<number> {
    return 0;
  }
  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}
  async $transaction<T>(fn: (p: any) => Promise<T>): Promise<T> {
    return fn(this);
  }
}
