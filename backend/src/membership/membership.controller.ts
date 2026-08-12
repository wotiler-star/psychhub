import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipService } from './membership.service';
import { SubscribeDto } from './dto/subscribe.dto';
import type { MembershipStatus } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private readonly svc: MembershipService) {}

  /** 公开：会员档位与价格 */
  @Get('tiers')
  getTiers() {
    return this.svc.getTiers();
  }

  /** 当前登录用户的会员状态（需 JWT Cookie，由 JwtAuthGuard 注入 req.user） */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any): MembershipStatus {
    const userId = req.user?.id ?? req.user?.sub;
    return this.svc.getMyMembership(userId);
  }

  /** 开通 / 升级订阅：仅登录用户自身可操作，userId 以令牌为准（忽略客户端传入） */
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.svc.subscribe(userId, dto);
  }
}
