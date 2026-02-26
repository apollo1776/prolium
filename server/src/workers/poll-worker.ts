/**
 * Poll Worker
 * Schedules and executes comment polling for all active users
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection } from '../lib/queues';
import { pollAllPlatforms } from '../services/comment-poller.service';

const prisma = new PrismaClient();

interface PollJobData {
  userId: string;
}

/**
 * Worker to poll comments for a user
 */
export const pollWorker = new Worker<PollJobData>(
  'comment-poll',
  async (job: Job<PollJobData>) => {
    const { userId } = job.data;

    console.log(`[Poll Worker] Polling comments for user ${userId}`);

    try {
      await pollAllPlatforms(userId);
      console.log(`[Poll Worker] Successfully polled comments for user ${userId}`);
    } catch (error) {
      console.error(`[Poll Worker] Error polling for user ${userId}:`, error);
      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 users at a time
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  }
);

pollWorker.on('completed', (job) => {
  console.log(`[Poll Worker] Job ${job.id} completed`);
});

pollWorker.on('failed', (job, err) => {
  console.error(`[Poll Worker] Job ${job?.id} failed:`, err);
});

console.log('[Poll Worker] Started and waiting for jobs');
