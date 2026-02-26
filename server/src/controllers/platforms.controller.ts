/**
 * Platforms Controller
 * Manages platform connections and data retrieval
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { YouTubeOAuthService } from '../services/oauth/youtube.service';
import { TikTokOAuthService } from '../services/oauth/tiktok.service';
import { InstagramOAuthService } from '../services/oauth/instagram.service';

const prisma = new PrismaClient();
const youtubeService = new YouTubeOAuthService();
const tiktokService = new TikTokOAuthService();
const instagramService = new InstagramOAuthService();

export class PlatformsController {
  /**
   * GET /api/platforms/connected
   * Get all connected platforms for user
   */
  static async getConnectedPlatforms(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const connections = await prisma.platformConnection.findMany({
        where: { userId },
        select: {
          id: true,
          platform: true,
          platformUserId: true,
          platformUsername: true,
          scopesGranted: true,
          connectedAt: true,
          lastSynced: true,
          isActive: true,
          tokenExpiresAt: true,
        },
      });

      res.json({
        success: true,
        connections,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'FetchFailed',
        message: 'Failed to fetch connected platforms',
      });
    }
  }

  /**
   * DELETE /api/platforms/:platform/disconnect
   * Disconnect a platform
   */
  static async disconnectPlatform(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { platform } = req.params;

      const platformUpper = platform.toUpperCase();

      let service;
      switch (platformUpper) {
        case 'YOUTUBE':
          service = youtubeService;
          break;
        case 'TIKTOK':
          service = tiktokService;
          break;
        case 'INSTAGRAM':
          service = instagramService;
          break;
        default:
          return res.status(400).json({
            error: 'InvalidPlatform',
            message: 'Invalid platform specified',
          });
      }

      await service.disconnect(userId);

      res.json({
        success: true,
        message: `${platform} disconnected successfully`,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'DisconnectFailed',
        message: 'Failed to disconnect platform',
      });
    }
  }

  /**
   * POST /api/platforms/:platform/refresh
   * Manually refresh platform token
   */
  static async refreshPlatformToken(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { platform } = req.params;

      const platformUpper = platform.toUpperCase();

      let service;
      switch (platformUpper) {
        case 'YOUTUBE':
          service = youtubeService;
          break;
        case 'TIKTOK':
          service = tiktokService;
          break;
        case 'INSTAGRAM':
          service = instagramService;
          break;
        default:
          return res.status(400).json({
            error: 'InvalidPlatform',
            message: 'Invalid platform specified',
          });
      }

      const connection = await service.getConnection(userId);
      if (!connection) {
        return res.status(404).json({
          error: 'NotConnected',
          message: `${platform} is not connected`,
        });
      }

      // Trigger refresh
      const newAccessToken = await service.getValidAccessToken(userId);

      if (!newAccessToken) {
        return res.status(400).json({
          error: 'RefreshFailed',
          message: 'Failed to refresh token. Please reconnect the platform.',
        });
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'RefreshFailed',
        message: 'Failed to refresh platform token',
      });
    }
  }

  /**
   * GET /api/platforms/:platform/sync-status
   * Get sync status for a platform
   */
  static async getSyncStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { platform } = req.params;

      const platformUpper = platform.toUpperCase() as any;

      const connection = await prisma.platformConnection.findUnique({
        where: {
          userId_platform: {
            userId,
            platform: platformUpper,
          },
        },
      });

      if (!connection) {
        return res.status(404).json({
          error: 'NotConnected',
          message: `${platform} is not connected`,
        });
      }

      const isExpired = connection.tokenExpiresAt
        ? connection.tokenExpiresAt < new Date()
        : false;

      res.json({
        success: true,
        platform: connection.platform,
        isActive: connection.isActive,
        isExpired,
        lastSynced: connection.lastSynced,
        tokenExpiresAt: connection.tokenExpiresAt,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'FetchFailed',
        message: 'Failed to fetch sync status',
      });
    }
  }
}
