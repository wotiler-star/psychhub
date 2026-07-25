import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 严格 JWT 守卫：未携带/无效令牌时返回 401（前端据此视为未登录）
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
