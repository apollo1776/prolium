// src/services/tokenRefreshService.ts
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';

const prisma = new PrismaClient();

// Redis connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Create token refresh queue
export const tokenRefreshQueue = new Queue('token-refresh', { connection });

/**
 * Schedule token refresh jobs for all connected platforms
 * This should be run periodically (e.g., every 6 hours) via cron or scheduler
 */
export async function scheduleTokenRefreshJobs() {
  console.log('[Token Refresh] Checking for tokens that need refresh...');

  const now = new Date();

  // X (Twitter) tokens - expire in 2 hours, refresh if < 5 minutes left
  const xConnections = await prisma.platformConnection.findMany({
    where: {
      platform: 'X',
      isActive: true,
      tokenExpiresAt: {
        lt: new Date(now.getTime() + 5 * 60 * 1000), // less than 5 minutes
      },
    },
  });

  for (const connection of xConnections) {
    await tokenRefreshQueue.add(
      'refresh-x-token',
      {
        userId: connection.userId,
        platform: 'X',
        connectionId: connection.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );
    console.log(`[Token Refresh] Scheduled X token refresh for user ${connection.userId}`);
  }

  // TikTok tokens - expire in 24 hours, refresh if < 2 hours left
  const tiktokConnections = await prisma.platformConnection.findMany({
    where: {
      platform: 'TIKTOK',
      isActive: true,
      tokenExpiresAt: {
        lt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // less than 2 hours
      },
    },
  });

  for (const connection of tiktokConnections) {
    await tokenRefreshQueue.add(
      'refresh-tiktok-token',
      {
        userId: connection.userId,
        platform: 'TIKTOK',
        connectionId: connection.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );
    console.log(`[Token Refresh] Scheduled TikTok token refresh for user ${connection.userId}`);
  }

  // Instagram tokens - expire in 60 days, refresh if < 10 days left
  const instagramConnections = await prisma.platformConnection.findMany({
    where: {
      platform: 'INSTAGRAM',
      isActive: true,
      tokenExpiresAt: {
        lt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // less than 10 days
      },
    },
  });

  for (const connection of instagramConnections) {
    await tokenRefreshQueue.add(
      'refresh-instagram-token',
      {
        userId: connection.userId,
        platform: 'INSTAGRAM',
        connectionId: connection.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );
    console.log(`[Token Refresh] Scheduled Instagram token refresh for user ${connection.userId}`);
  }

  console.log('[Token Refresh] Token refresh scheduling complete');
}

/**
 * Start the periodic token refresh scheduler
 * Runs every 6 hours
 */
export function startTokenRefreshScheduler() {
  console.log('[Token Refresh Scheduler] Starting...');

  // Run immediately on startup
  scheduleTokenRefreshJobs();

  // Run every 6 hours
  setInterval(
    () => {
      scheduleTokenRefreshJobs();
    },
    6 * 60 * 60 * 1000
  );

  console.log('[Token Refresh Scheduler] Running every 6 hours');
}
