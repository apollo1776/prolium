/**
 * Worker Orchestrator
 * Starts all workers and schedules periodic polling
 */

import { PrismaClient } from '@prisma/client';
import { commentPollQueue } from '../lib/queues';
import './poll-worker';
import './process-worker';
import './response-worker';
import './tokenRefreshWorker';
import { startTokenRefreshScheduler } from '../services/tokenRefreshService';

const prisma = new PrismaClient();

/**
 * Schedule polling jobs for all users with active rules
 */
const schedulePollJobs = async () => {
  try {
        if (!commentPollQueue) {
                console.log('[Scheduler] Redis not available, skipping poll scheduling');
                return;
        }
    // Find all users with active auto-reply rules
    const usersWithRules = await prisma.autoReplyRule.findMany({
      where: {
        isActive: true,
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    console.log(`[Scheduler] Found ${usersWithRules.length} users with active rules`);

    for (const { userId } of usersWithRules) {
      // Schedule polling job every 5 minutes
      await commentPollQueue.add(
        'poll-user',
        { userId },
        {
          repeat: {
            every: 5 * 60 * 1000, // 5 minutes
          },
          jobId: `poll-${userId}`, // Unique job ID to prevent duplicates
        }
      );
    }

    console.log(`[Scheduler] Scheduled polling for ${usersWithRules.length} users`);
  } catch (error) {
    console.error('[Scheduler] Error scheduling poll jobs:', error);
  }
};

/**
 * Start the worker system
 */
const startWorkers = async () => {
  console.log('[Workers] Starting Auto-Reply worker system...');

  // Schedule initial polling
  await schedulePollJobs();

  // Re-schedule polling every hour to pick up new users
  setInterval(schedulePollJobs, 60 * 60 * 1000); // 1 hour

  console.log('[Workers] Auto-Reply worker system started successfully');
  console.log('[Workers] Polling jobs scheduled and running');

  // Start token refresh scheduler
  console.log('[Workers] Starting Token Refresh scheduler...');
  startTokenRefreshScheduler();
  console.log('[Workers] Token Refresh scheduler started successfully');
};

// Handle graceful shutdown
const shutdown = async () => {
  console.log('[Workers] Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start workers
startWorkers().catch((error) => {
  console.error('[Workers] Failed to start:', error);
  process.exit(1);
});
