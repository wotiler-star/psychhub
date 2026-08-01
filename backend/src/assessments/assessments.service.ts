import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(q?: string, type?: string) {
    // 列表不返回题目细节，减小体积
    const where: any = {};
    if (type) where.type = type;
    const list = await this.prisma.assessment.findMany({
      select: {
        id: true, slug: true, title: true, description: true,
        type: true, source: true, createdAt: true,
      },
      where,
      orderBy: { createdAt: 'asc' },
    });
    if (!q) return list;
    const kw = q.toLowerCase();
    return list.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(kw) ||
        (a.description || '').toLowerCase().includes(kw),
    );
  }

  async findOne(slug: string) {
    return this.prisma.assessment.findUnique({ where: { slug } });
  }
}
