import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCounselorDto } from './dto/query-counselor.dto';
import { asArray } from '../common/db-array.util';

@Injectable()
export class CounselorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCounselorDto) {
    const where: Record<string, unknown> = {};
    if (query.region) where.region = query.region;
    if (query.remote) where.remote = true;
    if (query.maxPrice != null) where.pricePerSession = { lte: query.maxPrice };
    const rows = await this.prisma.counselor.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
      take: 200, // 查询上限：防止数据增长后无界查询
    });
    // SQLite 不支持数组 has / 不区分大小写 contains，统一在内存侧过滤（数据量小）
    const specialty = query.specialty;
    const q = query.q ? query.q.toLowerCase() : null;
    return rows.filter((c) => {
      if (specialty && !asArray(c.specialties).includes(specialty)) return false;
      if (q) {
        const hay = [c.name, c.bio, ...asArray(c.specialties)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  async findOne(id: string) {
    return this.prisma.counselor.findUnique({ where: { id } });
  }

  async findReviews(id: string) {
    return this.prisma.review.findMany({
      where: { counselorId: id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: { counselor: { select: { name: true } } },
    });
  }
}
