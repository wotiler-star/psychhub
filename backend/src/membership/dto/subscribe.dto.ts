import { IsString, IsIn } from 'class-validator';

export class SubscribeDto {
  @IsString()
  userId: string;

  @IsString()
  @IsIn(['free', 'basic', 'pro', 'ultimate'])
  tier: 'free' | 'basic' | 'pro' | 'ultimate';

  @IsString()
  @IsIn(['monthly', 'yearly'])
  billing: 'monthly' | 'yearly';
}
