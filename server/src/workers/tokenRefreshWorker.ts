// src/workers/tokenRefreshWorker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import { refreshXToken } from '../services/x/xAuthService';
import { refreshTikTokToken } from '../services/tiktok/tiktokAuthService';
import { refreshInstagramToken } from '../services/instagram/instagramAuthService';

const prisma = new PrismaClient();

// Redis connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

interface TokenRefreshJob {
  userId: string;
  platform: 'X' | 'TIKTOK' | 'INSTAGRAM';
  connectionId: string;
}

/**
 * Token Refresh Worker
 * Processes token refresh jobs from the queue
 */
export const tokenRefreshWorker = new Worker<TokenRefreshJob>(
  'token-refresh',
  async (job: Job<TokenRefreshJob>) => {
    const { userId, platform, connectionId } = job.data;

    console.log(`[Token Refresh Worker] Processing ${platform} token refresh for user ${userId}`);

    try {
      // Get the current connection data
      const connection = await prisma.platformConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        console.error(`[Token Refresh Worker] Connection ${connectionId} not found`);
        return { success: false, error: 'Connection not found' };
      }

      if (!connection.refreshToken) {
        console.error(`[Token Refresh Worker] No refresh token for connection ${connectionId}`);
        return { success: false, error: 'No refresh token' };
      }

      let newAccessToken: string;
      let newRefreshToken: string;
      let expiresIn: number;

      // Refresh token based on platform
      switch (platform) {
        case 'X': {
          const refreshed = await refreshXToken(connection.refreshToken);
          newAccessToken = refreshed.accessToken;
          newRefreshToken = refreshed.refreshToken;
          expiresIn = 7200; // 2 hours
          break;
        }

        case 'TIKTOK': {
          const refreshed = await refreshTikTokToken(connection.refreshToken);
          newAccessToken = refreshed.accessToken;
          newRefreshToken = refreshed.refreshToken;
          expiresIn = refreshed.expiresIn;
          break;
        }

        case 'INSTAGRAM': {
          const refreshed = await refreshInstagramToken(connection.accessToken);
          newAccessToken = refreshed.accessToken;
          newRefreshToken = connection.refreshToken; // Instagram doesn't rotate refresh tokens
          expiresIn = refreshed.expiresIn;
          break;
        }

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Update the database with new tokens
      await prisma.platformConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          lastSynced: new Date(),
        },
      });

      console.log(`[Token Refresh Worker] Successfully refreshed ${platform} token for user ${userId}`);

      return {
        success: true,
        platform,
        userId,
        newExpiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } catch (error: any) {
      console.error(`[Token Refresh Worker] Error refreshing ${platform} token:`, error.message);

      // If refresh token is invalid, mark connection as inactive
      if (error.response?.status === 401 || error.response?.status === 400) {
        await prisma.platformConnection.update({
          where: { id: connectionId },
          data: { isActive: false },
        });
        console.log(`[Token Refresh Worker] Marked connection ${connectionId} as inactive due to invalid refresh token`);
      }

      throw error; // Re-throw to trigger retry logic
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 token refreshes simultaneously
  }
);

// Event handlers
tokenRefreshWorker.on('completed', (job: Job) => {
  console.log(`[Token Refresh Worker] Job ${job.id} completed successfully`);
});

tokenRefreshWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Token Refresh Worker] Job ${job?.id} failed:`, err.message);
});

tokenRefreshWorker.on('error', (err: Error) => {
  console.error('[Token Refresh Worker] Worker error:', err);
});

console.log('[Token Refresh Worker] Started and listening for jobs...');
