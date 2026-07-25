import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { QueryResourceDto } from './dto/query-resource.dto';

@ApiTags('资源导航')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: '获取心理学资源列表（支持类型/国家/语言/标签/关键词筛选）' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['MEDIA', 'SAAS', 'THERAPY', 'ORG', 'TOOL', 'MEDITATION', 'EDU'] })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'tag', required: false })
  findAll(@Query() query: QueryResourceDto) {
    return this.service.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: '获取精选推荐资源' })
  featured() {
    return this.service.findFeatured();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个资源详情' })
  @ApiResponse({ status: 200, description: '资源详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
