import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    return this.prisma.article.findMany({
      where: category ? { category } : {},
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findOne(slug: string) {
    return this.prisma.article.findUnique({ where: { slug } });
  }
}
