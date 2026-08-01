import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HelplinesService } from './helplines.service';

@ApiTags('求助资源')
@Controller('helplines')
export class HelplinesController {
  constructor(private readonly service: HelplinesService) {}

  @Get()
  @ApiOperation({ summary: '获取求助资源（热线/公益），按国家/语言/类别/关键词筛选' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'category', required: false, enum: ['CRISIS', 'SUPPORT', 'LOW_COST'] })
  @ApiQuery({ name: 'q', required: false })
  findAll(
    @Query('country') country?: string,
    @Query('language') language?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findAll(country, language, category, q);
  }
}
