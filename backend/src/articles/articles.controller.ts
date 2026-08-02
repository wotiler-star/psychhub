import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';

@ApiTags('心理资讯')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: '获取心理资讯/科普文章列表（可按分类/关键词筛选）' })
  @ApiQuery({ name: 'category', required: false, enum: ['POPSCI', 'RESEARCH', 'NEWS'] })
  @ApiQuery({ name: 'q', required: false })
  findAll(@Query('category') category?: string, @Query('q') q?: string) {
    return this.service.findAll(category, q);
  }

  @Get(':slug')
  @ApiOperation({ summary: '获取文章详情（正文与来源）' })
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }
}
