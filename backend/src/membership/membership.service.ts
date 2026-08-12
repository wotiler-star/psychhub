import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MEMBERSHIP_TIERS, MembershipTierDef } from './membership.constants';
import { SubscribeDto } from './dto/subscribe.dto';

export interface MembershipStatus {
  tier: string;
  expiresAt: string | null;
  subscriptions: {
    id: string;
    tier: string;
    billing: string;
    status: string;
    provider: string | null;
    paymentRef: string | null;
    amount: number | null;
    expiresAt: string | null;
    createdAt: string;
  }[];
}

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  getTiers(): MembershipTierDef[] {
    return MEMBERSHIP_TIERS;
  }

  /**
   * 查询当前用户会员状态（服务端落库，跨端一致）。
   * 字段在 Prisma schema 的 User 模型上（membershipTier / membershipExpiresAt）；
   * 并附带有效订阅记录（Subscription）。
   */
  async getMyMembership(userId: string): Promise<MembershipStatus> {
    const u = await (this.prisma as any).user.findUnique({ where: { id: userId } });
    const subs = await (this.prisma as any).subscription.findMany({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return {
      tier: u?.membershipTier ?? 'free',
      expiresAt: u?.membershipExpiresAt ?? null,
      subscriptions: (subs ?? []).map((s: any) => ({
        id: s.id,
        tier: s.tier,
        billing: s.billing,
        status: s.status,
        provider: s.provider ?? null,
        paymentRef: s.paymentRef ?? null,
        amount: s.amount ?? null,
        expiresAt: s.expiresAt ?? null,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
      })),
    };
  }

  /**
   * 开通 / 升级订阅：校验通过后写入 User.membershipTier / membershipExpiresAt，
   * 并落库一条 Subscription（含支付回执，便于未来对账 / Webhook 校验）。
   *
   * 支付回执（支付接入点）：
   *  - 当前为「模拟支付」（provider=mock）：信任客户端成功信号，直接置 active；
   *  - 接真实网关（Stripe / 微信）后：subscribe 应先校验支付回执 paymentRef
   *    （或改由网关 Webhook 回调更新 Subscription.status），再写 User 会员态。
   */
  async subscribe(userId: string, dto: SubscribeDto): Promise<{ tier: string; expiresAt: string | null; subscriptionId: string }> {
    const def = MEMBERSHIP_TIERS.find((t) => t.id === dto.tier);
    if (!def) throw new BadRequestException('未知的会员档位');
    if (dto.tier === 'free') throw new BadRequestException('免费档无需订阅');

    const now = new Date();
    const exp = new Date(now);
    if (dto.billing === 'yearly') exp.setFullYear(exp.getFullYear() + 1);
    else exp.setMonth(exp.getMonth() + 1);

    const amount =
      dto.billing === 'yearly' ? def.yearly : def.monthly;

    const user = await (this.prisma as any).user.update({
      where: { id: userId },
      data: {
        membershipTier: dto.tier,
        membershipExpiresAt: exp,
      },
    });

    const sub = await (this.prisma as any).subscription.create({
      data: {
        userId,
        tier: dto.tier,
        billing: dto.billing,
        status: 'active',
        provider: dto.provider ?? 'mock',
        paymentRef: dto.paymentRef ?? null,
        amount,
        expiresAt: exp,
      },
    });

    return {
      tier: user.membershipTier,
      expiresAt: user.membershipExpiresAt
        ? new Date(user.membershipExpiresAt).toISOString()
        : null,
      subscriptionId: sub.id,
    };
  }
}
