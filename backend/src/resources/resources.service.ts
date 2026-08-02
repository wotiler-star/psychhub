import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryResourceDto } from './dto/query-resource.dto';
import { asArray } from '../common/db-array.util';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryResourceDto) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.country) where.country = query.country;
    if (query.language) where.language = query.language;
    const rows = await this.prisma.resource.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 500, // 查询上限：防止数据增长后无界查询拖垮库
    });
    // SQLite 不支持数组 has / 不区分大小写 contains，统一在内存侧过滤（数据量小）
    const tag = query.tag;
    const q = query.q ? query.q.toLowerCase() : null;
    return rows.filter((r) => {
      if (tag && !asArray(r.tags).includes(tag)) return false;
      if (q) {
        const hay = [r.name, r.description, ...asArray(r.tags)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  async findOne(id: string) {
    return this.prisma.resource.findUnique({ where: { id } });
  }

  async findFeatured(limit = 6) {
    return this.prisma.resource.findMany({ where: { featured: true }, take: limit });
  }
}
