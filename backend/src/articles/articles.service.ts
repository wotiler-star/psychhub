import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, q?: string) {
    const where: any = {};
    if (category) where.category = category;
    const list = await this.prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });
    if (!q) return list;
    const kw = q.toLowerCase();
    return list.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(kw) ||
        (a.excerpt || '').toLowerCase().includes(kw) ||
        (a.content || '').toLowerCase().includes(kw) ||
        (a.tags || []).some((t: string) => t.toLowerCase().includes(kw)),
    );
  }

  async findOne(slug: string) {
    return this.prisma.article.findUnique({ where: { slug } });
  }
}
