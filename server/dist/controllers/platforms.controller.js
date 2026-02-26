"use strict";
/**
 * Platforms Controller
 * Manages platform connections and data retrieval
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformsController = void 0;
const client_1 = require("@prisma/client");
const youtube_service_1 = require("../services/oauth/youtube.service");
const tiktok_service_1 = require("../services/oauth/tiktok.service");
const instagram_service_1 = require("../services/oauth/instagram.service");
const prisma = new client_1.PrismaClient();
const youtubeService = new youtube_service_1.YouTubeOAuthService();
const tiktokService = new tiktok_service_1.TikTokOAuthService();
const instagramService = new instagram_service_1.InstagramOAuthService();
class PlatformsController {
    /**
     * GET /api/platforms/connected
     * Get all connected platforms for user
     */
    static async getConnectedPlatforms(req, res) {
        try {
            const userId = req.user.userId;
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
        }
        catch (error) {
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
    static async disconnectPlatform(req, res) {
        try {
            const userId = req.user.userId;
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
        }
        catch (error) {
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
    static async refreshPlatformToken(req, res) {
        try {
            const userId = req.user.userId;
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
        }
        catch (error) {
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
    static async getSyncStatus(req, res) {
        try {
            const userId = req.user.userId;
            const { platform } = req.params;
            const platformUpper = platform.toUpperCase();
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
        }
        catch (error) {
            res.status(500).json({
                error: 'FetchFailed',
                message: 'Failed to fetch sync status',
            });
        }
    }
}
exports.PlatformsController = PlatformsController;
//# sourceMappingURL=platforms.controller.js.map