import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { adminLoginSchema, AdminLoginDto } from '@tradexa/validation';
import { parseDto } from '../common/parse-dto.util';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuth: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: AdminLoginDto) {
    const dto = parseDto(adminLoginSchema, body);
    const result = await this.adminAuth.login(dto);
    return {
      admin: result.admin,
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
    return this.adminAuth.refreshToken(token);
  }
}
