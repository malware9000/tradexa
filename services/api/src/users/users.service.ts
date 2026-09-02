import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        status: true,
        kycStatus: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        profile: true,
        investmentAccount: {
          select: { id: true, currency: true, status: true },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; phone?: string; country?: string; address?: string },
  ) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data,
    });
    return profile;
  }
}
