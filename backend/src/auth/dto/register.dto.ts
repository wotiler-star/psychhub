import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(2, { message: '昵称至少 2 个字符' })
  name: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString() @MinLength(6, { message: '密码至少 6 位' })
  password: string;
}
