import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HelplinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(country?: string, language?: string, category?: string, q?: string) {
    const where: any = {};
    if (country) where.country = country;
    if (language) where.language = language;
    if (category) where.category = category;
    const list = await this.prisma.helpline.findMany({ where, orderBy: { country: 'asc' } });
    if (!q) return list;
    const kw = q.toLowerCase();
    return list.filter(
      (h) =>
        (h.name || '').toLowerCase().includes(kw) ||
        (h.description || '').toLowerCase().includes(kw),
    );
  }
}
