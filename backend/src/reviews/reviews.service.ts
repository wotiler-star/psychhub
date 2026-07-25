import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReviewInput {
  counselorId: string;
  rating: number;
  content: string;
  authorId: string;
  authorName: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(authorId?: string) {
    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (authorId) where.authorId = authorId;
    const rows = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { counselor: { select: { name: true } } },
      take: 100, // 查询上限：社区评价流仅取最新 100 条，避免无界查询
    });
    return rows.map((r) => ({
      id: r.id,
      counselorId: r.counselorId,
      authorName: r.authorName,
      authorId: r.authorId,
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt,
      counselorName: (r as unknown as { counselor?: { name?: string | null } }).counselor
        ?.name ?? null,
    }));
  }

  async create(input: CreateReviewInput) {
    const counselor = await this.prisma.counselor.findUnique({
      where: { id: input.counselorId },
    });
    if (!counselor) {
      throw new NotFoundException('咨询师不存在');
    }
    return this.prisma.review.create({
      data: {
        counselorId: input.counselorId,
        authorId: input.authorId,
        authorName: input.authorName,
        rating: input.rating,
        content: input.content,
        status: 'PUBLISHED',
      },
    });
  }
}
