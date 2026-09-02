import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import { prisma } from '@tradexa/database';
import { processTestReturns } from './jobs/test-return';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = { url: REDIS_URL };

export const testReturnQueue = new Queue('test-return', { connection });

export const worker = new Worker(
  'test-return',
  async (job) => {
    await processTestReturns((job.data || {}) as { dryRun?: boolean });
  },
  { connection },
);

worker.on('ready', () => console.log('TestReturnWorker ready'));
worker.on('completed', (job) => console.log(`TestReturnJob completed: ${job.id}`));
worker.on('failed', (job, err) =>
  console.error(`TestReturnJob failed: ${job?.id}`, err),
);

// Schedule the calculation every hour (catches missed periods and restarts).
testReturnQueue
  .upsertJobScheduler(
    'test-return-scheduler',
    { every: 60 * 60 * 1000 },
    { name: 'test-return-process', data: {} },
  )
  .then(() => console.log('TestReturn scheduler registered (hourly)'))
  .catch((err) => console.error('Failed to register scheduler', err));

export { prisma };
