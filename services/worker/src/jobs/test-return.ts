import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../main';
import { AccountStatus, EntryType, Direction } from '@tradexa/database';

interface ProcessOptions {
  dryRun?: boolean;
}

interface EngineSettings {
  rate: number;
  periodHours: number;
}

let settingsCache: EngineSettings | null = null;

async function getSettings(): Promise<EngineSettings> {
  if (settingsCache) return settingsCache;
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: ['test_return_rate', 'test_return_period_hours'] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  settingsCache = {
    rate: Number(map.get('test_return_rate') ?? 0.02),
    periodHours: Number(map.get('test_return_period_hours') ?? 24),
  };
  return settingsCache;
}

/**
 * Phase 1 test return engine.
 *
 * Rules:
 * - Uses server-side (UTC) timestamps only. Never trust client time.
 * - One test-credit per account per completed period (enforced by the
 *   unique constraint on [accountId, periodStart, periodEnd]).
 * - Idempotent: if a record already exists for the period it is skipped.
 * - Handles missed jobs / server restarts by replaying from the last credit.
 */
export async function processTestReturns({
  dryRun = false,
}: ProcessOptions = {}): Promise<void> {
  const settings = await getSettings();
  const now = new Date();
  const periodMs = settings.periodHours * 60 * 60 * 1000;

  const accounts = await prisma.investmentAccount.findMany({
    where: { status: AccountStatus.ACTIVE },
  });

  let credited = 0;

  for (const account of accounts) {
    const owner = await prisma.user.findUnique({ where: { id: account.userId } });
    if (!owner || owner.status !== 'ACTIVE') continue;

    const last = await prisma.testReturnRecord.findFirst({
      where: { accountId: account.id },
      orderBy: { periodEnd: 'desc' },
    });

    let cursor = last?.periodEnd ?? account.createdAt;
    const periods: Array<{ start: Date; end: Date }> = [];
    while (cursor.getTime() + periodMs <= now.getTime()) {
      const end = new Date(cursor.getTime() + periodMs);
      periods.push({ start: new Date(cursor), end });
      cursor = end;
    }

    for (const period of periods) {
      const existing = await prisma.testReturnRecord.findUnique({
        where: {
          accountId_periodStart_periodEnd: {
            accountId: account.id,
            periodStart: period.start,
            periodEnd: period.end,
          },
        },
      });
      if (existing) continue;

      const principalAgg = await prisma.deposit.aggregate({
        where: { accountId: account.id, status: 'SUCCESSFUL' },
        _sum: { amount: true },
      });
      const principal = Number(principalAgg._sum.amount ?? 0);
      const creditAmount = principal * settings.rate;

      if (creditAmount <= 0) continue;

      if (dryRun) {
        console.log(
          `[dry-run] would credit ${creditAmount.toFixed(2)} ${account.currency} to account ${account.id}`,
        );
        continue;
      }

      const currency = account.currency || 'USD';
      const creditDecimal = new Decimal(creditAmount.toFixed(2));
      const principalDecimal = new Decimal(principal.toFixed(2));
      const rateDecimal = new Decimal(settings.rate.toFixed(6));

      await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            accountId: account.id,
            userId: account.userId,
            type: EntryType.TEST_CREDIT,
            amount: creditDecimal,
            currency,
            status: 'SUCCESSFUL',
            reference: `test-credit-${account.id}-${period.start.toISOString()}`,
          },
        });

        const lastLedger = await tx.ledgerEntry.findFirst({
          where: { accountId: account.id },
          orderBy: { createdAt: 'desc' },
        });

        const prevBalance = Number(lastLedger?.balanceAfter ?? 0);
        const balanceAfter = new Decimal(prevBalance + creditAmount);

        const ledger = await tx.ledgerEntry.create({
          data: {
            userId: account.userId,
            accountId: account.id,
            transactionId: transaction.id,
            entryType: EntryType.TEST_CREDIT,
            amount: creditDecimal,
            currency,
            direction: Direction.CREDIT,
            balanceAfter,
            description: 'Simulated test credit',
            reference: `test-credit-${period.start.toISOString()}`,
          },
        });

        await tx.testReturnRecord.create({
          data: {
            userId: account.userId,
            accountId: account.id,
            transactionId: transaction.id,
            principalAmount: principalDecimal,
            rate: rateDecimal,
            periodStart: period.start,
            periodEnd: period.end,
            creditAmount: creditDecimal,
            currency,
            ledgerEntryId: ledger.id,
            status: 'CREDITED',
          },
        });

        await tx.notification.create({
          data: {
            userId: account.userId,
            type: 'TEST_CREDIT_POSTED',
            title: 'Test credit posted',
            body: `A simulated test credit of ${currency} ${creditAmount.toFixed(2)} was added to your account.`,
          },
        });
      });

      credited += 1;
    }
  }

  console.log(
    `[test-return] ${dryRun ? 'dry-run' : 'processed'} ${accounts.length} accounts, ${credited} credits at ${now.toISOString()}`,
  );
}
