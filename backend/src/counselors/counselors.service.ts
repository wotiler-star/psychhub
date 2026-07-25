import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCounselorDto } from './dto/query-counselor.dto';

@Injectable()
export class CounselorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCounselorDto) {
    const where: Record<string, unknown> = {};
    if (query.specialty) where.specialties = { has: query.specialty };
    if (query.region) where.region = query.region;
    if (query.remote) where.remote = true;
    if (query.maxPrice != null) where.pricePerSession = { lte: query.maxPrice };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { bio: { contains: query.q, mode: 'insensitive' } },
        { specialties: { has: query.q } },
      ];
    }
    return this.prisma.counselor.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
      take: 200, // 查询上限：防止数据增长后无界查询
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
