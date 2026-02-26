/**
 * Response Worker
 * Sends auto-replies to matched comments with rate limiting
 */

import { Worker, Job } from 'bullmq';
import { Platform, AutoReplyRule } from '@prisma/client';
import { connection } from '../lib/queues';
import { sendResponse } from '../services/response-sender.service';

interface ResponseJobData {
  comment: {
    id: string;
    text: string;
    author: string;
    authorId: string;
    videoId: string;
    platform: Platform;
    publishedAt: Date;
  };
  rule: AutoReplyRule;
  logId?: string;
  matchedKeyword?: string;
  aiConfidenceScore?: number;
}

/**
 * Worker to send responses
 */
export const responseWorker = new Worker<ResponseJobData>(
  'response',
  async (job: Job<ResponseJobData>) => {
    const { comment, rule, matchedKeyword, aiConfidenceScore } = job.data;

    console.log(`[Response Worker] Sending response for comment ${comment.id} using rule ${rule.id}`);

    try {
      const result = await sendResponse(comment, rule, rule.userId, matchedKeyword, aiConfidenceScore);

      if (!result.success) {
        throw new Error(result.errorMessage || 'Failed to send response');
      }

      console.log(`[Response Worker] Successfully sent response to comment ${comment.id}`);
    } catch (error) {
      console.error(`[Response Worker] Error sending response to comment ${comment.id}:`, error);
      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 3, // Send 3 responses at a time (to avoid rate limits)
    limiter: {
      max: 20, // Max 20 responses
      duration: 60000, // Per minute
    },
  }
);

responseWorker.on('completed', (job) => {
  console.log(`[Response Worker] Job ${job.id} completed`);
});

responseWorker.on('failed', (job, err) => {
  console.error(`[Response Worker] Job ${job?.id} failed:`, err);
});

console.log('[Response Worker] Started and waiting for jobs');
