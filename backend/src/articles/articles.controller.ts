import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';

@ApiTags('心理资讯')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: '获取心理资讯/科普文章列表（可按分类筛选）' })
  findAll(@Query('category') category?: string) {
    return this.service.findAll(category);
  }

  @Get(':slug')
  @ApiOperation({ summary: '获取文章详情（正文与来源）' })
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }
}
