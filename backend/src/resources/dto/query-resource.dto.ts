import { IsOptional, IsString, IsIn } from 'class-validator';

const TYPES = ['MEDIA', 'SAAS', 'THERAPY', 'ORG', 'TOOL', 'MEDITATION', 'EDU'];

export class QueryResourceDto {
  @IsOptional() @IsString() q?: string;       // 关键词（名称/描述/标签）
  @IsOptional() @IsIn(TYPES) type?: string;    // 资源类型
  @IsOptional() @IsString() country?: string; // 国家/地区
  @IsOptional() @IsString() language?: string;// 语言
  @IsOptional() @IsString() tag?: string;      // 标签
}
