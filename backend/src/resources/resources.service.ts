import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryResourceDto } from './dto/query-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryResourceDto) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.country) where.country = query.country;
    if (query.language) where.language = query.language;
    if (query.tag) where.tags = { has: query.tag };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { tags: { has: query.q } },
      ];
    }
    return this.prisma.resource.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 500, // 查询上限：防止数据增长后无界查询拖垮库
    });
  }

  async findOne(id: string) {
    return this.prisma.resource.findUnique({ where: { id } });
  }

  async findFeatured(limit = 6) {
    return this.prisma.resource.findMany({ where: { featured: true }, take: limit });
  }
}
