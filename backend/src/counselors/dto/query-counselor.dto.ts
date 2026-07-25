import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryCounselorDto {
  @IsOptional() @IsString() specialty?: string;

  @IsOptional() @IsString() region?: string;

  // 前端传 '1' 表示仅远程；转换为布尔
  @IsOptional()
  @Transform(({ value }) => value === '1' || value === 'true' || value === true)
  @IsBoolean()
  remote?: boolean;

  // 前端以字符串传价格上限，转换为整数
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional() @IsString() q?: string;
}
