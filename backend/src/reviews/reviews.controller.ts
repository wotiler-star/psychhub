import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('咨询师评价 / 社区')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: '获取评价流（社区页用；可选 authorId 过滤「我的评价」）' })
  findAll(@Query('authorId') authorId?: string) {
    return this.service.findAll(authorId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '发表评价（需登录）' })
  async create(@Req() req: Request, @Body() dto: CreateReviewDto) {
    const user = (req as unknown as { user: { id: string; name: string } }).user;
    const review = await this.service.create({
      counselorId: dto.counselorId,
      rating: dto.rating,
      content: dto.content,
      authorId: user.id,
      authorName: user.name,
    });
    return { review };
  }
}
