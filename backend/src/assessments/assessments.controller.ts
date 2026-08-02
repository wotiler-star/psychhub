import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';

@ApiTags('心理测评')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get()
  @ApiOperation({ summary: '获取测评列表（公开版权量表），可按类型/关键词筛选' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'q', required: false })
  findAll(@Query('type') type?: string, @Query('q') q?: string) {
    return this.service.findAll(q, type);
  }

  @Get(':slug')
  @ApiOperation({ summary: '获取测评详情（题目与计分区间）' })
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }
}
