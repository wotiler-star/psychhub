import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CounselorsService } from './counselors.service';
import { QueryCounselorDto } from './dto/query-counselor.dto';

@ApiTags('找咨询师')
@Controller('counselors')
export class CounselorsController {
  constructor(private readonly service: CounselorsService) {}

  @Get()
  @ApiOperation({ summary: '获取咨询师目录（支持专长/地区/远程/价格/关键词筛选）' })
  findAll(@Query() query: QueryCounselorDto) {
    return this.service.findAll(query);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: '获取某咨询师的评价列表' })
  async findReviews(@Param('id') id: string) {
    const rows = await this.service.findReviews(id);
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

  @Get(':id')
  @ApiOperation({ summary: '获取单个咨询师详情' })
  async findOne(@Param('id') id: string) {
    const counselor = await this.service.findOne(id);
    if (!counselor) {
      throw new NotFoundException('咨询师不存在');
    }
    return counselor;
  }
}
