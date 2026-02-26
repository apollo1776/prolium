/**
 * Process Worker
 * Processes comments against auto-reply rules
 */

import { Worker, Job } from 'bullmq';
import { Platform } from '@prisma/client';
import { connection } from '../lib/queues';
import { processComment } from '../services/comment-processor.service';

interface ProcessJobData {
  comment: {
    id: string;
    text: string;
    author: string;
    authorId: string;
    videoId: string;
    platform: Platform;
    publishedAt: Date;
  };
  userId: string;
}

/**
 * Worker to process comments against rules
 */
export const processWorker = new Worker<ProcessJobData>(
  'comment-process',
  async (job: Job<ProcessJobData>) => {
    const { comment, userId } = job.data;

    console.log(`[Process Worker] Processing comment ${comment.id} for user ${userId}`);

    try {
      await processComment(comment, userId);
      console.log(`[Process Worker] Successfully processed comment ${comment.id}`);
    } catch (error) {
      console.error(`[Process Worker] Error processing comment ${comment.id}:`, error);
      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 comments at a time
    limiter: {
      max: 50, // Max 50 jobs
      duration: 60000, // Per minute (rate limit for OpenAI API)
    },
  }
);

processWorker.on('completed', (job) => {
  console.log(`[Process Worker] Job ${job.id} completed`);
});

processWorker.on('failed', (job, err) => {
  console.error(`[Process Worker] Job ${job?.id} failed:`, err);
});

console.log('[Process Worker] Started and waiting for jobs');
