import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AdminActor {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
}

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async list(params: { search?: string; status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
    const where: Record<string, unknown> = {};

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        {
          profile: {
            is: { fullName: { contains: q, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          status: true,
          kycStatus: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          profile: { select: { fullName: true, country: true } },
          investmentAccount: {
            select: { currency: true },
          },
          deposits: {
            where: { status: 'SUCCESSFUL' },
            select: { amount: true },
          },
          ledgerEntries: {
            where: { direction: 'CREDIT' },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    const mapped = items.map((u) => {
      const credits = Number(
        u.ledgerEntries.reduce((sum, l) => sum + Number(l.amount), 0),
      );
      const debits = 0;
      const balance = credits - debits;
      return {
        id: u.id,
        email: u.email,
        status: u.status,
        kycStatus: u.kycStatus,
        emailVerified: u.emailVerified,
        fullName: u.profile?.fullName || null,
        country: u.profile?.country || null,
        currency: u.investmentAccount?.currency || 'USD',
        totalDeposits: Number(
          u.deposits.reduce((sum, d) => sum + Number(d.amount), 0),
        ),
        balance,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      };
    });

    return { items: mapped, total, page, pageSize };
  }

  async getOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        status: true,
        kycStatus: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
        profile: true,
        investmentAccount: true,
        deposits: { orderBy: { createdAt: 'desc' }, take: 10 },
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 },
        testReturns: { orderBy: { createdAt: 'desc' }, take: 10 },
        securityEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      ...user,
      deposits: user.deposits.map((d) => ({ ...d, amount: Number(d.amount) })),
      withdrawals: user.withdrawals.map((w) => ({
        ...w,
        amount: Number(w.amount),
        fee: Number(w.fee),
        netAmount: w.netAmount === null ? null : Number(w.netAmount),
      })),
      testReturns: user.testReturns.map((r) => ({
        ...r,
        creditAmount: Number(r.creditAmount),
        principalAmount: Number(r.principalAmount),
      })),
    };
  }

  async updateStatus(admin: AdminActor, userId: string, data: { status: string; reason?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: userId },
        data: { status: data.status as never },
      });
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'UPDATE_USER_STATUS',
          targetType: 'USER',
          targetId: userId,
          detail: { from: user.status, to: data.status, reason: data.reason },
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'UPDATE_USER_STATUS',
          targetType: 'USER',
          targetId: userId,
          oldValue: { status: user.status },
          newValue: { status: data.status },
          reason: data.reason,
        },
      });
      if (data.status === 'SUSPENDED' || data.status === 'CLOSED') {
        await tx.securityEvent.create({
          data: {
            userId,
            eventType: 'ACCOUNT_STATUS_CHANGED',
            detail: { to: data.status, by: admin.email, reason: data.reason },
          },
        });
      }
      return result;
    });

    return { id: updated.id, status: updated.status };
  }

  async stats() {
    const [users, active, suspended, pending, kycPending, deposits, successDeposits, withdrawals, pendingWithdrawals, testCredits, recent] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.user.count({ where: { status: 'PENDING' } }),
        this.prisma.user.count({ where: { kycStatus: { in: ['PENDING', 'NOT_SUBMITTED'] } } }),
        this.prisma.deposit.count(),
        this.prisma.deposit.aggregate({
          where: { status: 'SUCCESSFUL' },
          _sum: { amount: true },
        }),
        this.prisma.withdrawal.count(),
        this.prisma.withdrawal.aggregate({
          where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.testReturnRecord.aggregate({
          where: { status: 'CREDITED' },
          _sum: { creditAmount: true },
        }),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, email: true, status: true, createdAt: true, profile: { select: { fullName: true } } },
        }),
      ]) as [
        number, number, number, number, number, number,
        { _sum: { amount: unknown } }, number,
        { _sum: { amount: unknown }; _count: number },
        { _sum: { creditAmount: unknown } },
        Array<Record<string, unknown>>,
      ];

    return {
      users,
      activeUsers: active,
      suspendedUsers: suspended,
      pendingUsers: pending,
      kycPending,
      deposits: {
        total: deposits,
        successful: successDeposits._sum.amount === null ? 0 : Number(successDeposits._sum.amount),
      },
      withdrawals: {
        total: withdrawals,
        pending: pendingWithdrawals._sum.amount === null ? 0 : Number(pendingWithdrawals._sum.amount),
      },
      testCredits: {
        total: testCredits._sum.creditAmount === null ? 0 : Number(testCredits._sum.creditAmount),
      },
      recentUsers: recent.map((r: unknown) => {
        const row = r as { id: string; email: string; status: string; createdAt: Date; profile: { fullName?: string | null } | null };
        return {
          id: row.id,
          email: row.email,
          fullName: row.profile?.fullName || null,
          status: row.status,
          createdAt: row.createdAt,
        };
      }),
    };
  }
}