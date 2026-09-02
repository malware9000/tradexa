import 'dotenv/config';
import { Worker } from 'bullmq';
import { prisma } from '@tradexa/database';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = { url: REDIS_URL };

interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  body: string;
  channel?: string;
}

// Consumes notification jobs and delivers via configured channels.
// Phase 1: in-app delivery (records written directly by producers).
// Future: email, push, SMS providers plugged in here.
const worker = new Worker<NotificationJob>(
  'notifications',
  async (job) => {
    const { userId, type, title, body, channel = 'IN_APP' } = job.data;

    if (channel === 'IN_APP') {
      await prisma.notification.create({
        data: {
          userId,
          type: type as never,
          title,
          body,
          channel,
        },
      });
      return;
    }

    // Future email/sms/push dispatch would go here.
    console.log(`[notification-service] ${channel} not implemented for ${type}`);
  },
  { connection },
);

worker.on('ready', () => console.log('NotificationWorker ready'));
worker.on('failed', (job, err) =>
  console.error(`NotificationJob failed: ${job?.id}`, err),
);
