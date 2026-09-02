import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(data: { email: string; password: string }) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!admin.active) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    const valid = await argon2.verify(admin.passwordHash, data.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { updatedAt: new Date() },
    });

    const tokens = await this.issueTokens(admin.id, admin.email);
    return {
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      ...tokens,
    };
  }

  async issueTokens(adminId: string, email: string) {
    const payload = { sub: adminId, email, type: 'admin' as const };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get<string>('ADMIN_REFRESH_EXPIRES_IN', '7d'),
    });
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        type: string;
      }>(refreshToken);
      if (payload.type !== 'admin') {
        throw new UnauthorizedException('Invalid token type');
      }
      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
