import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('api/membership')
export class MembershipController {
  constructor(private readonly svc: MembershipService) {}

  /** 公开：会员档位与价格 */
  @Get('tiers')
  getTiers() {
    return this.svc.getTiers();
  }

  /** 当前登录用户的会员状态（需 JWT，req.user 由 JwtStrategy 注入） */
  @Get('me')
  getMe(@Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) throw new UnauthorizedException('未登录');
    return this.svc.getMyMembership(userId);
  }

  /** 开通/升级订阅（占位，待接入支付） */
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto) {
    return this.svc.subscribe(dto);
  }
}
