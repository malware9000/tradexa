import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    country?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(data.password);
    const email = data.email.toLowerCase();

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        status: 'ACTIVE',
        profile: {
          create: {
            fullName: data.fullName,
            phone: data.phone,
            country: data.country,
          },
        },
        investmentAccount: {
          create: { currency: 'USD' },
        },
        notifications: {
          create: {
            type: 'ACCOUNT_CREATED',
            title: 'Welcome to Tradexa',
            body: 'Your account has been created successfully.',
          },
        },
      },
      select: {
        id: true,
        email: true,
        status: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }
    if (user.status === 'CLOSED') {
      throw new UnauthorizedException('Account is closed');
    }

    const valid = await argon2.verify(user.passwordHash, data.password);
    if (!valid) {
      await this.prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'LOGIN_FAILED',
          detail: { reason: 'invalid_password' },
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.securityEvent.create({
      data: { userId: user.id, eventType: 'LOGIN_SUCCESS' },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        status: user.status,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      ...tokens,
    };
  }

  async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get<string>('REFRESH_EXPIRES_IN', '7d'),
    });
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(
        refreshToken,
      );
      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
