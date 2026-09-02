import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import { SETTINGS_KEYS } from '../../../packages/shared/src/index';

const prisma = new PrismaClient();

const defaults: Array<{ key: string; value: unknown; description: string }> = [
  { key: SETTINGS_KEYS.TEST_RETURN_RATE, value: 0.02, description: 'Simulated return rate per test period (Phase 1)' },
  { key: SETTINGS_KEYS.TEST_RETURN_PERIOD_HOURS, value: 24, description: 'Completed period hours for a test credit' },
  { key: SETTINGS_KEYS.MINIMUM_DEPOSIT, value: 10, description: 'Minimum deposit amount' },
  { key: SETTINGS_KEYS.MAXIMUM_DEPOSIT, value: 100000, description: 'Maximum deposit amount' },
  { key: SETTINGS_KEYS.MINIMUM_WITHDRAWAL, value: 10, description: 'Minimum withdrawal amount' },
  { key: SETTINGS_KEYS.MAXIMUM_WITHDRAWAL, value: 50000, description: 'Maximum withdrawal amount' },
  { key: SETTINGS_KEYS.WITHDRAWAL_FEE, value: 0, description: 'Withdrawal fee' },
  { key: SETTINGS_KEYS.MAINTENANCE_MODE, value: false, description: 'Maintenance mode flag' },
  { key: SETTINGS_KEYS.REGISTRATION_ENABLED, value: true, description: 'Allow new registrations' },
  { key: SETTINGS_KEYS.WITHDRAWALS_ENABLED, value: true, description: 'Allow withdrawal requests' },
  { key: SETTINGS_KEYS.DEPOSITS_ENABLED, value: true, description: 'Allow deposits' },
];

async function main() {
  for (const s of defaults) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value as never, description: s.description },
      create: {
        key: s.key,
        value: s.value as never,
        description: s.description,
      },
    });
  }

  const adminEmail = 'admin@tradexa.com';
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const passwordHash = await hash('Admin@123');
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        active: true,
      },
    });
    console.log(`Created default admin: ${adminEmail} / Admin@123`);
  }

  console.log('Seeded default system settings');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
