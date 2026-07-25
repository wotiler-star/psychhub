import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // 列表不返回题目细节，减小体积
    return this.prisma.assessment.findMany({
      select: {
        id: true, slug: true, title: true, description: true,
        type: true, source: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(slug: string) {
    return this.prisma.assessment.findUnique({ where: { slug } });
  }
}
