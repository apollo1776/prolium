/**
 * BullMQ Queue Configuration
 * Defines queues for comment polling, processing, and responding
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

let connection: Redis | null = null;

// Only initialize Redis if explicitly enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

if (REDIS_ENABLED) {
  try {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    connection.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
    });

    connection.on('ready', () => {
      console.log('[Redis] Connected successfully');
    });
  } catch (err: any) {
    console.warn('[Redis] Failed to initialize:', err.message);
    connection = null;
  }
} else {
  console.log('[Redis] Disabled - auto-reply worker features not available');
  console.log('[Redis] To enable: Install Redis and set REDIS_ENABLED=true in .env');
}

// Queues (will be null if Redis is not available)
export let commentPollQueue: Queue | null = null;
export let commentProcessQueue: Queue | null = null;
export let responseQueue: Queue | null = null;
export let commentPollEvents: QueueEvents | null = null;
export let commentProcessEvents: QueueEvents | null = null;
export let responseEvents: QueueEvents | null = null;

if (connection) {
  // Queue for polling comments from platforms
  commentPollQueue = new Queue('comment-poll', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failures for 7 days
      },
    },
  });

  // Queue for processing comments against rules
  commentProcessQueue = new Queue('comment-process', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    },
  });

  // Queue for sending responses
  responseQueue = new Queue('response', {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    },
  });

  // Queue events for monitoring
  commentPollEvents = new QueueEvents('comment-poll', { connection });
  commentProcessEvents = new QueueEvents('comment-process', { connection });
  responseEvents = new QueueEvents('response', { connection });
}

// Graceful shutdown
export const closeQueues = async () => {
  if (commentPollQueue) await commentPollQueue.close();
  if (commentProcessQueue) await commentProcessQueue.close();
  if (responseQueue) await responseQueue.close();
  if (commentPollEvents) await commentPollEvents.close();
  if (commentProcessEvents) await commentProcessEvents.close();
  if (responseEvents) await responseEvents.close();
  if (connection) await connection.quit();
};

// Export connection for workers
export { connection };
