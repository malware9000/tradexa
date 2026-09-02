import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';

interface SettingsMap {
  [key: string]: unknown;
}

function toNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  private async getSettings(): Promise<SettingsMap> {
    const rows = await this.prisma.systemSetting.findMany();
    const map: SettingsMap = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  }

  private async getAccount(userId: string) {
    const account = await this.prisma.investmentAccount.findUnique({
      where: { userId },
    });
    if (!account) {
      throw new NotFoundException('Investment account not found');
    }
    return account;
  }

  private async getBalance(accountId: string): Promise<number> {
    const agg = await this.prisma.ledgerEntry.aggregate({
      where: { accountId },
      _sum: { amount: true },
      _count: true,
    });
    const debits = await this.prisma.ledgerEntry.aggregate({
      where: { accountId, direction: 'DEBIT' },
      _sum: { amount: true },
    });
    const total = Number(agg._sum.amount ?? 0);
    const debit = Number(debits._sum.amount ?? 0);
    return total - debit * 2;
  }

  async getSummary(userId: string) {
    const account = await this.getAccount(userId);

    const [balance, deposits, credits, pendingWithdrawals, user, transactions] =
      await Promise.all([
        this.getBalance(account.id),
        this.prisma.deposit.aggregate({
          where: { accountId: account.id, status: 'SUCCESSFUL' },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.testReturnRecord.aggregate({
          where: { accountId: account.id, status: 'CREDITED' },
          _sum: { creditAmount: true },
          _count: true,
        }),
        this.prisma.withdrawal.aggregate({
          where: { accountId: account.id, status: { in: ['PENDING', 'PROCESSING', 'UNDER_REVIEW'] } },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.transaction.findMany({
          where: { accountId: account.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const totalDeposits = Number(deposits._sum.amount ?? 0);
    const totalTestCredits = Number(credits._sum.creditAmount ?? 0);
    const pendingWithdrawal = Number(pendingWithdrawals._sum.amount ?? 0);
    const settings = await this.getSettings();
    const rate = toNumber(settings.test_return_rate, 0.02);
    const periodHours = toNumber(settings.test_return_period_hours, 24);
    const projectedYearlyRate =
      (Math.pow(1 + rate, (365 * 24) / periodHours) - 1) * 100;

    return {
      accountId: account.id,
      currency: account.currency || 'USD',
      balance,
      totalDeposits,
      totalDepositsCount: deposits._count,
      totalTestCredits,
      totalTestCreditsCount: credits._count,
      depositReturnRate: rate,
      periodHours,
      projectedYearlyRate,
      pendingWithdrawal,
      pendingWithdrawalCount: pendingWithdrawals._count,
      memberSince: user?.createdAt,
      recentActivity: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
      })),
    };
  }

  async listDeposits(userId: string) {
    const account = await this.getAccount(userId);
    const rows = await this.prisma.deposit.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((d) => ({ ...d, amount: Number(d.amount) }));
  }

  async createDeposit(
    userId: string,
    data: { amount: number; currency: string; provider: string },
  ) {
    const account = await this.getAccount(userId);
    const settings = await this.getSettings();

    if (settings.deposits_enabled === false) {
      throw new BadRequestException('Deposits are currently disabled');
    }

    const min = toNumber(settings.minimum_deposit, 10);
    const max = toNumber(settings.maximum_deposit, 100000);
    if (data.amount < min) {
      throw new BadRequestException(
        `Minimum deposit is ${data.currency} ${min.toFixed(2)}`,
      );
    }
    if (data.amount > max) {
      throw new BadRequestException(
        `Maximum deposit is ${data.currency} ${max.toFixed(2)}`,
      );
    }

    const currency = (data.currency || 'USD').toUpperCase();
    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        accountId: account.id,
        amount: new Decimal(data.amount.toFixed(2)),
        currency,
        paymentProvider: data.provider || 'TEST',
        internalTransactionId: `dep-${randomUUID()}`,
        status: 'PENDING',
        metadata: {
          initiatedBy: 'USER',
          description: 'Deposit initiated on user dashboard',
        },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'DEPOSIT_INITIATED',
        title: 'Deposit initiated',
        body: `A deposit of ${currency} ${data.amount.toFixed(2)} is awaiting confirmation.`,
      },
    });

    return { ...deposit, amount: Number(deposit.amount) };
  }

  async listWithdrawals(userId: string) {
    const account = await this.getAccount(userId);
    const rows = await this.prisma.withdrawal.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((w) => ({
      ...w,
      amount: Number(w.amount),
      fee: Number(w.fee),
      netAmount: w.netAmount === null ? null : Number(w.netAmount),
    }));
  }

  async createWithdrawal(
    userId: string,
    data: { amount: number; currency: string; method?: string; destinationReference: string },
  ) {
    const account = await this.getAccount(userId);
    const settings = await this.getSettings();

    if (settings.withdrawals_enabled === false) {
      throw new BadRequestException('Withdrawals are currently disabled');
    }

    const min = toNumber(settings.minimum_withdrawal, 10);
    const max = toNumber(settings.maximum_withdrawal, 50000);
    const fee = toNumber(settings.withdrawal_fee, 0);

    if (data.amount < min) {
      throw new BadRequestException(
        `Minimum withdrawal is ${data.currency} ${min.toFixed(2)}`,
      );
    }
    if (data.amount > max) {
      throw new BadRequestException(
        `Maximum withdrawal is ${data.currency} ${max.toFixed(2)}`,
      );
    }

    const balance = await this.getBalance(account.id);
    const totalNeeded = data.amount + fee;
    if (balance < totalNeeded) {
      throw new BadRequestException(
        `Insufficient balance. You need ${data.currency} ${totalNeeded.toFixed(2)} (including ${fee.toFixed(2)} fee), your balance is ${data.currency} ${balance.toFixed(2)}.`,
      );
    }

    const currency = (data.currency || 'USD').toUpperCase();
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        accountId: account.id,
        amount: new Decimal(data.amount.toFixed(2)),
        currency,
        method: data.method || 'BANK_TRANSFER',
        destinationReference: data.destinationReference,
        fee: new Decimal(fee.toFixed(2)),
        netAmount: new Decimal((data.amount - fee).toFixed(2)),
        status: 'PENDING',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'WITHDRAWAL_REQUESTED',
        title: 'Withdrawal requested',
        body: `Your withdrawal request of ${currency} ${data.amount.toFixed(2)} is pending review.`,
      },
    });

    return { ...withdrawal, amount: Number(withdrawal.amount), fee };
  }

  async listTransactions(userId: string) {
    const account = await this.getAccount(userId);
    const rows = await this.prisma.transaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((t) => ({ ...t, amount: Number(t.amount) }));
  }

  async listTestReturns(userId: string) {
    const account = await this.getAccount(userId);
    const rows = await this.prisma.testReturnRecord.findMany({
      where: { accountId: account.id },
      orderBy: { periodEnd: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      ...r,
      principalAmount: Number(r.principalAmount),
      creditAmount: Number(r.creditAmount),
      rate: Number(r.rate),
    }));
  }

  async getChart(userId: string) {
    const account = await this.getAccount(userId);
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        balanceAfter: true,
        entryType: true,
        amount: true,
        direction: true,
      },
    });
    return entries.map((e) => ({
      date: e.createdAt,
      balance: e.balanceAfter === null ? null : Number(e.balanceAfter),
      type: e.entryType,
      amount: Number(e.amount),
      direction: e.direction,
    }));
  }
}