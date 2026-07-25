import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

// 从 httpOnly Cookie 中提取 JWT（避免令牌落 JS，防 XSS 窃取）
function cookieExtractor(req: Request): string | null {
  const cookie = req?.headers?.cookie;
  if (!cookie) return null;
  const pair = (cookie as string)
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('access_token='));
  return pair ? decodeURIComponent(pair.slice('access_token='.length)) : null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    // 仅回写非敏感字段供后续守卫/控制器使用
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
