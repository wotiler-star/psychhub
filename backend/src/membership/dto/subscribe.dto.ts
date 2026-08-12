import { IsString, IsIn, IsOptional } from 'class-validator';

export class SubscribeDto {
  @IsString()
  userId: string;

  @IsString()
  @IsIn(['free', 'basic', 'pro', 'ultimate'])
  tier: 'free' | 'basic' | 'pro' | 'ultimate';

  @IsString()
  @IsIn(['monthly', 'yearly'])
  billing: 'monthly' | 'yearly';

  /** 支付通道：mock（演示）/ stripe / wechat；默认 mock */
  @IsOptional()
  @IsString()
  provider?: string;

  /** 支付回执 / 交易号：接真实网关后用于校验（当前 mock 可留空） */
  @IsOptional()
  @IsString()
  paymentRef?: string;
}
