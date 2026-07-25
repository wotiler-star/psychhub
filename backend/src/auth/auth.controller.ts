import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService, AuthUserOut } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

function setAuthCookie(res: Response, token: string) {
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS,
  });
}

@ApiTags('账号 / 认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 防账号爆破 / 批量注册
  @ApiOperation({ summary: '注册并登录（写入用户、签发 JWT Cookie）' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.register(dto);
    const token = this.auth.login(user);
    setAuthCookie(res, token);
    return { user };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 防密码爆破
  @ApiOperation({ summary: '登录（校验密码、签发 JWT Cookie）' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    const token = this.auth.login(user);
    setAuthCookie(res, token);
    return { user };
  }

  @Post('logout')
  @ApiOperation({ summary: '退出登录（清除 JWT Cookie）' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '获取当前登录用户（携带有效 JWT Cookie 时返回，否则 401）',
  })
  me(@Req() req: Request) {
    const u = (req as unknown as { user?: AuthUserOut }).user;
    return { user: u ?? null };
  }
}
