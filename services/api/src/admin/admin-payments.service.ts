import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';

interface AdminActor {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
}

@Injectable()
export class AdminPaymentsService {
  constructor(private prisma: PrismaService) {}

  async listDeposits(params: { status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
    const where: Record<string, unknown> = {};
    if (params.status && params.status !== 'ALL') where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, profile: { select: { fullName: true } } } } },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return {
      items: items.map((d) => ({ ...d, amount: Number(d.amount) })),
      total,
      page,
      pageSize,
    };
  }

  async actionDeposit(
    admin: AdminActor,
    id: string,
    data: { action: 'confirm' | 'reject'; reason?: string },
  ) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== 'PENDING' && deposit.status !== 'PROCESSING') {
      throw new BadRequestException(
        `Deposit is already ${deposit.status.toLowerCase()}`,
      );
    }

    if (data.action === 'confirm') {
      return this.confirmDeposit(admin, deposit);
    }
    return this.rejectDeposit(admin, deposit, data.reason);
  }

  private async confirmDeposit(
    admin: AdminActor,
    deposit: {
      id: string;
      userId: string;
      accountId: string;
      amount: Decimal;
      currency: string;
      internalTransactionId: string;
    },
  ) {
    const amount = Number(deposit.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      const lastLedger = await tx.ledgerEntry.findFirst({
        where: { accountId: deposit.accountId },
        orderBy: { createdAt: 'desc' },
      });
      const prevBalance = Number(lastLedger?.balanceAfter ?? 0);
      const balanceAfter = new Decimal(prevBalance + amount);

      const transaction = await tx.transaction.create({
        data: {
          accountId: deposit.accountId,
          userId: deposit.userId,
          type: 'DEPOSIT',
          amount: deposit.amount,
          currency: deposit.currency,
          status: 'SUCCESSFUL',
          reference: deposit.internalTransactionId,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: deposit.userId,
          accountId: deposit.accountId,
          transactionId: transaction.id,
          entryType: 'DEPOSIT',
          amount: deposit.amount,
          currency: deposit.currency,
          direction: 'CREDIT',
          balanceAfter,
          description: `Deposit confirmed (${deposit.currency} ${amount.toFixed(2)})`,
          reference: deposit.internalTransactionId,
        },
      });

      const updated = await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'SUCCESSFUL',
          confirmedAt: new Date(),
          confirmedBy: admin.email,
          transactionId: transaction.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT_CONFIRMED',
          title: 'Deposit confirmed',
          body: `Your deposit of ${deposit.currency} ${amount.toFixed(2)} has been confirmed and credited to your account.`,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'CONFIRM_DEPOSIT',
          targetType: 'DEPOSIT',
          targetId: deposit.id,
          detail: { amount },
        },
      });

      return updated;
    });

    return { ...result, amount: Number(result.amount) };
  }

  private async rejectDeposit(
    admin: AdminActor,
    deposit: {
      id: string;
      userId: string;
      amount: Decimal;
      currency: string;
    },
    reason?: string,
  ) {
    const amount = Number(deposit.amount);
    await this.prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'FAILED',
          metadata: { rejectionReason: reason || 'Rejected by administrator' },
        },
      });
      await tx.notification.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT_FAILED',
          title: 'Deposit failed',
          body: `Your deposit of ${deposit.currency} ${amount.toFixed(2)} could not be confirmed.${reason ? ` Reason: ${reason}` : ''}`,
        },
      });
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'REJECT_DEPOSIT',
          targetType: 'DEPOSIT',
          targetId: deposit.id,
          detail: { amount, reason },
        },
      });
    });
    return { id: deposit.id, status: 'FAILED' };
  }

  async listWithdrawals(params: { status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
    const where: Record<string, unknown> = {};
    if (params.status && params.status !== 'ALL') where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, profile: { select: { fullName: true } } } } },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      items: items.map((w) => ({
        ...w,
        amount: Number(w.amount),
        fee: Number(w.fee),
        netAmount: w.netAmount === null ? null : Number(w.netAmount),
      })),
      total,
      page,
      pageSize,
    };
  }

  async actionWithdrawal(
    admin: AdminActor,
    id: string,
    data: { action: 'approve' | 'reject' | 'complete'; reason?: string },
  ) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');

    switch (data.action) {
      case 'approve':
        if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'UNDER_REVIEW') {
          throw new BadRequestException(`Cannot approve a ${withdrawal.status.toLowerCase()} withdrawal`);
        }
        return this.approveWithdrawal(admin, withdrawal);
      case 'reject':
        if (withdrawal.status === 'COMPLETED' || withdrawal.status === 'REJECTED') {
          throw new BadRequestException('Withdrawal is already finalized');
        }
        return this.rejectWithdrawal(admin, withdrawal, data.reason);
      case 'complete':
        if (withdrawal.status !== 'PROCESSING') {
          throw new BadRequestException('Withdrawal must be approved before completing');
        }
        return this.completeWithdrawal(admin, withdrawal);
    }
  }

  private async approveWithdrawal(
    admin: AdminActor,
    withdrawal: { id: string; userId: string; amount: Decimal; currency: string; network?: string },
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: 'PROCESSING', approvedAt: new Date(), processedBy: admin.email },
      });
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL_APPROVED',
          title: 'Withdrawal approved',
          body: `Your withdrawal request is approved and being processed.`,
        },
      });
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'APPROVE_WITHDRAWAL',
          targetType: 'WITHDRAWAL',
          targetId: withdrawal.id,
          detail: { amount: Number(withdrawal.amount) },
        },
      });
      return updated;
    });
    return { id: result.id, status: result.status };
  }

  private async rejectWithdrawal(
    admin: AdminActor,
    withdrawal: { id: string; userId: string; amount: Decimal; currency: string },
    reason?: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: 'REJECTED', failureReason: reason || 'Rejected by administrator' },
      });
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL_REJECTED',
          title: 'Withdrawal rejected',
          body: `Your withdrawal request was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        },
      });
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'REJECT_WITHDRAWAL',
          targetType: 'WITHDRAWAL',
          targetId: withdrawal.id,
          detail: { amount: Number(withdrawal.amount), reason },
        },
      });
    });
    return { id: withdrawal.id, status: 'REJECTED' };
  }

  private async completeWithdrawal(
    admin: AdminActor,
    withdrawal: {
      id: string;
      userId: string;
      accountId: string;
      amount: Decimal;
      fee: Decimal;
      netAmount: Decimal | null;
      currency: string;
    },
  ) {
    const amount = Number(withdrawal.amount);
    const fee = Number(withdrawal.fee);

    const result = await this.prisma.$transaction(async (tx) => {
      const lastLedger = await tx.ledgerEntry.findFirst({
        where: { accountId: withdrawal.accountId },
        orderBy: { createdAt: 'desc' },
      });
      const prevBalance = Number(lastLedger?.balanceAfter ?? 0);
      if (prevBalance < amount) {
        throw new BadRequestException(
          `Insufficient balance to complete withdrawal (balance ${prevBalance.toFixed(2)}, required ${amount.toFixed(2)})`,
        );
      }

      const transaction = await tx.transaction.create({
        data: {
          accountId: withdrawal.accountId,
          userId: withdrawal.userId,
          type: 'WITHDRAWAL',
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          status: 'SUCCESSFUL',
          reference: `withdrawal-${withdrawal.id}`,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: withdrawal.userId,
          accountId: withdrawal.accountId,
          transactionId: transaction.id,
          entryType: 'WITHDRAWAL',
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          direction: 'DEBIT',
          balanceAfter: new Decimal(prevBalance - amount),
          description: `Withdrawal ${withdrawal.currency} ${amount.toFixed(2)}${fee > 0 ? ` (fee ${fee.toFixed(2)})` : ''}`,
          reference: `withdrawal-${withdrawal.id}`,
        },
      });

      const updated = await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          processedBy: admin.email,
          transactionId: transaction.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL_COMPLETED',
          title: 'Withdrawal completed',
          body: `Your withdrawal of ${withdrawal.currency} ${amount.toFixed(2)} has been completed.`,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'COMPLETE_WITHDRAWAL',
          targetType: 'WITHDRAWAL',
          targetId: withdrawal.id,
          detail: { amount, fee },
        },
      });

      return updated;
    });

    return { id: result.id, status: result.status };
  }
}