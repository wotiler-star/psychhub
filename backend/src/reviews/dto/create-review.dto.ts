import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  counselorId: string;

  @IsInt() @Min(1) @Max(5)
  rating: number;

  @IsString() @MinLength(5, { message: '评价内容至少 5 个字' })
  content: string;
}
