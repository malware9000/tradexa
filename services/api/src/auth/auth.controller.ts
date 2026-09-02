import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { parseDto } from '../common/parse-dto.util';
import {
  registerSchema,
  loginSchema,
  RegisterDto,
  LoginDto,
} from '@tradexa/validation';

const REFRESH_COOKIE = 'tradexa_refresh';@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    const dto = parseDto(registerSchema, body);
    const result = await this.auth.register(dto);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const dto = parseDto(loginSchema, body);
    const result = await this.auth.login(dto);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken?: string }) {
    const token = body.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this.auth.refreshToken(token);
  }
}
