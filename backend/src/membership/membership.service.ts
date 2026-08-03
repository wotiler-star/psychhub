import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MEMBERSHIP_TIERS, MembershipTierDef } from './membership.constants';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  getTiers(): MembershipTierDef[] {
    return MEMBERSHIP_TIERS;
  }

  /**
   * 查询当前用户会员状态。
   * 注：真实字段在 Prisma schema 的 User 模型扩展（membershipTier / membershipExpiresAt）。
   * 骨架阶段用 any 访问，待 `prisma generate` 后改为强类型。
   */
  async getMyMembership(userId: string): Promise<{ tier: string; expiresAt: string | null }> {
    const u = await (this.prisma as any).user.findUnique({ where: { id: userId } });
    return {
      tier: u?.membershipTier ?? 'free',
      expiresAt: u?.membershipExpiresAt ?? null,
    };
  }

  /**
   * 创建订阅记录（占位）。
   * TODO：接入真实支付网关（如微信支付/Stripe）后，应先校验支付回执，
   * 再写入订阅并更新 User.membershipTier / membershipExpiresAt。
   */
  async subscribe(dto: SubscribeDto): Promise<{ id: string; status: string }> {
    const rec = await (this.prisma as any).subscription.create({
      data: {
        userId: dto.userId,
        tier: dto.tier,
        billing: dto.billing,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    });
    return { id: rec?.id ?? 'pending', status: 'pending' };
  }
}
